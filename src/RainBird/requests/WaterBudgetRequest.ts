import { Buffer } from 'node:buffer'

import { Request } from './Request.js'

export class WaterBudgetRequest extends Request {
  private _program: number

  constructor(program: number) {
    super()
    this._program = program
  }

  get type(): number {
    return 0x30
  }

  get program(): number {
    return this._program
  }

  toBuffer(): Buffer {
    return Buffer.from([this.type, this._program])
  }
}
