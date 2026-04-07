import type { Buffer } from 'node:buffer'

import { Response } from './Response.js'

export interface ScheduleControllerInfo {
  stationDelay: number
  rainDelay: number
  rainSensor: boolean
}

export interface ScheduleProgramInfo {
  program: number
  frequency: number
  period: number
  synchro: number
  dayOfWeek: number
}

export interface ScheduleProgramStartInfo {
  program: number
  starts: number[]
}

export interface ScheduleZoneDuration {
  zone: number
  durations: number[]
}

export interface ScheduleZoneInfo {
  zone: number
  duration: number
  starts: number[]
}

export class RetrieveScheduleResponse extends Response {
  private readonly _subCommand: number
  private readonly _controllerInfo?: ScheduleControllerInfo
  private readonly _programInfo?: ScheduleProgramInfo
  private readonly _programStartInfo?: ScheduleProgramStartInfo
  private readonly _zoneDuration?: ScheduleZoneDuration
  private readonly _zoneInfo?: ScheduleZoneInfo

  constructor(private readonly response: Buffer) {
    super()
    this._subCommand = response.readUInt16BE(1)
    const rest = response.subarray(3)

    if (this._subCommand === 0x0000) {
      // Controller info
      this._controllerInfo = {
        stationDelay: rest[0],
        rainDelay: rest[1],
        rainSensor: rest[2] !== 0,
      }
    } else if (this._subCommand >= 0x0010 && this._subCommand <= 0x001F) {
      // Program details (0x10 = program A, 0x11 = B, ...)
      const program = this._subCommand - 0x0010
      this._programInfo = {
        program,
        frequency: rest[0],
        period: rest[1],
        synchro: rest[2],
        dayOfWeek: rest[3],
      }
    } else if (this._subCommand >= 0x0020 && this._subCommand <= 0x002F) {
      // Start times (0x20 = program A, ...)
      const program = this._subCommand - 0x0020
      const starts: number[] = []
      for (let i = 0; i < Math.floor(rest.length / 2); i++) {
        const val = rest.readUInt16BE(i * 2)
        if (val !== 0xFFFF) {
          starts.push(val)
        }
      }
      this._programStartInfo = { program, starts }
    } else if (this._subCommand >= 0x0030) {
      // Zone durations (0x30 = zone 1, ...)
      const zone = this._subCommand - 0x0030 + 1
      const durations: number[] = []
      for (let i = 0; i < Math.floor(rest.length / 2); i++) {
        durations.push(rest.readUInt16BE(i * 2))
      }
      this._zoneDuration = { zone, durations }
    } else if (this._subCommand > 0x0000 && this._subCommand < 0x0010 && response.length === 14) {
      // LCR series (ESP-RZXe/ST8) per-zone schedule
      const zone = this._subCommand
      const duration = rest[0]
      const starts: number[] = []
      for (let i = 0; i < 6; i++) {
        const val = rest[1 + i]
        if (val !== 0xFF) {
          starts.push(val * 10)
        }
      }
      this._zoneInfo = { zone, duration, starts }
    }
  }

  get type(): number {
    return 0xA0
  }

  get subCommand(): number {
    return this._subCommand
  }

  get controllerInfo(): ScheduleControllerInfo | undefined {
    return this._controllerInfo
  }

  get programInfo(): ScheduleProgramInfo | undefined {
    return this._programInfo
  }

  get programStartInfo(): ScheduleProgramStartInfo | undefined {
    return this._programStartInfo
  }

  get zoneDuration(): ScheduleZoneDuration | undefined {
    return this._zoneDuration
  }

  get zoneInfo(): ScheduleZoneInfo | undefined {
    return this._zoneInfo
  }

  toBuffer(): Buffer {
    return this.response
  }
}
