import type { Subscription } from 'rxjs'

import { Buffer } from 'node:buffer'
import * as events from 'node:events'

import PQueue from 'p-queue'
import { debounceTime, fromEvent, Subject, timer } from 'rxjs'

import { EventType } from './EventType.js'
import { RainBirdClient } from './RainBirdClient.js'
import { AcknowledgedResponse } from './responses/AcknowledgedResponse.js'

interface RainBirdMetaData {
  modelNumber: number
  model: string
  version: string
  serialNumber: string
  zones: number[]
}

interface ZoneStatus {
  active: boolean
  queued: boolean
  running: boolean
  remainingDuration: number
  durationTime?: Date
}

interface ProgramZoneState {
  id: number
  timeRemaining?: number
  running: boolean
}

interface RainBirdState {
  program?: ProgramZoneState
  zones: ProgramZoneState[]
  runningZoneIndex?: number
  rainSensorSetPointReached: boolean
}

export class RainBirdService extends events.EventEmitter {
  private readonly _client: RainBirdClient

  private _metadata: RainBirdMetaData = {
    modelNumber: 0,
    model: 'Unknown',
    version: 'Unknown',
    serialNumber: 'Unknown',
    zones: [],
  }

  private _currentZoneStateSupported = true
  private _advanceZoneSupported = true
  private _currentZoneId = 0
  private _currentProgramId?: string
  private _zones: Record<number, ZoneStatus> = {}
  private _rainSetPointReached = false

  private _statusObsersable: any = fromEvent(this, 'status')
  private _statusTimerSubscription?: Subscription
  private _statusRefreshSubject = new Subject<void>()
  private _syncTime = false
  private _lastSupportWarning = 0

  private zoneQueue: PQueue = new PQueue({
    concurrency: 1,
    timeout: 3600000,
    autoStart: true,
  })

  private readonly ESP_ME3 = 0x0009

  constructor(
    private readonly options: {
      address: string
      password: string
      refreshRate?: number
      showRequestResponse: boolean
      syncTime: boolean
    },
  ) {
    super()
    this.setMaxListeners(50)
    this._syncTime = options.syncTime

    this._client = new RainBirdClient(options.address, options.password, options.showRequestResponse)
    this._client.on(EventType.LOG, (log) => {
      this.emitLog(log.level, log.message)
    })

    this._statusRefreshSubject
      .pipe(
        debounceTime(1000),
      )
      .subscribe(async () => await this.performStatusRefresh())
  }

  /**
   * Emit a log event.
   * @param level The log level.
   * @param message The log message.
   */
  public emitLog(level: string, message: string): void {
    this.emit('log', { level, message })
  }

  async init(): Promise<RainBirdMetaData> {
    this.emitLog('debug', 'Init')

    const respModelAndVersion = await this._client.getModelAndVersion()
    const respSerialNumber = await this._client.getSerialNumber()
    const respZones = await this._client.getAvailableZones()

    this._metadata = {
      modelNumber: respModelAndVersion.modelNumber,
      model: respModelAndVersion.modelName,
      version: respModelAndVersion.version,
      serialNumber: respSerialNumber.serialNumber,
      zones: respZones.zones,
    }

    // Initialise zones
    for (const zone of respZones.zones) {
      this._zones[zone] = {
        active: false,
        queued: false,
        running: false,
        remainingDuration: 0,
        durationTime: undefined,
      }
    }

    const irrigationState = (await this._client.getIrrigationState()).irrigationState
    if (!irrigationState) {
      this.emitLog('warn', 'RainBird controller is currently OFF. Please turn ON so plugin can control it')
    }

    // Sync time
    if (this._syncTime) {
      await this.setControllerDateTime()
      setInterval(async () => {
        await this.setControllerDateTime()
      }, 3600000) // every hour
    }

    await this.updateStatus()

    this.setStatusTimer()

    return this._metadata
  }

  get model(): string {
    return this._metadata.model
  }

  get version(): string {
    return this._metadata.version
  }

  get serialNumber(): string {
    return this._metadata.serialNumber
  }

  get zones(): number[] {
    return this._metadata.zones
  }

  get rainSetPointReached(): boolean {
    return this._rainSetPointReached
  }

  isActive(zone?: number): boolean {
    return zone === undefined
      ? Object.values(this._zones).some(z => z.active || z.queued)
      : this._zones[zone].active || this._zones[zone].queued
  }

  isInUse(zone?: number): boolean {
    return zone === undefined
      ? Object.values(this._zones).some(z => z.running)
      : this._zones[zone].running
  }

  remainingDuration(zone?: number): number {
    if (zone === undefined) {
      let remaining = 0
      for (const zone of this.zones) {
        remaining += this.calcRemainingDuration(zone)
      }
      return remaining
    }
    return this.calcRemainingDuration(zone)
  }

  private calcRemainingDuration(zone: number): number {
    if (!this._zones[zone].active && !this._zones[zone].queued) {
      return 0
    }
    const remaining = this._zones[zone].durationTime === undefined
      ? this._zones[zone].remainingDuration
      : this._zones[zone].remainingDuration - Math.round(
        (Date.now() - this._zones[zone].durationTime!.getTime()) / 1000,
      )

    return Math.max(remaining, 0)
  }

  activateZone(zone: number, duration: number): void {
    this.emitLog('debug', `Zone ${zone}: Activate for ${duration} seconds`)

    this._zones[zone].queued = true
    this._zones[zone].remainingDuration = duration
    this.zoneQueue.add(this.startZone.bind(this, zone, duration)).catch((error) => {
      this.emitLog('warn', `Zone ${zone}: Queue error [${error}]`)
    })
  }

  async deactivateZone(zone: number): Promise<void> {
    this.emitLog('debug', `Zone ${zone}: Deactivate`)

    this._zones[zone].active = false
    this._zones[zone].queued = false

    if (this.isInUse(zone)) {
      if (this._advanceZoneSupported) {
        const response = await this._client.advanceZone()
        this._advanceZoneSupported = response instanceof AcknowledgedResponse
      }
      if (!this._advanceZoneSupported) {
        await this._client.stopIrrigation()
      }
      this._statusRefreshSubject.next()
    }
  }

  deactivateAllZones(): void {
    for (const zone of this.zones) {
      this._zones[zone].active = false
      this._zones[zone].queued = false
    }
  }

  enableZone(zone: number, enabled: boolean): void {
    this.emit(EventType.ZONE_ENABLE, zone, enabled)
  }

  async startProgram(programId: string): Promise<void> {
    this.emitLog('info', `Program ${programId}: Start`)

    const programNumber = this.getProgramNumber(programId)
    await this._client.runProgram(programNumber)
    await this.updateStatus()
  }

  isProgramRunning(programId: string): boolean | undefined {
    // NOTE: If plugin is not able to determine if program is running then return undefined
    return this._currentProgramId === undefined
      ? undefined
      : this._currentProgramId === programId && this.isInUse()
  }

  private getProgramNumber(programId: string): number {
    return programId.charCodeAt(0) - 65
  }

  private getProgramId(programNumber?: number): string | undefined {
    if (programNumber === undefined) {
      return undefined
    }
    return String.fromCharCode(programNumber + 65)
  }

  async stopIrrigation(): Promise<void> {
    this.emitLog('info', 'Stop Irrigation')

    await this._client.stopIrrigation()
    await this.updateStatus()
  }

  private async startZone(zone: number, duration: number): Promise<void> {
    this.emitLog('debug', `Zone ${zone}: Start for ${duration} seconds`)

    try {
      this._statusTimerSubscription?.unsubscribe()
      await this.updateStatus()

      if (!this.isActive(zone)) {
        this.emitLog('info', `Zone ${zone}: Skipped as it is not active`)
        return
      }

      if (this._currentZoneId !== 0) {
        this.setStatusTimer()

        let status: Subscription | undefined

        await new Promise((resolve) => {
          status = this._statusObsersable.subscribe(() => {
            if (this._currentZoneId === 0) {
              resolve('')
            }
          })
        })
        status?.unsubscribe()
        this._statusTimerSubscription?.unsubscribe()
      }

      if (!this.isActive(zone)) {
        this.emitLog('info', `Zone ${zone}: Skipped as it is not active`)
        return
      }

      if (this.isInUse(zone)) {
        this.emitLog('info', `Zone ${zone}: Skipped as it is already in use`)
        return
      }

      this.emitLog('info', `Zone ${zone}: Start [Duration: ${this.formatTime(duration)}]`)

      await this._client.runZone(zone, duration)
      this._zones[zone].queued = false

      if (!this._currentZoneStateSupported) {
        this._zones[zone].remainingDuration = duration
        this._zones[zone].durationTime = new Date()
      }
    } catch (error) {
      this.emitLog('warn', `Zone ${zone}: Failed to start [${error}]`)
    } finally {
      this._statusRefreshSubject.next()
    }
  }

  private setStatusTimer(): void {
    this._statusTimerSubscription?.unsubscribe()

    let timerDuration = this.options.refreshRate ?? 0
    if (this._currentZoneId !== 0) {
      const remainingDuration = this._zones[this._currentZoneId].remainingDuration
      if (remainingDuration > 0) {
        timerDuration = timerDuration === 0
          ? remainingDuration
          : Math.min(timerDuration, remainingDuration)
      }
    }

    if (timerDuration > 0) {
      this.emitLog('debug', `Status timer set for ${timerDuration} secs`)
      this._statusTimerSubscription = timer(timerDuration * 1000)
        .subscribe(async () => await this.performStatusRefresh())
    }
  }

  private async performStatusRefresh(): Promise<void> {
    try {
      this._statusTimerSubscription?.unsubscribe()
      await this.updateStatus()

      this.setStatusTimer()
    } catch (error) {
      this.emitLog('debug', `Failed to get status: ${error}`)
    }
  }

  private async getControllerDateTime(): Promise<Date> {
    const respDate = await this._client.getControllerDate()
    const respTime = await this._client.getControllerTime()

    return new Date(
      respDate.year,
      respDate.month - 1,
      respDate.day,
      respTime.hour,
      respTime.minute,
      respTime.second,
    )
  }

  private async setControllerDateTime(): Promise<void> {
    const host = new Date()
    const controller = await this.getControllerDateTime()
    if (Math.abs(controller.getTime() - host.getTime()) <= 60000) {
      return
    }

    this.emitLog('info', `Adjusting Rainbird Controller Date/Time from ${controller.toLocaleString()} to ${host.toLocaleString()}`)

    await this._client.setControllerDate(host.getDate(), host.getMonth() + 1, host.getFullYear())
    await this._client.setControllerTime(host.getHours(), host.getMinutes(), host.getSeconds())
  }

  public async getIrrigationDelay(): Promise<number> {
    try {
      const response = await this._client.getIrrigationDelay()
      if (!response || typeof response.days !== 'number') {
        this.emitLog('warn', 'Failed to get irrigation delay: Invalid response')
        return 0 // Return a default value or handle it as needed
      }
      return response.days
    } catch (e: any) {
      this.emitLog('error', `Failed to get irrigation delay: ${e.message ?? e}`)
      return 0 // Return a default value or handle it as needed
    }
  }

  public async setIrrigationDelay(days: number): Promise<void> {
    try {
      this.emitLog('info', `Set Irrigation Delay: ${days} days`)
      await this._client.setIrrigstionDelay(days)
    } catch (e: any) {
      this.emitLog('error', `Failed to set irrigation delay: ${e.message ?? e}`)
    }
  }

  public async getCommandSupport(commandId: number): Promise<boolean> {
    try {
      const response = await this._client.getCommandSupport(commandId)
      return response.support
    } catch (e: any) {
      this.emitLog('error', `Failed to get command support: ${e.message ?? e}`)
      return false
    }
  }

  public async getControllerFirmwareVersion(): Promise<string> {
    try {
      const response = await this._client.getControllerFirmwareVersion()
      return response.version
    } catch (e: any) {
      this.emitLog('error', `Failed to get controller firmware version: ${e.message ?? e}`)
      return 'Unknown'
    }
  }

  public async getWaterBudget(program: number): Promise<number> {
    try {
      const response = await this._client.getWaterBudget(program)
      return response.seasonalAdjust
    } catch (e: any) {
      this.emitLog('error', `Failed to get water budget: ${e.message ?? e}`)
      return 0
    }
  }

  public async getZonesSeasonalAdjustFactor(program: number): Promise<number[]> {
    try {
      const response = await this._client.getZonesSeasonalAdjustFactor(program)
      return response.stationsSA
    } catch (e: any) {
      this.emitLog('error', `Failed to get zones seasonal adjust factor: ${e.message ?? e}`)
      return []
    }
  }

  public async testZone(zone: number): Promise<void> {
    try {
      this.emitLog('info', `Zone ${zone}: Test`)
      await this._client.testZone(zone)
      this._statusRefreshSubject.next()
    } catch (e: any) {
      this.emitLog('error', `Failed to test zone ${zone}: ${e.message ?? e}`)
    }
  }

  public async getControllerEventTimestamp(eventId: number): Promise<number> {
    try {
      const response = await this._client.getControllerEventTimestamp(eventId)
      return response.timestamp
    } catch (e: any) {
      this.emitLog('error', `Failed to get controller event timestamp: ${e.message ?? e}`)
      return 0
    }
  }

  public async stackRunZone(page: number, zone: number, minutes: number): Promise<void> {
    try {
      this.emitLog('info', `Zone ${zone}: Stack run for ${minutes} minutes (page ${page})`)
      await this._client.stackRunZone(page, zone, minutes)
      this._statusRefreshSubject.next()
    } catch (e: any) {
      this.emitLog('error', `Failed to stack run zone ${zone}: ${e.message ?? e}`)
    }
  }

  private async updateStatus(): Promise<void> {
    const status = await this.getRainBirdState()

    const currentZone = status.runningZoneIndex !== undefined ? status.zones[status.runningZoneIndex] : undefined

    const previousZoneId = this._currentZoneId
    this._currentZoneId = currentZone?.id ?? 0
    if (previousZoneId !== 0 && this._zones[previousZoneId].running && previousZoneId !== currentZone?.id) {
      this.emitLog('info', `Zone ${previousZoneId}: Complete`)
    }

    const previousProgramId = this._currentProgramId
    this._currentProgramId = status.program !== undefined ? this.getProgramId(status.program.id) : undefined
    if (previousProgramId !== undefined && previousProgramId !== '' && previousProgramId !== this._currentProgramId) {
      this.emitLog('info', `Program ${previousProgramId}: Complete`)
    }

    if (this._currentProgramId !== undefined && this._currentProgramId !== '' && previousProgramId !== this._currentProgramId) {
      this.emitLog('info', `Program ${this._currentProgramId}: Running [Time Remaining: ${this.formatTime(status.program?.timeRemaining)}]`)
    }

    if (currentZone !== undefined && currentZone.running && previousZoneId !== currentZone.id) {
      this.emitLog('info', `Zone ${currentZone.id}: Running [Time Remaining: ${this.formatTime(currentZone.timeRemaining)}]`)
    }

    for (const [id, zone] of Object.entries(this._zones)) {
      const statusZoneIndex = status.zones.findIndex(zone => zone.id === Number(id))

      if (statusZoneIndex < 0) {
        zone.running = false
        zone.remainingDuration = 0
        zone.durationTime = undefined
        zone.active = false
        continue
      }

      zone.running = status.zones[statusZoneIndex].running
      zone.remainingDuration = status.zones[statusZoneIndex].timeRemaining ?? 0
      zone.durationTime = zone.running ? new Date() : undefined
      zone.active = zone.remainingDuration > 0
      zone.queued = false
    }

    this.emit(EventType.STATUS)

    if (this._rainSetPointReached !== status.rainSensorSetPointReached) {
      this._rainSetPointReached = status.rainSensorSetPointReached
      this.emit(EventType.RAIN_SENSOR_STATE)
      this.emitLog('info', `Rain Sensor: ${status.rainSensorSetPointReached ? 'SetPoint reached' : 'Clear'}`)
    }
  }

  private formatTime(seconds?: number): string {
    if (seconds === undefined) {
      return 'unknown'
    }
    const date = new Date(seconds * 1000)
    return date.toISOString().substring(11, 19)
  }

  private async getRainBirdState(): Promise<RainBirdState> {
    const page0 = await this._client.getProgramZoneState(0)
    const rainSensorState = await this._client.getRainSensorState()

    if (page0.toBuffer().length === 12) { // ESP-TM2
      return await this.getRainBirdStateTM2(
        page0.toBuffer(),
        rainSensorState.setPointReached,
      )
    }
    if (page0.toBuffer().length === 7) { // ESP-ME3
      return await this.getRainBirdStateME3(
        page0.toBuffer(),
        rainSensorState.setPointReached,
      )
    }
    if (page0.toBuffer().length === 10) { // ESP-RZXe & ESP-Me series
      return this.getRainBirdStateRZXe(
        page0.toBuffer(),
        rainSensorState.setPointReached,
      )
    }
    // Other models
    this._currentZoneStateSupported = false
    return await this.getRainBirdStateDefault(
      page0.toBuffer(),
      rainSensorState.setPointReached,
    )
  }

  private async getRainBirdStateTM2(page0: Buffer, setPointReached: boolean): Promise<RainBirdState> {
    const state: RainBirdState = {
      program: undefined,
      zones: [],
      runningZoneIndex: undefined,
      rainSensorSetPointReached: setPointReached,
    }

    const isRunning = page0[11] !== 0
    if (!isRunning) {
      return state
    }

    const page1 = (await this._client.getProgramZoneState(1)).toBuffer()

    let offset = 2
    let index = 0
    while (page1[offset] > 0) {
      const zoneId = page1[offset] & 31
      const zoneRunning = zoneId === page0[8]
      state.zones.push({
        id: zoneId,
        timeRemaining: page1.readUInt16BE(offset + 1),
        running: zoneRunning,
      })
      if (zoneRunning) {
        state.runningZoneIndex = index
      }

      index++
      offset += 3
    }

    if (page0[9] > 2) {
      return state
    }

    const totalTimeRemaining = state.zones.reduce(
      (total, zone) => total + zone.timeRemaining!,
      0,
    )
    state.program = {
      id: page0[9],
      timeRemaining: totalTimeRemaining,
      running: page0[11] !== 0,
    }

    return state
  }

  private async getRainBirdStateME3(page0: Buffer, setPointReached: boolean): Promise<RainBirdState> {
    const state: RainBirdState = {
      program: undefined,
      zones: [],
      runningZoneIndex: undefined,
      rainSensorSetPointReached: setPointReached,
    }

    const isRunning = page0[3] !== 0
    if (!isRunning) {
      return state
    }

    const page1 = (await this._client.getProgramZoneState(1)).toBuffer()

    state.zones.push({
      id: page1[3],
      timeRemaining: page1.readUInt16LE(4),
      running: true,
    })
    state.runningZoneIndex = 0

    const pendingZones = await this.getRainBirdStateME3PendingZones(page0[4])
    for (const pendingZone of pendingZones) {
      state.zones.push({
        id: pendingZone[1],
        timeRemaining: pendingZone.readUInt16LE(2),
        running: false,
      })
    }

    if (page0[2] > 3) {
      return state
    }

    const totalTimeRemaining = state.zones.reduce(
      (total, zone) => total + zone.timeRemaining!,
      0,
    )
    state.program = {
      id: page1[2] - 1,
      timeRemaining: totalTimeRemaining,
      running: isRunning,
    }

    return state
  }

  private async getRainBirdStateME3PendingZones(pendingZones: number): Promise<Buffer[]> {
    const zones: Buffer[] = []
    if (pendingZones === 0) {
      return zones
    }

    let pageId = 2
    while (pageId >= 2) {
      const page = (await this._client.getProgramZoneState(pageId)).toBuffer()
      const pageZones = Math.min(pendingZones, 8)
      let offset = 2
      for (let i = 0; i < pageZones; i++) {
        const zone = Buffer.from(page.subarray(offset, offset + 6))
        zones.push(zone)
        offset += 6
      }

      pendingZones -= 8
      if (pendingZones > 0) {
        pageId++
      } else {
        pageId = 0
      }
    }
    return zones
  }

  private async getRainBirdStateRZXe(page0: Buffer, setPointReached: boolean): Promise<RainBirdState> {
    const state: RainBirdState = {
      program: undefined,
      zones: [],
      runningZoneIndex: undefined,
      rainSensorSetPointReached: setPointReached,
    }

    if (page0[6] === 0) {
      return state
    }

    state.zones.push({
      id: page0[6],
      timeRemaining: page0.readUInt16BE(8),
      running: page0[3] !== 0,
    })
    state.runningZoneIndex = 0

    await this.displaySupportWarning(page0)

    return state
  }

  private async getRainBirdStateDefault(page0: Buffer, setPointReached: boolean): Promise<RainBirdState> {
    const state: RainBirdState = {
      program: undefined,
      zones: [],
      runningZoneIndex: undefined,
      rainSensorSetPointReached: setPointReached,
    }

    const currentZone = await this._client.getCurrentZone()
    if (currentZone.zoneId === 0) {
      return state
    }

    state.zones.push({
      id: currentZone.zoneId,
      timeRemaining: 0,
      running: true,
    })
    state.runningZoneIndex = 0

    await this.displaySupportWarning(page0)

    return state
  }

  private async displaySupportWarning(page0: Buffer): Promise<void> {
    const now = Date.now()
    if (now - this._lastSupportWarning < 24 * 60 * 60 * 1000) {
      return
    }
    this._lastSupportWarning = now

    const page1 = (await this._client.getProgramZoneState(1)).toBuffer()
    const page2 = (await this._client.getProgramZoneState(2)).toBuffer()

    this.emitLog('warn', 'This plugin does not fully support your RainBird model and may not not correctly show the zone\'s state such as time remaining')
    this.emitLog('warn', 'If you would like better support please create a GitHub issue [https://github.com/homebridge-plugins/rainbird/issues]')
    this.emitLog('warn', 'and supply the following details:')
    this.emitLog('warn', `  Model: ${this.model}, Zones: ${[...this.zones.keys()]}`)
    this.emitLog('warn', `  ProgramZoneState Page 0: ${[...page0.values()]}`)
    this.emitLog('warn', `  ProgramZoneState Page 1: ${[...page1.values()]}`)
    this.emitLog('warn', `  ProgramZoneState Page 2: ${[...page2.values()]}`)
    this.emitLog('warn', 'Also include your model (if different to the one above), which program is running and')
    this.emitLog('warn', 'the time remaining for the currently running zone as well as for the other idle/waiting zones')
  }

  refreshStatus(): void {
    this._statusRefreshSubject.next()
  }
}
