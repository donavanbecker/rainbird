# RainBird TypeScript Library

Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.

RainBird is a TypeScript Node.js library for controlling RainBird irrigation controllers via the RainBird LNK WiFi Module. It provides an event-driven API to manage irrigation zones, programs, and controller settings. This library is published to npm and used primarily in home automation systems like Homebridge.

## Branch Management and Release Strategy

### Beta Branch Workflow

- **REQUIRED**: All PRs must target branches starting with "beta-" prefix
- Beta branches should be named after the target version: `beta-X.Y.Z`
- If no beta branch exists for the target version, create one based on the next semantic version
- Current version is tracked in package.json - increment appropriately for beta branches

### Version Labeling Requirements

Before assigning issues to @copilot, apply one of these labels to determine version bump:

- **patch** - Bug fixes and minor improvements (X.Y.Z → X.Y.Z+1)
- **minor** - New features and enhancements (X.Y.Z → X.Y+1.0)
- **major** - Breaking changes (X.Y.Z → X+1.0.0)

### Branch Creation Process

1. Check current version in package.json
2. Determine version bump type from issue labels (patch/minor/major)
3. Create beta branch: `git checkout -b beta-X.Y.Z` where X.Y.Z is the target version
4. Target all development work to the beta branch
5. Beta branches will be merged to main when ready for release

## Working Effectively

### Bootstrap and Setup

- Install Node.js version 20 or 22 (required by engines field)
- Install dependencies: `npm install` -- takes 20-30 seconds typically
- Build the library: `npm run build` -- takes 3-5 seconds, builds TypeScript to ES2022 modules in dist/
- Generate documentation: `npm run docs` -- takes 4-6 seconds, creates TypeDoc docs in docs/

### Build and Development Commands

- `npm run build` -- Clean and compile TypeScript (fast: ~4 seconds)
- `npm run clean` -- Remove dist/ folder
- `npm run lint` -- Run ESLint on src/**/*.ts (fast: ~3 seconds)
- `npm run lint:fix` -- Auto-fix ESLint issues
- `npm run docs` -- Generate TypeDoc documentation (fast: ~5 seconds)
- `npm run lint-docs` -- Validate documentation without generating files (fast: ~4 seconds)
- `npm test` -- Currently only runs lint (no unit tests exist)
- `npm run watch` -- Build, link, and run with nodemon for development

### Pre-publication Validation

- `npm run prepublishOnly` -- Runs lint, build, docs, and lint-docs in sequence (takes ~16 seconds total)
- Always run this before committing major changes as it mimics the CI validation

## Validation

### Code Quality Validation

- Always run `npm run lint` before committing changes
- Run `npm run build` to ensure TypeScript compiles without errors
- Run `npm run lint-docs` to validate TypeDoc comments and links
- The CI will fail if any of these commands fail

### Functional Validation Limitations

- **CRITICAL**: This library requires actual RainBird controller hardware to test functionality
- You cannot run end-to-end tests without a physical RainBird controller and LNK WiFi module
- Example code in examples/ requires real controller IP address and password to execute
- Focus validation on: build success, lint passing, documentation generation, and type checking

### Manual Testing with Examples

- Build the main library first: `npm run build`
- Navigate to examples/: `cd examples`
- Install example dependencies: `npm install` (fast: ~1 second)
- Build the example: `npm run build` (fast: ~3 seconds)
- **NOTE**: `npm start` requires real controller credentials and will fail without hardware

### What to Test After Changes

- Ensure TypeScript compiles: `npm run build`
- Verify code style: `npm run lint`
- Check documentation builds: `npm run docs`
- Validate example still compiles: `cd examples && npm run build`
- Review generated documentation in docs/ folder for accuracy

## Key Project Areas

### Core Library Structure

- `/src/index.ts` -- Main export file, exports RainBirdService, EventType, LogLevel
- `/src/RainBird/RainBirdService.ts` -- Main service class with irrigation control methods
- `/src/RainBird/RainBirdClient.ts` -- Low-level communication with controller
- `/src/RainBird/requests/` -- Request message classes
- `/src/RainBird/responses/` -- Response message classes

### Documentation and Examples

- `/api/api_guide.md` -- Comprehensive API documentation, used as TypeDoc readme
- `/examples/` -- Working example code with separate package.json and build
- `/docs/` -- Generated TypeDoc documentation (auto-generated, do not edit)
- `README.md` -- Main project documentation with installation and usage

### Configuration Files

- `package.json` -- Main package configuration with scripts and dependencies
- `tsconfig.json` -- TypeScript configuration for ES2022 modules with bundler resolution
- `typedoc.json` -- TypeDoc configuration using dmt theme
- `eslint.config.js` -- ESLint configuration using @antfu/eslint-config

### Dependencies and Requirements

- **Runtime**: aes-js, axios, p-queue, rxjs, text-encoder
- **Build**: TypeScript 5.8+, ESLint, TypeDoc
- **Node**: Requires Node.js 20 or 22 (specified in engines)
- **Module System**: Uses ES2022 modules with .js extensions in imports

## Common Tasks

### Adding New Functionality

- Add types/interfaces in appropriate files under src/RainBird/
- Update RainBirdService.ts for new public methods
- Add corresponding request/response classes if needed
- Update api/api_guide.md with documentation
- Run `npm run build && npm run docs` to regenerate documentation
- Always test compilation: `npm run lint && npm run build`

### Working with Examples

- Examples are in `/examples/` with separate package.json
- Example uses the built library from `../dist/index.js`
- To test examples: build main library first, then build example
- Examples cannot be fully tested without actual RainBird hardware

### CI/CD Integration

- GitHub Actions uses homebridge shared workflows
- Build runs: install, build, test (lint), and ESLint
- No unit tests currently exist in the project
- CI will fail if build, lint, or docs generation fails

### Working with Issues and PRs

- **ALWAYS** check that issues have proper version labels (patch/minor/major) before starting work
- **ALWAYS** target beta branches (beta-X.Y.Z) instead of main branch
- Create beta branch if one doesn't exist for the target version
- Follow semantic versioning based on the type of change being made

### File Management and Git

- The .gitignore is comprehensive and excludes build artifacts, node_modules, and temporary files
- Generated docs/ folder is tracked in git (auto-generated TypeDoc output)
- dist/ folder is ignored as it contains build output
- When using report_progress, review committed files to ensure only intended changes are included

## Common Issues and Solutions

### Build Issues

- If build fails, check TypeScript errors in src/
- Ensure all imports use .js extensions (required for ES modules)
- Check tsconfig.json for compatibility with Node version

### Import/Export Issues

- This project uses ES2022 modules with bundler resolution
- All imports must include .js extensions in source files
- Example: `import { RainBirdService } from '../dist/index.js'`

### Documentation Issues

- TypeDoc uses api/api_guide.md as the main readme
- Documentation is generated from TypeScript comments
- Run `npm run lint-docs` to catch documentation warnings

### Example Testing Limitations

- Examples require real RainBird controller hardware
- Cannot validate full functionality without physical device
- Focus on ensuring examples compile and types are correct

## Repository Commands Reference

```bash
# Quick validation workflow
npm install
npm run lint
npm run build
npm run docs

# Development workflow
npm run build
cd examples && npm run build

# Full CI simulation
npm run prepublishOnly

# Clean rebuild
npm run clean && npm run build
```

## Hardware Requirements for Full Testing

**IMPORTANT**: Full functional testing requires:

- RainBird irrigation controller with LNK WiFi Module
- Supported models: ESP-Me, ESP-TM2, ESP-RZXe, ESP-ME3
- Controller must be configured with IP address and password
- Network connectivity to controller

Without hardware, validation is limited to:

- Code compilation and type checking
- Linting and code style
- Documentation generation
- Example compilation (but not execution)
