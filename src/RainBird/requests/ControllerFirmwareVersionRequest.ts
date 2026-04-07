import { Buffer } from 'node:buffer'

import { Request } from './Request.js'

export class ControllerFirmwareVersionRequest extends Request {
  get type(): number {
    return 0x0B
  }

  toBuffer(): Buffer {
    return Buffer.from([this.type])
  }
}
