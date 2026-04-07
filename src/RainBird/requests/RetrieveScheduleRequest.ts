import { Buffer } from 'node:buffer'

import { Request } from './Request.js'

export class RetrieveScheduleRequest extends Request {
  private _page: number

  constructor(page = 0) {
    super()
    this._page = page
  }

  get type(): number {
    return 0x20
  }

  get page(): number {
    return this._page
  }

  toBuffer(): Buffer {
    const page = Buffer.alloc(2)
    page.writeUInt16BE(this._page)
    return Buffer.concat([Buffer.from([this.type]), page])
  }
}
