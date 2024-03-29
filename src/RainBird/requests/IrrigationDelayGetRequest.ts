import { Request } from './Request.js';

export class IrrigationDelayGetRequest extends Request {
  get type(): number {
    return 0x36;
  }

  toBuffer(): Buffer {
    return Buffer.from([this.type]);
  }
}