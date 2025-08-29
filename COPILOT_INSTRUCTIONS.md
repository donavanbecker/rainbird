# GitHub Copilot Instructions

## Overview
This document provides instructions for GitHub Copilot when working on the rainbird project. These instructions ensure proper workflow management and semantic versioning.

## Branch Strategy

### Beta Branch Targeting
- **ALL** pull requests must target a branch that starts with `beta-`
- If no beta branch exists, create one based on the next version following semantic versioning
- Never target the `latest` branch directly

### Beta Branch Creation
When creating a new beta branch:
1. Determine the next version based on the issue labels:
   - `patch`: Increment patch version (e.g., 1.2.4 → 1.2.5)
   - `minor`: Increment minor version (e.g., 1.2.4 → 1.3.0) 
   - `major`: Increment major version (e.g., 1.2.4 → 2.0.0)
2. Create branch named `beta-X.Y.Z` where X.Y.Z is the target version
3. Base the new beta branch on the `latest` branch

## Required Labels

### Issue Assignment Prerequisites
Before assigning any issue to @copilot, the following labels MUST be present:

**Version Type Labels (exactly one required):**
- `patch` - For bug fixes and small improvements
- `minor` - For new features and enhancements  
- `major` - For breaking changes

**Additional Recommended Labels:**
- `bug` - For bug reports
- `enhancement` - For feature requests
- `dependencies` - For dependency updates
- `docs` - For documentation changes

### Label Validation
- Issues without proper version labels (patch/minor/major) should NOT be assigned to Copilot
- If labels are missing, request the issue author or maintainers to add appropriate labels before assignment

## Workflow Process

### 1. Issue Triage
1. Verify required labels are present
2. Determine target version based on labels
3. Check if appropriate beta branch exists

### 2. Beta Branch Management
1. If beta branch exists for target version: use it
2. If no beta branch exists: create `beta-X.Y.Z` from `latest`
3. All work should be done on feature branches that merge to beta

### 3. Pull Request Creation
1. Target the appropriate beta branch (never `latest`)
2. Follow existing PR template requirements
3. Ensure CI/CD workflows pass
4. Reference the original issue number

## Version Examples

Current version: `1.2.4`

**Patch Release (bug fixes):**
- Label: `patch`
- Target branch: `beta-1.2.5`
- Examples: Bug fixes, small improvements, documentation updates

**Minor Release (new features):**
- Label: `minor` 
- Target branch: `beta-1.3.0`
- Examples: New features, enhancements, non-breaking API additions

**Major Release (breaking changes):**
- Label: `major`
- Target branch: `beta-2.0.0`
- Examples: Breaking API changes, major architecture changes

## Beta Release Workflow

The repository includes automated beta release workflows:
- Beta branches trigger `beta-release.yml` workflow
- Beta releases are published to npm with `beta` tag
- After testing, beta branches can be merged to `latest` for stable release

## Error Handling

### Missing Labels
If an issue lacks required labels:
```
This issue requires a version label (patch/minor/major) before it can be assigned to Copilot. Please add the appropriate label based on the type of change:
- `patch` for bug fixes
- `minor` for new features  
- `major` for breaking changes
```

### No Beta Branch
If no appropriate beta branch exists, create one:
```bash
git checkout latest
git checkout -b beta-X.Y.Z
git push origin beta-X.Y.Z
```

## Compliance
- These instructions are mandatory for all Copilot work
- Deviations require explicit approval from maintainers
- Regular audits ensure compliance with these guidelines