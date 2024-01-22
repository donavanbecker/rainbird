import crypto from 'crypto';
import encoder from 'text-encoder';
import aesjs from 'aes-js';
import cq from 'concurrent-queue';
import axios, { AxiosRequestConfig } from 'axios';

import { Logger } from 'homebridge';
import { Request } from './requests/Request.js';
import { Response } from './responses/Response.js';
import { ModelAndVersionRequest } from './requests/ModelAndVersionRequest.js';
import { ModelAndVersionResponse } from './responses/ModelAndVersionResponse.js';
import { AvailableZonesResponse } from './responses/AvailableZonesResponse.js';
import { AvailableZonesRequest } from './requests/AvailableZonesRequest.js';
import { SerialNumberResponse } from './responses/SerialNumberResponse.js';
import { SerialNumberRequest } from './requests/SerialNumberRequest.js';
import { AcknowledgedResponse } from './responses/AcknowledgedResponse.js';
import { NotAcknowledgedResponse } from './responses/NotAcknowledgedResponse.js';
import { RunProgramRequest } from './requests/RunProgramRequest.js';
import { RunZoneRequest } from './requests/RunZoneRequest.js';
import { StopIrrigationRequest } from './requests/StopIrrigationRequest.js';
import { ControllerStateResponse } from './responses/ControllerStateResponse.js';
import { ControllerStateRequest } from './requests/ControllerStateRequest.js';
import { ControllerDateGetRequest } from './requests/ControllerDateGetRequest.js';
import { ControllerDateGetResponse } from './responses/ControllerDateGetResponse.js';
import { ControllerDateSetRequest } from './requests/ControllerDateSetRequest.js';
import { ControllerTimeGetRequest } from './requests/ControllerTimeGetRequest.js';
import { ControllerTimeGetResponse } from './responses/ControllerTimeGetResponse.js';
import { ControllerTimeSetRequest } from './requests/ControllerTimeSetRequest.js';
import { IrrigationStateRequest } from './requests/IrrigationStateRequest.js';
import { IrrigationStateResponse } from './responses/IrrigationStateResponse.js';
import { RainSensorStateRequest } from './requests/RainSensorStateRequest.js';
import { RainSensorStateResponse } from './responses/RainSensorStateResponse.js';
import { CurrentZoneRequest } from './requests/CurrentZoneRequest.js';
import { CurrentZoneResponse } from './responses/CurrentZoneResponse.js';
import { ProgramZoneStateRequest } from './requests/ProgramZoneStateRequest.js';
import { ProgramZoneStateResponse } from './responses/ProgramZoneStateResponse.js';
import { RawRequest } from './requests/RawRequest.js';
import { RawResponse } from './responses/RawResponse.js';
import { AdvanceZoneRequest } from './requests/AdvanceZoneRequest.js';
import { IrrigationDelaySetRequest } from './requests/IrrigationDelaySetRequest.js';
import { IrrigationDelayGetRequest } from './requests/IrrigationDelayGetRequest.js';
import { IrrigationDelayGetResponse } from './responses/IrrigationDelayGetResponse.js';

type RainBirdRequest = {
  type: Request,
  retry: boolean,
  postDelay: number
}

export class RainBirdClient {
  private readonly RETRY_DELAY = 60;

  private requestQueue = cq()
    .limit({ concurrency: 1 })
    .process(this.sendRequest.bind(this));

  constructor(
    private readonly address: string,
    private readonly password: string,
    private readonly log: Logger,
    private readonly showRequestResponse: boolean) {
  }

  public async getModelAndVersion(): Promise<ModelAndVersionResponse> {
    const request: RainBirdRequest = {
      type: new ModelAndVersionRequest(),
      retry: true,
      postDelay: 0,
    };
    return await this.requestQueue(request) as ModelAndVersionResponse;
  }

  public async getAvailableZones(): Promise<AvailableZonesResponse> {
    const request: RainBirdRequest = {
      type: new AvailableZonesRequest(),
      retry: true,
      postDelay: 0,
    };
    return await this.requestQueue(request) as AvailableZonesResponse;
  }

  public async getSerialNumber(): Promise<SerialNumberResponse> {
    const request: RainBirdRequest = {
      type: new SerialNumberRequest(),
      retry: true,
      postDelay: 0,
    };
    return await this.requestQueue(request) as SerialNumberResponse;
  }

  public async runProgram(program: number): Promise<AcknowledgedResponse | NotAcknowledgedResponse> {
    const request: RainBirdRequest = {
      type: new RunProgramRequest(program),
      retry: true,
      postDelay: 1,
    };
    const response = await this.requestQueue(request);
    return response!.type === 0
      ? response as NotAcknowledgedResponse
      : response as AcknowledgedResponse;
  }

  public async runZone(zone: number, duration: number): Promise<AcknowledgedResponse | NotAcknowledgedResponse> {
    const request: RainBirdRequest = {
      type: new RunZoneRequest(zone, Math.round(duration / 60)),
      retry: true,
      postDelay: 1,
    };
    const response = await this.requestQueue(request);
    return response!.type === 0
      ? response as NotAcknowledgedResponse
      : response as AcknowledgedResponse;
  }

  public async advanceZone(): Promise<AcknowledgedResponse | NotAcknowledgedResponse> {
    const request: RainBirdRequest = {
      type: new AdvanceZoneRequest(),
      retry: true,
      postDelay: 1,
    };
    const response = await this.requestQueue(request);
    return response!.type === 0
      ? response as NotAcknowledgedResponse
      : response as AcknowledgedResponse;
  }

  public async stopIrrigation(): Promise<AcknowledgedResponse | NotAcknowledgedResponse> {
    const request: RainBirdRequest = {
      type: new StopIrrigationRequest(),
      retry: true,
      postDelay: 1,
    };
    const response = await this.requestQueue(request);
    return response!.type === 0
      ? response as NotAcknowledgedResponse
      : response as AcknowledgedResponse;
  }

  public async getControllerState(): Promise<ControllerStateResponse> {
    const request: RainBirdRequest = {
      type: new ControllerStateRequest(),
      retry: true,
      postDelay: 0,
    };
    return await this.requestQueue(request) as ControllerStateResponse;
  }

  public async getControllerDate(): Promise<ControllerDateGetResponse> {
    const request: RainBirdRequest = {
      type: new ControllerDateGetRequest(),
      retry: true,
      postDelay: 0,
    };
    return await this.requestQueue(request) as ControllerDateGetResponse;
  }

  public async setControllerDate(day: number, month: number, year: number): Promise<AcknowledgedResponse> {
    const request: RainBirdRequest = {
      type: new ControllerDateSetRequest(day, month, year),
      retry: true,
      postDelay: 0,
    };
    return await this.requestQueue(request) as AcknowledgedResponse;
  }

  public async getControllerTime(): Promise<ControllerTimeGetResponse> {
    const request: RainBirdRequest = {
      type: new ControllerTimeGetRequest(),
      retry: true,
      postDelay: 0,
    };
    return await this.requestQueue(request) as ControllerTimeGetResponse;
  }

  public async setControllerTime(hour: number, minute: number, second: number): Promise<AcknowledgedResponse> {
    const request: RainBirdRequest = {
      type: new ControllerTimeSetRequest(hour, minute, second),
      retry: true,
      postDelay: 0,
    };
    return await this.requestQueue(request) as AcknowledgedResponse;
  }

  public async getIrrigationState(): Promise<IrrigationStateResponse> {
    const request: RainBirdRequest = {
      type: new IrrigationStateRequest(),
      retry: true,
      postDelay: 0,
    };
    return await this.requestQueue(request) as IrrigationStateResponse;
  }

  public async getRainSensorState(): Promise<RainSensorStateResponse> {
    const request: RainBirdRequest = {
      type: new RainSensorStateRequest(),
      retry: false,
      postDelay: 0,
    };
    return await this.requestQueue(request) as RainSensorStateResponse;
  }

  public async getCurrentZone(): Promise<CurrentZoneResponse> {
    const request: RainBirdRequest = {
      type: new CurrentZoneRequest(),
      retry: false,
      postDelay: 0,
    };
    return await this.requestQueue(request) as CurrentZoneResponse;
  }

  public async getProgramZoneState(page = 0): Promise<ProgramZoneStateResponse> {
    const request: RainBirdRequest = {
      type: new ProgramZoneStateRequest(page),
      retry: false,
      postDelay: 0,
    };
    return await this.requestQueue(request) as ProgramZoneStateResponse;
  }

  public async getRaw(type: number, page = 0): Promise<RawResponse> {
    const request: RainBirdRequest = {
      type: new RawRequest(type, page),
      retry: false,
      postDelay: 0,
    };
    return await this.requestQueue(request) as RawResponse;
  }

  public async getIrrigationDelay(): Promise<IrrigationDelayGetResponse> {
    const request: RainBirdRequest = {
      type: new IrrigationDelayGetRequest(),
      retry: false,
      postDelay: 0,
    };
    return await this.requestQueue(request) as IrrigationDelayGetResponse;
  }

  public async setIrrigstionDelay(days: number): Promise<AcknowledgedResponse> {
    days = Math.max(Math.min(Math.round(days), 14), 0);
    const request: RainBirdRequest = {
      type: new IrrigationDelaySetRequest(days),
      retry: false,
      postDelay: 0,
    };
    return await this.requestQueue(request) as AcknowledgedResponse;
  }

  private async sendRequest(request: RainBirdRequest): Promise<Response | undefined> {
    if (this.showRequestResponse) {
      this.log.warn(`[${this.address}] Request:  ${request.type}`);
    }

    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        const url = `http://${this.address}/stick`;
        const data: Buffer = this.encrypt(request.type);
        const config = this.createRequestConfig();

        const resp = await axios.post(url, data, config);

        if (!resp.statusText || resp.status !== 200) {
          throw new Error(`Invalid Response [Status: ${resp.status}, Text: ${resp.statusText}]`);
        }

        const response = this.getResponse(resp.data as Buffer);
        await this.delay(request.postDelay);

        return response;
      } catch (error) {
        this.log.warn(`RainBird controller request failed. [${error}]`);
        this.log.warn(`Failed Request: ${request.type}`);
        if (!request.retry) {
          break;
        }
        this.log.warn(`Will retry in ${this.RETRY_DELAY} seconds`);
        await this.delay(this.RETRY_DELAY);
      }
    }
  }

  private getResponse(encryptedResponse: Buffer): Response | undefined {
    // eslint-disable-next-line no-control-regex
    const decryptedResponse = JSON.parse(this.decrypt(encryptedResponse).replace(/[\x10\x0A\x00]/g, ''));

    if (!decryptedResponse) {
      this.log.error('No response received');
      return;
    }
    if (decryptedResponse.error) {
      this.log.error(
        `Received error from Rainbird controller ${decryptedResponse.error.code}: ${decryptedResponse.error.message}`);
      return;
    }
    if (!decryptedResponse.result) {
      this.log.error('Invalid response received');
      return;
    }
    const data = Buffer.from(decryptedResponse.result.data, 'hex');

    let response: Response | undefined = undefined;
    switch (data[0]) {
      case 0x00:
        response = new NotAcknowledgedResponse(data);
        break;
      case 0x01:
        response = new AcknowledgedResponse(data);
        break;
      case 0x82:
        response = new ModelAndVersionResponse(data);
        break;
      case 0x83:
        response = new AvailableZonesResponse(data);
        break;
      case 0x85:
        response = new SerialNumberResponse(data);
        break;
      case 0x90:
        response = new ControllerTimeGetResponse(data);
        break;
      case 0x92:
        response = new ControllerDateGetResponse(data);
        break;
      case 0xB6:
        response = new IrrigationDelayGetResponse(data);
        break;
      case 0xBB:
        response = new ProgramZoneStateResponse(data);
        break;
      case 0xBE:
        response = new RainSensorStateResponse(data);
        break;
      case 0xBF:
        response = new CurrentZoneResponse(data);
        break;
      case 0xC8:
        response = new IrrigationStateResponse(data);
        break;
      case 0xCC:
        response = new ControllerStateResponse(data);
        break;
      default:
        response = new RawResponse(data);
    }

    if (this.showRequestResponse) {
      this.log.warn(`[${this.address}] Response: ${response ?? 'Unknown'}`);
    }

    return response;
  }

  private encrypt(request: Request): Buffer {
    const formattedRequest = this.formatRequest(request);
    const
      passwordHash = crypto.createHash('sha256').update(this.toBytes(this.password)).digest(),
      randomBytes = crypto.randomBytes(16),
      packedRequest = this.toBytes(this.addPadding(`${formattedRequest}\x00\x10`)),
      hashedRequest = crypto.createHash('sha256').update(this.toBytes(formattedRequest)).digest(),
      easEncryptor = new aesjs.ModeOfOperation.cbc(passwordHash, randomBytes),
      encryptedRequest = Buffer.from(easEncryptor.encrypt(packedRequest));
    return Buffer.concat([hashedRequest, randomBytes, encryptedRequest]);
  }

  private decrypt(data: Buffer): string {
    const
      passwordHash = crypto.createHash('sha256').update(this.toBytes(this.password)).digest().slice(0, 32),
      randomBytes = data.slice(32, 48),
      encryptedBody = data.slice(48, data.length),
      aesDecryptor = new aesjs.ModeOfOperation.cbc(passwordHash, randomBytes);
    return new encoder.TextDecoder().decode(aesDecryptor.decrypt(encryptedBody));
  }

  private formatRequest(request: Request) {
    const data: Buffer = request.toBuffer();
    return JSON.stringify({
      'id': 9,
      'jsonrpc': '2.0',
      'method': 'tunnelSip',
      'params': {
        'data': data.toString('hex'),
        'length': data.length,
      },
    });
  }

  private createRequestConfig(): AxiosRequestConfig {
    return {
      responseType: 'arraybuffer',
      headers: {
        'Accept-Language': 'en',
        'Accept-Encoding': 'gzip, deflate',
        'User-Agent': 'RainBird/2.0 CFNetwork/811.5.4 Darwin/16.7.0',
        'Accept': '*/*',
        'Connection': 'keep-alive',
        'Content-Type': 'application/octet-stream',
      },
    };
  }

  private toBytes(str: string) {
    return new encoder.TextEncoder('utf-8').encode(str);
  }

  private addPadding(data: string): string {
    const BLOCK_SIZE = 16;
    const dataLength = data.length;
    const charsToAdd = (dataLength + BLOCK_SIZE) - (dataLength % BLOCK_SIZE) - dataLength;
    const pad_string = Array(charsToAdd + 1).join('\x10');
    return [data, pad_string].join('');
  }

  private async delay(sec: number): Promise<void> {
    await new Promise((resolve) => {
      setTimeout(() => {
        resolve('');
      }, sec * 1000);
    });
  }
}
