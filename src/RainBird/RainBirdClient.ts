import type { Request } from './requests/Request.js'
import type { Response } from './responses/Response.js'

import { Buffer } from 'node:buffer'
import crypto from 'node:crypto'
import * as events from 'node:events'

import aesjs from 'aes-js'
import PQueue from 'p-queue'
import encoder from 'text-encoder'
import { Agent, request as undiciRequest } from 'undici'

import { AdvanceZoneRequest } from './requests/AdvanceZoneRequest.js'
import { AvailableZonesRequest } from './requests/AvailableZonesRequest.js'
import { CommandSupportRequest } from './requests/CommandSupportRequest.js'
import { ControllerDateGetRequest } from './requests/ControllerDateGetRequest.js'
import { ControllerDateSetRequest } from './requests/ControllerDateSetRequest.js'
import { ControllerEventTimestampRequest } from './requests/ControllerEventTimestampRequest.js'
import { ControllerFirmwareVersionRequest } from './requests/ControllerFirmwareVersionRequest.js'
import { ControllerStateRequest } from './requests/ControllerStateRequest.js'
import { ControllerTimeGetRequest } from './requests/ControllerTimeGetRequest.js'
import { ControllerTimeSetRequest } from './requests/ControllerTimeSetRequest.js'
import { CurrentZoneRequest } from './requests/CurrentZoneRequest.js'
import { IrrigationDelayGetRequest } from './requests/IrrigationDelayGetRequest.js'
import { IrrigationDelaySetRequest } from './requests/IrrigationDelaySetRequest.js'
import { IrrigationStateRequest } from './requests/IrrigationStateRequest.js'
import { ModelAndVersionRequest } from './requests/ModelAndVersionRequest.js'
import { ProgramZoneStateRequest } from './requests/ProgramZoneStateRequest.js'
import { RainSensorStateRequest } from './requests/RainSensorStateRequest.js'
import { RawRequest } from './requests/RawRequest.js'
import { RetrieveScheduleRequest } from './requests/RetrieveScheduleRequest.js'
import { RunProgramRequest } from './requests/RunProgramRequest.js'
import { RunZoneRequest } from './requests/RunZoneRequest.js'
import { SerialNumberRequest } from './requests/SerialNumberRequest.js'
import { StackRunZoneRequest } from './requests/StackRunZoneRequest.js'
import { StopIrrigationRequest } from './requests/StopIrrigationRequest.js'
import { TestZoneRequest } from './requests/TestZoneRequest.js'
import { WaterBudgetRequest } from './requests/WaterBudgetRequest.js'
import { ZonesSeasonalAdjustFactorRequest } from './requests/ZonesSeasonalAdjustFactorRequest.js'
import { AcknowledgedResponse } from './responses/AcknowledgedResponse.js'
import { AvailableZonesResponse } from './responses/AvailableZonesResponse.js'
import { CommandSupportResponse } from './responses/CommandSupportResponse.js'
import { ControllerDateGetResponse } from './responses/ControllerDateGetResponse.js'
import { ControllerEventTimestampResponse } from './responses/ControllerEventTimestampResponse.js'
import { ControllerFirmwareVersionResponse } from './responses/ControllerFirmwareVersionResponse.js'
import { ControllerStateResponse } from './responses/ControllerStateResponse.js'
import { ControllerTimeGetResponse } from './responses/ControllerTimeGetResponse.js'
import { CurrentZoneResponse } from './responses/CurrentZoneResponse.js'
import { IrrigationDelayGetResponse } from './responses/IrrigationDelayGetResponse.js'
import { IrrigationStateResponse } from './responses/IrrigationStateResponse.js'
import { ModelAndVersionResponse } from './responses/ModelAndVersionResponse.js'
import { NotAcknowledgedResponse } from './responses/NotAcknowledgedResponse.js'
import { ProgramZoneStateResponse } from './responses/ProgramZoneStateResponse.js'
import { RainSensorStateResponse } from './responses/RainSensorStateResponse.js'
import { RawResponse } from './responses/RawResponse.js'
import { RetrieveScheduleResponse } from './responses/RetrieveScheduleResponse.js'
import { SerialNumberResponse } from './responses/SerialNumberResponse.js'
import { WaterBudgetResponse } from './responses/WaterBudgetResponse.js'
import { ZonesSeasonalAdjustFactorResponse } from './responses/ZonesSeasonalAdjustFactorResponse.js'

interface RainBirdRequest {
  type: Request
  retry: boolean
  postDelay: number
}

export class RainBirdClient extends events.EventEmitter {
  private readonly RETRY_DELAY = 60
  private readonly address: string
  private readonly password: string
  private readonly showRequestResponse: boolean

  // Protocol discovery state: determined on first request.
  // RainBird v2 controllers use HTTPS with a self-signed certificate.
  // We probe HTTPS first; if the transport fails, we fall back to HTTP.
  private _url: string | null = null
  // Shared HTTPS agent that bypasses certificate validation for self-signed certs.
  // NOTE: rejectUnauthorized is false because RainBird controllers use self-signed
  // certificates. This is a known security trade-off for local LAN communication;
  // certificate pinning is not feasible as the cert is device-generated.
  private readonly _httpsAgent: Agent = new Agent({ connect: { rejectUnauthorized: false } })

  // Error codes that indicate a transport/TLS failure (not an HTTP-level error).
  // Used during protocol discovery to decide whether to fall back from HTTPS to HTTP.
  private static readonly CONNECTION_ERROR_CODES: ReadonlySet<string> = new Set([
    'ECONNRESET',
    'ECONNREFUSED',
    'ENOTFOUND',
    'ERR_SSL_WRONG_VERSION_NUMBER',
    'ERR_SSL_NO_PROTOCOLS_AVAILABLE',
    'ERR_SSL_SSLV3_ALERT_HANDSHAKE_FAILURE',
    'UND_ERR_CONNECT_TIMEOUT',
  ])

  private static readonly CONNECTION_ERROR_SUBSTRINGS: readonly string[] = [
    'ssl',
    'tls',
    'socket hang up',
    'connect timeout',
  ]

  /* private requestQueue = cq()
    .limit({ concurrency: 1 })
    .process(this.sendRequest.bind(this)); */

  queue: PQueue = new PQueue({
    concurrency: 1,
  })

  constructor(
    address: string,
    password: string,
    showRequestResponse: boolean,
  ) {
    super()
    this.address = address
    this.password = password
    this.showRequestResponse = showRequestResponse
  }

  /**
   * Emit a log event.
   * @param level The log level.
   * @param message The log message.
   */
  public emitLog(level: string, message: string): void {
    if (message !== undefined) {
      this.emit('log', { level, message })
    }
  }

  public async getModelAndVersion(): Promise<ModelAndVersionResponse> {
    const request: RainBirdRequest = {
      type: new ModelAndVersionRequest(),
      retry: true,
      postDelay: 0,
    }
    return await this.queue.add(() => this.sendRequest(request)) as ModelAndVersionResponse
    // return await this.requestQueue(request) as ModelAndVersionResponse;
  }

  public async getAvailableZones(): Promise<AvailableZonesResponse> {
    const request: RainBirdRequest = {
      type: new AvailableZonesRequest(),
      retry: true,
      postDelay: 0,
    }
    return await this.queue.add(() => this.sendRequest(request)) as AvailableZonesResponse
    // return await this.requestQueue(request) as AvailableZonesResponse;
  }

  public async getSerialNumber(): Promise<SerialNumberResponse> {
    const request: RainBirdRequest = {
      type: new SerialNumberRequest(),
      retry: true,
      postDelay: 0,
    }
    return await this.queue.add(() => this.sendRequest(request)) as SerialNumberResponse
    // return await this.requestQueue(request) as SerialNumberResponse;
  }

  public async runProgram(program: number): Promise<AcknowledgedResponse | NotAcknowledgedResponse> {
    const request: RainBirdRequest = {
      type: new RunProgramRequest(program),
      retry: true,
      postDelay: 1,
    }
    const response = await this.queue.add(() => this.sendRequest(request))
    // const response = await this.requestQueue(request);
    return response!.type === 0
      ? response as NotAcknowledgedResponse
      : response as AcknowledgedResponse
  }

  public async runZone(zone: number, duration: number): Promise<AcknowledgedResponse | NotAcknowledgedResponse> {
    const request: RainBirdRequest = {
      type: new RunZoneRequest(zone, Math.round(duration / 60)),
      retry: true,
      postDelay: 1,
    }
    const response = await this.queue.add(() => this.sendRequest(request))
    // const response = await this.requestQueue(request);
    return response!.type === 0
      ? response as NotAcknowledgedResponse
      : response as AcknowledgedResponse
  }

  public async advanceZone(): Promise<AcknowledgedResponse | NotAcknowledgedResponse> {
    const request: RainBirdRequest = {
      type: new AdvanceZoneRequest(),
      retry: true,
      postDelay: 1,
    }
    const response = await this.queue.add(() => this.sendRequest(request))
    // const response = await this.requestQueue(request);
    return response!.type === 0
      ? response as NotAcknowledgedResponse
      : response as AcknowledgedResponse
  }

  public async stopIrrigation(): Promise<AcknowledgedResponse | NotAcknowledgedResponse> {
    const request: RainBirdRequest = {
      type: new StopIrrigationRequest(),
      retry: true,
      postDelay: 1,
    }
    const response = await this.queue.add(() => this.sendRequest(request))
    // const response = await this.requestQueue(request);
    return response!.type === 0
      ? response as NotAcknowledgedResponse
      : response as AcknowledgedResponse
  }

  public async getControllerState(): Promise<ControllerStateResponse> {
    const request: RainBirdRequest = {
      type: new ControllerStateRequest(),
      retry: true,
      postDelay: 0,
    }
    return await this.queue.add(() => this.sendRequest(request)) as ControllerStateResponse
    // return await this.requestQueue(request) as ControllerStateResponse;
  }

  public async getControllerDate(): Promise<ControllerDateGetResponse> {
    const request: RainBirdRequest = {
      type: new ControllerDateGetRequest(),
      retry: true,
      postDelay: 0,
    }
    return await this.queue.add(() => this.sendRequest(request)) as ControllerDateGetResponse
    // return await this.requestQueue(request) as ControllerDateGetResponse;
  }

  public async setControllerDate(day: number, month: number, year: number): Promise<AcknowledgedResponse> {
    const request: RainBirdRequest = {
      type: new ControllerDateSetRequest(day, month, year),
      retry: true,
      postDelay: 0,
    }
    return await this.queue.add(() => this.sendRequest(request)) as AcknowledgedResponse
    // return await this.requestQueue(request) as AcknowledgedResponse;
  }

  public async getControllerTime(): Promise<ControllerTimeGetResponse> {
    const request: RainBirdRequest = {
      type: new ControllerTimeGetRequest(),
      retry: true,
      postDelay: 0,
    }
    return await this.queue.add(() => this.sendRequest(request)) as ControllerTimeGetResponse
    // return await this.requestQueue(request) as ControllerTimeGetResponse;
  }

  public async setControllerTime(hour: number, minute: number, second: number): Promise<AcknowledgedResponse> {
    const request: RainBirdRequest = {
      type: new ControllerTimeSetRequest(hour, minute, second),
      retry: true,
      postDelay: 0,
    }
    return await this.queue.add(() => this.sendRequest(request)) as AcknowledgedResponse
    // return await this.requestQueue(request) as AcknowledgedResponse;
  }

  public async getIrrigationState(): Promise<IrrigationStateResponse> {
    const request: RainBirdRequest = {
      type: new IrrigationStateRequest(),
      retry: true,
      postDelay: 0,
    }
    return await this.queue.add(() => this.sendRequest(request)) as IrrigationStateResponse
    // return await this.requestQueue(request) as IrrigationStateResponse;
  }

  public async getRainSensorState(): Promise<RainSensorStateResponse> {
    const request: RainBirdRequest = {
      type: new RainSensorStateRequest(),
      retry: false,
      postDelay: 0,
    }
    return await this.queue.add(() => this.sendRequest(request)) as RainSensorStateResponse
    // return await this.requestQueue(request) as RainSensorStateResponse;
  }

  public async getCurrentZone(): Promise<CurrentZoneResponse> {
    const request: RainBirdRequest = {
      type: new CurrentZoneRequest(),
      retry: false,
      postDelay: 0,
    }
    return await this.queue.add(() => this.sendRequest(request)) as CurrentZoneResponse
    // return await this.requestQueue(request) as CurrentZoneResponse;
  }

  public async getProgramZoneState(page = 0): Promise<ProgramZoneStateResponse> {
    const request: RainBirdRequest = {
      type: new ProgramZoneStateRequest(page),
      retry: false,
      postDelay: 0,
    }
    return await this.queue.add(() => this.sendRequest(request)) as ProgramZoneStateResponse
    // return await this.requestQueue(request) as ProgramZoneStateResponse;
  }

  public async getRaw(type: number, page = 0): Promise<RawResponse> {
    const request: RainBirdRequest = {
      type: new RawRequest(type, page),
      retry: false,
      postDelay: 0,
    }
    return await this.queue.add(() => this.sendRequest(request)) as RawResponse
    // return await this.requestQueue(request) as RawResponse;
  }

  public async getIrrigationDelay(): Promise<IrrigationDelayGetResponse> {
    const request: RainBirdRequest = {
      type: new IrrigationDelayGetRequest(),
      retry: false,
      postDelay: 0,
    }
    return await this.queue.add(() => this.sendRequest(request)) as IrrigationDelayGetResponse
    // return await this.requestQueue(request) as IrrigationDelayGetResponse;
  }

  public async setIrrigstionDelay(days: number): Promise<AcknowledgedResponse> {
    days = Math.max(Math.min(Math.round(days), 14), 0)
    const request: RainBirdRequest = {
      type: new IrrigationDelaySetRequest(days),
      retry: false,
      postDelay: 0,
    }
    return await this.queue.add(() => this.sendRequest(request)) as AcknowledgedResponse
    // return await this.requestQueue(request) as AcknowledgedResponse;
  }

  public async getCommandSupport(commandId: number): Promise<CommandSupportResponse> {
    const request: RainBirdRequest = {
      type: new CommandSupportRequest(commandId),
      retry: false,
      postDelay: 0,
    }
    return await this.queue.add(() => this.sendRequest(request)) as CommandSupportResponse
  }

  public async getControllerFirmwareVersion(): Promise<ControllerFirmwareVersionResponse> {
    const request: RainBirdRequest = {
      type: new ControllerFirmwareVersionRequest(),
      retry: true,
      postDelay: 0,
    }
    return await this.queue.add(() => this.sendRequest(request)) as ControllerFirmwareVersionResponse
  }

  public async retrieveSchedule(page = 0): Promise<RetrieveScheduleResponse> {
    const request: RainBirdRequest = {
      type: new RetrieveScheduleRequest(page),
      retry: false,
      postDelay: 0,
    }
    return await this.queue.add(() => this.sendRequest(request)) as RetrieveScheduleResponse
  }

  public async getWaterBudget(program: number): Promise<WaterBudgetResponse> {
    const request: RainBirdRequest = {
      type: new WaterBudgetRequest(program),
      retry: false,
      postDelay: 0,
    }
    return await this.queue.add(() => this.sendRequest(request)) as WaterBudgetResponse
  }

  public async getZonesSeasonalAdjustFactor(program: number): Promise<ZonesSeasonalAdjustFactorResponse> {
    const request: RainBirdRequest = {
      type: new ZonesSeasonalAdjustFactorRequest(program),
      retry: false,
      postDelay: 0,
    }
    return await this.queue.add(() => this.sendRequest(request)) as ZonesSeasonalAdjustFactorResponse
  }

  public async testZone(zone: number): Promise<AcknowledgedResponse | NotAcknowledgedResponse> {
    const request: RainBirdRequest = {
      type: new TestZoneRequest(zone),
      retry: false,
      postDelay: 1,
    }
    const response = await this.queue.add(() => this.sendRequest(request))
    return response!.type === 0
      ? response as NotAcknowledgedResponse
      : response as AcknowledgedResponse
  }

  public async getControllerEventTimestamp(eventId: number): Promise<ControllerEventTimestampResponse> {
    const request: RainBirdRequest = {
      type: new ControllerEventTimestampRequest(eventId),
      retry: false,
      postDelay: 0,
    }
    return await this.queue.add(() => this.sendRequest(request)) as ControllerEventTimestampResponse
  }

  public async stackRunZone(page: number, zone: number, minutes: number): Promise<AcknowledgedResponse | NotAcknowledgedResponse> {
    const request: RainBirdRequest = {
      type: new StackRunZoneRequest(page, zone, minutes),
      retry: false,
      postDelay: 1,
    }
    const response = await this.queue.add(() => this.sendRequest(request))
    return response!.type === 0
      ? response as NotAcknowledgedResponse
      : response as AcknowledgedResponse
  }

  private async sendRequest(request: RainBirdRequest): Promise<Response | undefined> {
    if (this.showRequestResponse) {
      this.emitLog('warn', `[${this.address}] Request:  ${request.type}`)
    }

    while (true) {
      try {
        // On first request, attempt HTTPS (RainBird v2 uses HTTPS with self-signed cert).
        // Fall back to HTTP if the connection fails at the transport/TLS level.
        let url: string
        let dispatcher: Agent | undefined
        if (this._url === null) {
          url = `https://${this.address}/stick`
          dispatcher = this._httpsAgent
        } else {
          url = this._url
          // _httpsAgent is used when the controller speaks HTTPS; undefined for HTTP.
          dispatcher = this._url.startsWith('https:') ? this._httpsAgent : undefined
        }

        const data: Buffer = this.encrypt(request.type)

        const { statusCode, body } = await undiciRequest(url, {
          method: 'POST',
          body: data,
          headers: this.requestHeaders(),
          dispatcher,
        })

        // HTTPS responded at the protocol level: store URL for all future requests.
        if (this._url === null) {
          this._url = url
          this.emitLog('debug', `[${this.address}] Using HTTPS`)
        }

        if (statusCode !== 200) {
          throw new Error(`Invalid Response [Status: ${statusCode}]`)
        }

        const responseBuffer = Buffer.from(await body.arrayBuffer())
        const response = this.getResponse(responseBuffer)
        await this.delay(request.postDelay)

        return response
      } catch (error) {
        // If protocol has not yet been discovered and this is a transport/TLS error,
        // the controller does not support HTTPS — fall back to plain HTTP and retry.
        if (this._url === null && this.isConnectionError(error)) {
          this._url = `http://${this.address}/stick`
          this.emitLog('debug', `[${this.address}] HTTPS unavailable, using HTTP`)
          continue
        }
        this.emitLog('error', `RainBird controller request failed. [${error}]`)
        this.emitLog('error', `Failed Request: ${request.type}`)
        if (!request.retry) {
          break
        }
        this.emitLog('warn', `Will retry in ${this.RETRY_DELAY} seconds`)
        await this.delay(this.RETRY_DELAY)
      }
    }
  }

  /**
   * Determine whether an error is a transport/TLS connection failure (as opposed to
   * an HTTP-level error such as 403 Forbidden or 503 Service Unavailable).
   * Used during protocol discovery to decide whether to fall back from HTTPS to HTTP.
   */
  private isConnectionError(error: unknown): boolean {
    if (!(error instanceof Error)) {
      return false
    }
    const code = (error as Error & { code?: string }).code
    const msg = error.message.toLowerCase()
    if (code !== undefined && RainBirdClient.CONNECTION_ERROR_CODES.has(code)) {
      return true
    }
    return RainBirdClient.CONNECTION_ERROR_SUBSTRINGS.some(s => msg.includes(s))
  }

  private getResponse(encryptedResponse: Buffer): Response | undefined {
    // eslint-disable-next-line no-control-regex
    const decryptedResponse = JSON.parse(this.decrypt(encryptedResponse).replace(/[\x10\n\0]/g, ''))

    if (!decryptedResponse) {
      if (this.showRequestResponse) {
        this.emitLog('warn', `[${this.address}] Response: No response received`)
      }
      this.emitLog('error', 'No response received')
      return
    }
    if (decryptedResponse.error) {
      if (this.showRequestResponse) {
        this.emitLog('warn', `[${this.address}] Response: Error ${decryptedResponse.error.code}: ${decryptedResponse.error.message}`)
      }
      this.emitLog('error', `Received error from Rainbird controller ${decryptedResponse.error.code}: ${decryptedResponse.error.message}`)
      return
    }
    if (!decryptedResponse.result) {
      if (this.showRequestResponse) {
        this.emitLog('warn', `[${this.address}] Response: Invalid response (no result)`)
      }
      this.emitLog('error', 'Invalid response received')
      return
    }
    const data = Buffer.from(decryptedResponse.result.data, 'hex')

    let response: Response | undefined
    switch (data[0]) {
      case 0x00:
        response = new NotAcknowledgedResponse(data)
        break
      case 0x01:
        response = new AcknowledgedResponse(data)
        break
      case 0x82:
        response = new ModelAndVersionResponse(data)
        break
      case 0x83:
        response = new AvailableZonesResponse(data)
        break
      case 0x84:
        response = new CommandSupportResponse(data)
        break
      case 0x85:
        response = new SerialNumberResponse(data)
        break
      case 0x8B:
        response = new ControllerFirmwareVersionResponse(data)
        break
      case 0x90:
        response = new ControllerTimeGetResponse(data)
        break
      case 0x92:
        response = new ControllerDateGetResponse(data)
        break
      case 0xA0:
        response = new RetrieveScheduleResponse(data)
        break
      case 0xB0:
        response = new WaterBudgetResponse(data)
        break
      case 0xB2:
        response = new ZonesSeasonalAdjustFactorResponse(data)
        break
      case 0xB6:
        response = new IrrigationDelayGetResponse(data)
        break
      case 0xBB:
        response = new ProgramZoneStateResponse(data)
        break
      case 0xBE:
        response = new RainSensorStateResponse(data)
        break
      case 0xBF:
        response = new CurrentZoneResponse(data)
        break
      case 0xC8:
        response = new IrrigationStateResponse(data)
        break
      case 0xCA:
        response = new ControllerEventTimestampResponse(data)
        break
      case 0xCC:
        response = new ControllerStateResponse(data)
        break
      default:
        response = new RawResponse(data)
    }

    if (this.showRequestResponse) {
      this.emitLog('warn', `[${this.address}] Response: ${response ?? 'Unknown'}`)
    }

    return response
  }

  private encrypt(request: Request): Buffer {
    const formattedRequest = this.formatRequest(request)
    const
      passwordHash = crypto.createHash('sha256').update(this.toBytes(this.password)).digest()
    const randomBytes = crypto.randomBytes(16)
    // Pure null padding with no legacy \x00\x10 suffix — newer LNK2 firmware
    // crashes on the legacy packing (mirrors allenporter/pyrainbird#589)
    const packedRequest = this.toBytes(this.addPadding(formattedRequest))
    const hashedRequest = crypto.createHash('sha256').update(this.toBytes(formattedRequest)).digest()

    const easEncryptor = new aesjs.ModeOfOperation.cbc(passwordHash, randomBytes)
    const encryptedRequest = Buffer.from(easEncryptor.encrypt(packedRequest))
    return Buffer.concat([hashedRequest, randomBytes, encryptedRequest])
  }

  private decrypt(data: Buffer): string {
    const
      passwordHash = crypto.createHash('sha256').update(this.toBytes(this.password)).digest().subarray(0, 32)
    const randomBytes = data.subarray(32, 48)
    const encryptedBody = data.subarray(48, data.length)

    const aesDecryptor = new aesjs.ModeOfOperation.cbc(passwordHash, randomBytes)
    return new encoder.TextDecoder().decode(aesDecryptor.decrypt(encryptedBody))
  }

  private formatRequest(request: Request) {
    const data: Buffer = request.toBuffer()
    return JSON.stringify({
      id: 9,
      jsonrpc: '2.0',
      method: 'tunnelSip',
      params: {
        data: data.toString('hex'),
        length: data.length,
      },
    })
  }

  private requestHeaders(): Record<string, string> {
    return {
      'Accept-Language': 'en',
      'Accept-Encoding': 'gzip, deflate',
      'User-Agent': 'RainBird/2.0 CFNetwork/811.5.4 Darwin/16.7.0',
      'Accept': '*/*',
      'Connection': 'keep-alive',
      'Content-Type': 'application/octet-stream',
    }
  }

  private toBytes(str: string) {
    return new encoder.TextEncoder('utf-8').encode(str)
  }

  private addPadding(data: string): string {
    const BLOCK_SIZE = 16
    const padLength = (BLOCK_SIZE - (data.length % BLOCK_SIZE)) % BLOCK_SIZE
    return data + '\x00'.repeat(padLength)
  }

  private async delay(sec: number): Promise<void> {
    await new Promise((resolve) => {
      setTimeout(() => {
        resolve('')
      }, sec * 1000)
    })
  }
}
