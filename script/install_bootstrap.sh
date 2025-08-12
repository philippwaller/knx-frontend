#!/usr/bin/env bash
# install_bootstrap_script.sh
#
# Download the experimental bootstrap script and wire up `make boot`.
# Usage: curl -fsSL https://raw.githubusercontent.com/philippwaller/knx-frontend/refs/heads/lab/bootscript/script/install_bootstrap.sh | bash

set -Eeuo pipefail

DOWNLOADS_DIR="downloads"
MAKEFILE="Makefile"
BOOTSTRAP_URL="https://raw.githubusercontent.com/philippwaller/knx-frontend/refs/heads/lab/bootscript/script/bootstrap"

echo "📦 Downloading bootstrap script..."

# Create downloads directory if it doesn't exist
mkdir -p "$DOWNLOADS_DIR"

# Download bootstrap script from git
if ! curl -fsSL "$BOOTSTRAP_URL" -o "$DOWNLOADS_DIR/bootstrap"; then
  echo "❌ Download failed!"
  exit 1
fi

# Make script executable immediately after download
chmod +x "$DOWNLOADS_DIR/bootstrap"

echo "✅ Bootstrap script downloaded to $DOWNLOADS_DIR/bootstrap"

# Add new boot command to Makefile
# Add new boot command to Makefile if missing
if ! grep -q "^boot:" "$MAKEFILE"; then
  echo "🔧 Adding boot command to Makefile..."
  # Append boot command block to Makefile
  cat >> "$MAKEFILE" <<'EOF'

boot: ## experimental Bootstrap script - DO NOT COMMIT
	downloads/bootstrap;
EOF
  echo "✅ Added 'make boot' command to Makefile"
else
  echo "ℹ️  boot command already exists in Makefile"
fi

echo ""
echo "🚀 Ready! You can now run:"
echo "   make boot"
echo ""
echo "🚫 Do not commit the modified Makefile, as it is only for local use."
