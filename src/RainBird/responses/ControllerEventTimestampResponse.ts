import type { Buffer } from 'node:buffer'

import { Response } from './Response.js'

export class ControllerEventTimestampResponse extends Response {
  private readonly _eventId: number
  private readonly _timestamp: number

  constructor(private readonly response: Buffer) {
    super()
    this._eventId = response[1]
    this._timestamp = response.readUInt32BE(2)
  }

  get type(): number {
    return 0xCA
  }

  get eventId(): number {
    return this._eventId
  }

  get timestamp(): number {
    return this._timestamp
  }

  toBuffer(): Buffer {
    return this.response
  }
}
