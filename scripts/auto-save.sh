#!/bin/bash

# Auto-save script for CareGrid project
# Usage: ./auto-save.sh [commit-message]

set -e

# Get the current directory
CURRENT_DIR=$(pwd)
PROJECT_ROOT="/Users/om4ry/Library/Mobile Documents/com~apple~CloudDocs/caregrid 2"

# Default commit message
COMMIT_MSG="${1:-Auto-save: $(date '+%Y-%m-%d %H:%M:%S')}"

echo "🔄 Auto-saving CareGrid project..."

# Function to save caregrid-ops changes
save_ops() {
    echo "📁 Saving caregrid-ops changes to GitHub (main branch)..."
    cd "$PROJECT_ROOT/caregrid-ops"
    
    if git diff --quiet && git diff --cached --quiet; then
        echo "✅ No changes in caregrid-ops to commit"
    else
        git add .
        git commit -m "$COMMIT_MSG"
        git push origin main
        echo "✅ caregrid-ops changes saved to GitHub"
    fi
}

# Function to save main project changes
save_main() {
    echo "📁 Saving main CareGrid changes to GitHub (main branch)..."
    cd "$PROJECT_ROOT"
    
    if git diff --quiet && git diff --cached --quiet; then
        echo "✅ No changes in main project to commit"
    else
        git add .
        git commit -m "$COMMIT_MSG"
        git push origin main
        echo "✅ Main project changes saved to GitHub"
    fi
}

# Check if we're in caregrid-ops directory or its subdirectories
if [[ "$CURRENT_DIR" == *"caregrid-ops"* ]]; then
    save_ops
else
    # Save both ops and main project
    save_ops
    save_main
fi

echo "🎉 Auto-save complete!"