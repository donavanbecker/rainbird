import { Buffer } from 'node:buffer'

import { Request } from './Request.js'

export class CommandSupportRequest extends Request {
  private _commandId: number

  constructor(commandId: number) {
    super()
    this._commandId = commandId
  }

  get type(): number {
    return 0x04
  }

  get commandId(): number {
    return this._commandId
  }

  toBuffer(): Buffer {
    return Buffer.from([this.type, this._commandId])
  }
}
