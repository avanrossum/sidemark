#!/bin/bash
set -e

# ── Verify Environment ──

if [ -z "$APPLE_ID" ] || [ -z "$APPLE_APP_SPECIFIC_PASSWORD" ] || [ -z "$APPLE_TEAM_ID" ]; then
  echo "Error: Missing signing environment variables."
  echo "Required: APPLE_ID, APPLE_APP_SPECIFIC_PASSWORD, APPLE_TEAM_ID"
  echo "Add these to your ~/.zshrc or ~/.zprofile"
  exit 1
fi

if ! command -v gh &> /dev/null; then
  echo "Error: gh CLI is required. Install with: brew install gh"
  exit 1
fi

# ── Get Version ──

VERSION=$(node -p "require('./package.json').version")
echo "Releasing v${VERSION}..."

# ── Build ──

echo "Building renderer..."
npm run build:renderer

echo "Building Electron app (signing + notarization)..."
npx electron-builder --config electron-builder.config.js --publish never

# ── Git Tag ──

echo "Creating git tag..."
git add package.json package-lock.json
git commit -m "chore: release v${VERSION}" || true
git tag "v${VERSION}"
git push origin main --tags

# ── GitHub Release ──

echo "Creating GitHub release..."

# Extract changelog for this version (macOS-compatible, no head -n -1)
CHANGELOG_NOTES=$(sed -n "/^## \[${VERSION}\]/,/^## \[/{/^## \[${VERSION}\]/d;/^## \[/d;p;}" ../CHANGELOG.md)

if [ -z "$CHANGELOG_NOTES" ]; then
  CHANGELOG_NOTES="Release v${VERSION}"
fi

# Find built artifacts (quote paths for filenames with spaces)
DMG_FILE=$(find dist -maxdepth 1 -name "*${VERSION}*.dmg" -print -quit)
ZIP_FILE=$(find dist -maxdepth 1 -name "*${VERSION}*.zip" -print -quit)
YML_FILE="dist/latest-mac.yml"

RELEASE_ARGS=()
[ -n "$DMG_FILE" ] && RELEASE_ARGS+=("$DMG_FILE")
[ -n "$ZIP_FILE" ] && RELEASE_ARGS+=("$ZIP_FILE")
[ -f "$YML_FILE" ] && RELEASE_ARGS+=("$YML_FILE")

gh release create "v${VERSION}" \
  --title "v${VERSION}" \
  --notes "$CHANGELOG_NOTES" \
  "${RELEASE_ARGS[@]}"

echo "Release v${VERSION} complete!"
