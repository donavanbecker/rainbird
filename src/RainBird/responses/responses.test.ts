import { Buffer } from 'node:buffer'

import { describe, expect, it } from 'vitest'

import { AvailableZonesResponse } from './AvailableZonesResponse.js'
import { ModelAndVersionResponse } from './ModelAndVersionResponse.js'

/**
 * These parsers turn raw controller bytes into the values every accessory is
 * built from, so an off-by-one or a wrong endianness here is invisible in code
 * review and obvious only to someone with the hardware in front of them.
 */

describe('modelAndVersionResponse', () => {
  // 0x82, model (2 bytes, big endian), major, minor
  const buffer = (model: number, major: number, minor: number) =>
    Buffer.from([0x82, (model >> 8) & 0xFF, model & 0xFF, major, minor])

  it('reads the model number as big endian', () => {
    // Little endian would read 0x0900 here, so this pins the byte order.
    expect(new ModelAndVersionResponse(buffer(0x0009, 2, 3)).modelNumber).toBe(0x0009)
  })

  it('resolves a known model number to its name', () => {
    expect(new ModelAndVersionResponse(buffer(0x0009, 2, 3)).modelName).toBe('ESP-ME3')
    expect(new ModelAndVersionResponse(buffer(0x0006, 1, 0)).modelName).toBe('ST8x-WiFi')
  })

  it('falls back to the raw number for a controller we do not know', () => {
    // A new model must still report something usable rather than "undefined".
    expect(new ModelAndVersionResponse(buffer(0x7FFF, 1, 0)).modelName).toBe('32767')
  })

  it('reads the version as major.minor', () => {
    expect(new ModelAndVersionResponse(buffer(0x0009, 2, 3)).version).toBe('2.3')
  })

  it('reports its own response type', () => {
    expect(new ModelAndVersionResponse(buffer(0x0009, 1, 0)).type).toBe(0x82)
  })
})

describe('availableZonesResponse', () => {
  // 0x83, page, then a 32 bit little endian zone bitmask
  const buffer = (page: number, mask: number) => {
    const b = Buffer.alloc(6)
    b[0] = 0x83
    b[1] = page
    b.writeUInt32LE(mask >>> 0, 2)
    return b
  }

  it('maps bit 0 to zone 1, not zone 0', () => {
    // Zones are 1-based to the user. Getting this wrong shifts every zone.
    expect(new AvailableZonesResponse(buffer(0, 0b1)).zones).toEqual([1])
  })

  it('decodes a contiguous run of zones', () => {
    expect(new AvailableZonesResponse(buffer(0, 0b1111_1111)).zones)
      .toEqual([1, 2, 3, 4, 5, 6, 7, 8])
  })

  it('decodes a sparse set, skipping the gaps', () => {
    // Zones 1, 4 and 6 - a real controller with zones removed.
    expect(new AvailableZonesResponse(buffer(0, 0b10_1001)).zones).toEqual([1, 4, 6])
  })

  it('handles the top bit without going negative', () => {
    // Bit 31 makes a signed 32 bit read negative; the shift must be unsigned
    // or the loop terminates early and loses zones.
    expect(new AvailableZonesResponse(buffer(0, 0x8000_0000)).zones).toEqual([32])
  })

  it('returns no zones for an empty mask', () => {
    expect(new AvailableZonesResponse(buffer(0, 0)).zones).toEqual([])
  })

  it('reads the page number and its own type', () => {
    const response = new AvailableZonesResponse(buffer(2, 0b11))
    expect(response.page).toBe(2)
    expect(response.type).toBe(0x83)
  })
})
