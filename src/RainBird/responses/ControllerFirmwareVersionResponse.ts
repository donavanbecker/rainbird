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
    this._patch = response.readUInt16BE(3)
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
