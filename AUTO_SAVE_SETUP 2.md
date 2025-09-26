# Auto-Save Setup for CareGrid Project

This document explains how to automatically save your work to GitHub with proper branch management.

## Quick Setup

### 1. Use the Auto-Save Script

Run this command from anywhere in the project:

```bash
# Auto-save with default timestamp message
./scripts/auto-save.sh

# Auto-save with custom message
./scripts/auto-save.sh "Your custom commit message"
```

### 2. Create a Convenient Alias

Add this to your `~/.zshrc` or `~/.bashrc`:

```bash
# CareGrid auto-save alias
alias cg-save='cd "/Users/om4ry/Library/Mobile Documents/com~apple~CloudDocs/caregrid 2" && ./scripts/auto-save.sh'
```

Then reload your shell:
```bash
source ~/.zshrc
```

Now you can run `cg-save` from anywhere to auto-save your work!

## How It Works

### Branch Strategy

- **caregrid-ops changes** → Saved to `caregrid-ops` repository on `main` branch
- **Main project changes** → Saved to `Caregrid2` repository on `main` branch

### Auto-Detection

The script automatically detects:
- Which files have changed
- Whether you're working in caregrid-ops or main project
- Commits only files that have actual changes

### Repositories

1. **Main CareGrid Project**: `https://github.com/om8rrr-svg/Caregrid2.git`
2. **CareGrid Ops Dashboard**: `https://github.com/om8rrr-svg/caregrid-ops.git`

## Usage Examples

```bash
# Quick save with timestamp
cg-save

# Save with descriptive message
cg-save "Added new booking validation"

# Save from within caregrid-ops directory
cd caregrid-ops
../scripts/auto-save.sh "Updated monitoring dashboard"
```

## Manual Git Commands (if needed)

### For caregrid-ops:
```bash
cd caregrid-ops
git add .
git commit -m "Your message"
git push origin main
```

### For main project:
```bash
cd "caregrid 2"
git add .
git commit -m "Your message"
git push origin main
```

## Troubleshooting

- **Permission denied**: Run `chmod +x scripts/auto-save.sh`
- **Git authentication**: Ensure you're logged into GitHub CLI or have SSH keys set up
- **Merge conflicts**: The script will stop if there are conflicts - resolve manually

---

**Note**: The auto-save script will only commit and push if there are actual changes to avoid empty commits.