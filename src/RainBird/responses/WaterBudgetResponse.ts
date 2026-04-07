import type { Buffer } from 'node:buffer'

import { Response } from './Response.js'

export class WaterBudgetResponse extends Response {
  private readonly _programCode: number
  private readonly _seasonalAdjust: number

  constructor(private readonly response: Buffer) {
    super()
    this._programCode = response[1]
    this._seasonalAdjust = response.readUInt16BE(2)
  }

  get type(): number {
    return 0xB0
  }

  get programCode(): number {
    return this._programCode
  }

  get seasonalAdjust(): number {
    return this._seasonalAdjust
  }

  toBuffer(): Buffer {
    return this.response
  }
}
