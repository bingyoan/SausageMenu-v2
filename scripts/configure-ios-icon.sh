#!/bin/bash
set -euo pipefail

SOURCE_ICON="public/images/logo.png"
APPICON_DIR="ios/App/App/Assets.xcassets/AppIcon.appiconset"
OUTPUT_ICON="$APPICON_DIR/AppIcon-1024.png"

if [ ! -f "$SOURCE_ICON" ]; then
  echo "Missing source app icon: $SOURCE_ICON" >&2
  exit 1
fi

mkdir -p "$APPICON_DIR"

# Resize with breathing room, flatten transparency onto the app background,
# then return to PNG. The JPEG intermediate guarantees an alpha-free icon.
sips --resampleHeightWidth 900 900 "$SOURCE_ICON" --out /tmp/sausagemenu-icon-resized.png >/dev/null
sips --padToHeightWidth 1024 1024 --padColor FDFBF7 /tmp/sausagemenu-icon-resized.png --out /tmp/sausagemenu-icon-padded.png >/dev/null
sips -s format jpeg -s formatOptions 100 /tmp/sausagemenu-icon-padded.png --out /tmp/sausagemenu-icon-flat.jpg >/dev/null
sips -s format png /tmp/sausagemenu-icon-flat.jpg --out "$OUTPUT_ICON" >/dev/null

cat > "$APPICON_DIR/Contents.json" <<'JSON'
{
  "images" : [
    {
      "filename" : "AppIcon-1024.png",
      "idiom" : "universal",
      "platform" : "ios",
      "size" : "1024x1024"
    }
  ],
  "info" : {
    "author" : "xcode",
    "version" : 1
  }
}
JSON

echo "Configured the SausageMenu iOS app icon"
