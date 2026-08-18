import type { Buffer } from 'node:buffer'

import { Response } from './Response.js'

export class ControllerFirmwareVersionResponse extends Response {
  private readonly _major: number
  private readonly _minor: number
  private readonly _patch: number

  constructor(private readonly response: Buffer) {
    super()
    this._major = response[1]
    this._minor = response[2]
    // Not every controller sends the 16 bit patch field. An ST8x-WiFi2 answers
    // this command with four bytes (8B 00 5A 00), and readUInt16BE(3) needs a
    // fifth. It threw a RangeError, and because the request is retryable the
    // library then re-sent it every 60 seconds forever, so the controller was
    // usable but the log never stopped filling up.
    this._patch = response.length >= 5 ? response.readUInt16BE(3) : (response[3] ?? 0)
  }

  get type(): number {
    return 0x8B
  }

  get major(): number {
    return this._major
  }

  get minor(): number {
    return this._minor
  }

  get patch(): number {
    return this._patch
  }

  get version(): string {
    return `${this._major}.${this._minor}.${this._patch}`
  }

  toBuffer(): Buffer {
    return this.response
  }
}
