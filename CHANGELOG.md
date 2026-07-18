## [1.2.10](https://github.com/homebridge-plugins/rainbird/compare/v1.2.9...v1.2.10) (2026-07-18)



## 1.2.10-beta.0 (2026-07-17)


### Bug Fixes

* use pure null padding without the legacy suffix so newer lnk2 firmware accepts requests ([b82dbaa](https://github.com/homebridge-plugins/rainbird/commit/b82dbaacdf579b851c4ad93551076dcc78e616d9))

**# Changelog

All notable changes to this project will be documented in this file. This project uses [Semantic Versioning](https://semver.org/)

## [1.2.9](https://github.com/homebridge-plugins/rainbird/compare/v1.2.8...v1.2.9) (2026-04-13)


### Features

* HTTPS support with automatic protocol discovery for RainBird v2 controllers ([#45](https://github.com/homebridge-plugins/rainbird/issues/45)) ([5d28c11](https://github.com/homebridge-plugins/rainbird/commit/5d28c11ada40bf3684c0ab8c7288cc8d8794870d))

## [1.2.8](https://github.com/homebridge-plugins/rainbird/compare/v1.2.6...v1.2.8) (2026-04-13)


### Features

* add new request/response types from pyrainbird v6.3.0 ([c8d08e9](https://github.com/homebridge-plugins/rainbird/commit/c8d08e940cee4b4f97e833d79b7899c4a4446cb3))
* wire new commands into RainBirdClient and RainBirdService ([6da706b](https://github.com/homebridge-plugins/rainbird/commit/6da706b4adcf26df830ceb07e3d7887a14cb76e2))

## [1.2.6](https://github.com/homebridge-plugins/rainbird/compare/v1.2.5...v1.2.6) (2025-09-18)

## [1.2.5](https://github.com/homebridge-plugins/rainbird/compare/v1.2.4...v1.2.5) (2025-09-02)

## [1.2.4](https://github.com/homebridge-plugins/rainbird/compare/v1.2.3...v1.2.4) (2025-06-10)

## [1.2.3](https://github.com/homebridge-plugins/rainbird/compare/v1.2.2...v1.2.3) (2025-03-05)

## [1.2.2](https://github.com/homebridge-plugins/rainbird/compare/v1.2.1...v1.2.2) (2025-01-26)

## [1.2.1](https://github.com/homebridge-plugins/rainbird/compare/v1.2.0...v1.2.1) (2025-01-17)

# [1.2.0](https://github.com/homebridge-plugins/rainbird/compare/v1.1.0...v1.2.0) (2024-11-04)

# [1.1.0](https://github.com/homebridge-plugins/rainbird/compare/v1.0.1...v1.1.0) (2024-08-31)

## [1.0.1](https://github.com/homebridge-plugins/rainbird/compare/v1.0.0...v1.0.1) (2024-05-26)

# [1.0.0](https://github.com/homebridge-plugins/rainbird/compare/v0.1.0...v1.0.0) (2024-01-31)

# 0.1.0 (2024-01-22)

## [1.2.8](https://github.com/homebridge-plugins/rainbird/compare/v1.2.6...v1.2.8) (2026-04-13)


### Features

* add new request/response types from pyrainbird v6.3.0 ([c8d08e9](https://github.com/homebridge-plugins/rainbird/commit/c8d08e940cee4b4f97e833d79b7899c4a4446cb3))
* wire new commands into RainBirdClient and RainBirdService ([6da706b](https://github.com/homebridge-plugins/rainbird/commit/6da706b4adcf26df830ceb07e3d7887a14cb76e2))

## [1.2.6](https://github.com/homebridge-plugins/rainbird/compare/v1.2.5...v1.2.6) (2025-09-18)

## [1.2.5](https://github.com/homebridge-plugins/rainbird/compare/v1.2.4...v1.2.5) (2025-09-02)

## [1.2.4](https://github.com/homebridge-plugins/rainbird/compare/v1.2.3...v1.2.4) (2025-06-10)

## [1.2.3](https://github.com/homebridge-plugins/rainbird/compare/v1.2.2...v1.2.3) (2025-03-05)

## [1.2.2](https://github.com/homebridge-plugins/rainbird/compare/v1.2.1...v1.2.2) (2025-01-26)

## [1.2.1](https://github.com/homebridge-plugins/rainbird/compare/v1.2.0...v1.2.1) (2025-01-17)

# [1.2.0](https://github.com/homebridge-plugins/rainbird/compare/v1.1.0...v1.2.0) (2024-11-04)

# [1.1.0](https://github.com/homebridge-plugins/rainbird/compare/v1.0.1...v1.1.0) (2024-08-31)

## [1.0.1](https://github.com/homebridge-plugins/rainbird/compare/v1.0.0...v1.0.1) (2024-05-26)

# [1.0.0](https://github.com/homebridge-plugins/rainbird/compare/v0.1.0...v1.0.0) (2024-01-31)

# 0.1.0 (2024-01-22)

## [1.2.7](https://github.com/homebridge-plugins/rainbird/compare/v1.2.6...v1.2.7) (2026-04-07)

### Features

* add new request/response types from pyrainbird v6.3.0 ([c8d08e9](https://github.com/homebridge-plugins/rainbird/commit/c8d08e9))
* wire new commands into RainBirdClient and RainBirdService ([6da706b](https://github.com/homebridge-plugins/rainbird/commit/6da706b))

### Bug Fixes

* add `.catch()` handler on `zoneQueue.add()` to prevent unhandled promise rejections under p-queue v9 ([6da706b](https://github.com/homebridge-plugins/rainbird/commit/6da706b))

### Miscellaneous Chores

* replace `axios` with `undici` for HTTP requests — lighter, no peer deps, built-in Node.js HTTP client ([faa7324](https://github.com/homebridge-plugins/rainbird/commit/faa7324))
* bump `p-queue` to v9.1.2 — `throwOnTimeout` removed; timeouts always throw ([faa7324](https://github.com/homebridge-plugins/rainbird/commit/faa7324))
* bump `eslint` to v10.2.0, `eslint-plugin-format` to v2.0.1, `eslint-plugin-perfectionist` to v5.8.0, `typescript` to v6.0.2, `@types/node` to v25.5.2 ([faa7324](https://github.com/homebridge-plugins/rainbird/commit/faa7324))
* update `perfectionist/sort-imports` group names for eslint-plugin-perfectionist v5.x API change (`builtin-type` → `type-builtin`, etc.) ([fe3a344](https://github.com/homebridge-plugins/rainbird/commit/fe3a344))
* add `"types": ["node"]` to tsconfig for TypeScript 6 compatibility with `node:` prefix imports ([fe3a344](https://github.com/homebridge-plugins/rainbird/commit/fe3a344))
* consolidate beta and stable release workflows into a single `release.yml`; remove separate `beta-release.yml` ([c514c88](https://github.com/homebridge-plugins/rainbird/commit/c514c88))

**Full Changelog**: https://github.com/homebridge-plugins/rainbird/compare/v1.2.6...v1.2.7

## [1.2.6](https://github.com/homebridge-plugins/rainbird/releases/tag/v1.2.6) (2025-09-18)

## What's Changed
* No notable changes

**Full Changelog**: https://github.com/homebridge-plugins/rainbird/compare/v1.2.5...v1.2.6

## [1.2.5](https://github.com/homebridge-plugins/rainbird/tag/v1.2.5) (2025-09-01)

### What's Changed
- Fix ESLint config for v9 compatibility (remove duplicate plugin and unsupported rules)
- Update documentation for RainBirdService API
- Add support for ESP-ME3 controller detection
- Improve error handling for network timeouts
- Refactor request/response classes for better type safety
- Update dependencies and housekeeping

**Full Changelog**: https://github.com/homebridge-plugins/rainbird/compare/v1.2.4...v1.2.5

## [1.2.4](https://github.com/homebridge-plugins/rainbird/tag/v1.2.4) (2025-06-10)

### What's Changed
- Issue 23: Fix request/response logging & improve documentation @mantorok1 [#24]

**Full Changelog**: https://github.com/homebridge-plugins/rainbird/compare/v1.2.3...v1.2.4

## [1.2.3](https://github.com/homebridge-plugins/rainbird/tag/v1.2.3) (2025-03-04)

# *No New Releases During Lent*

### What's Changed
- Housekeeping and updated dependencies.

**Full Changelog**: https://github.com/homebridge-plugins/rainbird/compare/v1.2.2...v1.2.3

## [1.2.2](https://github.com/homebridge-plugins/rainbird/tag/v1.2.2) (2025-01-25)

### What's Changed
- Housekeeping and updated dependencies.

**Full Changelog**: https://github.com/homebridge-plugins/rainbird/compare/v1.2.1...v1.2.2

## [1.2.1](https://github.com/homebridge-plugins/rainbird/tag/v1.2.1) (2025-01-16)

### What's Changed
- Housekeeping and updated dependencies.

**Full Changelog**: https://github.com/homebridge-plugins/rainbird/compare/v1.2.0...v1.2.1

## [1.2.0](https://github.com/homebridge-plugins/rainbird/tag/v1.2.0) (2024-11-03)

### What's Changed
- Emit logs intead of using logLevel
- Housekeeping and updated dependencies.

**Full Changelog**: https://github.com/homebridge-plugins/rainbird/compare/v1.1.0...v1.2.0

## [1.1.0](https://github.com/homebridge-plugins/rainbird/tag/v1.1.0) (2024-08-31)

### What's Changed
- Replace `queue` & `concurrent-queue` with `p-queue`
- Housekeeping and updated dependencies.

**Full Changelog**: https://github.com/homebridge-plugins/rainbird/compare/v1.0.1...v1.1.0

## [1.0.1](https://github.com/homebridge-plugins/rainbird/tag/v1.0.1) (2024-05-26)

### What's Changed
- Use events for logging, Thanks [@mantorok1](https://github.com/mantorok1)
- Document API, Thanks [@mantorok1](https://github.com/mantorok1)
- Housekeeping and updated dependencies.

**Full Changelog**: https://github.com/homebridge-plugins/rainbird/compare/v1.0.0...v1.0.1

## [1.0.0](https://github.com/homebridge-plugins/rainbird/tag/v1.0.0) (2024-01-31)

### What's Changed
- Release of standalone RainBird module.

**Full Changelog**: https://github.com/homebridge-plugins/rainbird/compare/v0.2.0...v1.0.0

## [0.2.0](https://github.com/homebridge-plugins/rainbird/tag/v0.2.0) (2024-01-22)

### What's Changed
- Resolve ES Module imports

**Full Changelog**: https://github.com/homebridge-plugins/rainbird/compare/v0.1.0...v0.2.0

## [0.1.0](https://github.com/homebridge-plugins/rainbird/tag/v0.1.0) (2024-01-21)

### What's Changed
- Initial Release
