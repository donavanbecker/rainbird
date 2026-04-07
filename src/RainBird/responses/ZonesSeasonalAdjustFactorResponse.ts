import type { Buffer } from 'node:buffer'

import { Response } from './Response.js'

export class ZonesSeasonalAdjustFactorResponse extends Response {
  private readonly _programCode: number
  private readonly _stationsSA: number[]

  constructor(private readonly response: Buffer) {
    super()
    this._programCode = response[1]
    this._stationsSA = []
    // 16 bytes of station seasonal adjust factors (one byte per zone, up to 16 zones per page)
    for (let i = 0; i < 16; i++) {
      this._stationsSA.push(response[2 + i] ?? 0)
    }
  }

  get type(): number {
    return 0xB2
  }

  get programCode(): number {
    return this._programCode
  }

  get stationsSA(): number[] {
    return this._stationsSA
  }

  toBuffer(): Buffer {
    return this.response
  }
}
