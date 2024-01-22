import { Request } from './Request.js';

export class RainSensorStateRequest extends Request {
  get type(): number {
    return 0x3E;
  }

  toBuffer(): Buffer {
    return Buffer.from([this.type]);
  }
}