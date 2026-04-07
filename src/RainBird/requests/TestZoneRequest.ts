import { Buffer } from 'node:buffer'

import { Request } from './Request.js'

export class TestZoneRequest extends Request {
  private _zone: number

  constructor(zone: number) {
    super()
    this._zone = zone
  }

  get type(): number {
    return 0x3A
  }

  get zone(): number {
    return this._zone
  }

  toBuffer(): Buffer {
    return Buffer.from([this.type, this._zone])
  }
}
