import { Request } from './Request.js';

export class ControllerStateRequest extends Request {
  get type(): number {
    return 0x4C;
  }

  toBuffer(): Buffer {
    return Buffer.from([this.type]);
  }
}