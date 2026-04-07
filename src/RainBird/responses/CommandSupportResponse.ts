import type { Buffer } from 'node:buffer'

import { Response } from './Response.js'

export class CommandSupportResponse extends Response {
  private readonly _commandEcho: number
  private readonly _support: boolean

  constructor(private readonly response: Buffer) {
    super()
    this._commandEcho = response[1]
    this._support = response[2] !== 0
  }

  get type(): number {
    return 0x84
  }

  get commandEcho(): number {
    return this._commandEcho
  }

  get support(): boolean {
    return this._support
  }

  toBuffer(): Buffer {
    return this.response
  }
}
