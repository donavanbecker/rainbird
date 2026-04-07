import { Buffer } from 'node:buffer'

import { Request } from './Request.js'

export class StackRunZoneRequest extends Request {
  private _page: number
  private _zone: number
  private _minutes: number

  constructor(page: number, zone: number, minutes: number) {
    super()
    this._page = page
    this._zone = zone
    this._minutes = minutes
  }

  get type(): number {
    return 0x4B
  }

  get page(): number {
    return this._page
  }

  get zone(): number {
    return this._zone
  }

  get minutes(): number {
    return this._minutes
  }

  toBuffer(): Buffer {
    return Buffer.from([this.type, this._page, this._zone, this._minutes])
  }
}
