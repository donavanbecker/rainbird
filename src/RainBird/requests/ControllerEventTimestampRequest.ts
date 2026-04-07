import { Buffer } from 'node:buffer'

import { Request } from './Request.js'

export class ControllerEventTimestampRequest extends Request {
  private _eventId: number

  constructor(eventId: number) {
    super()
    this._eventId = eventId
  }

  get type(): number {
    return 0x4A
  }

  get eventId(): number {
    return this._eventId
  }

  toBuffer(): Buffer {
    return Buffer.from([this.type, this._eventId])
  }
}
