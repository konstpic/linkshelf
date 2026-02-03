# LinkShelf Browser Extensions

Extensions to add the current page to LinkShelf with one click.

## Build

Run from project root:

```bash
npm run build:extensions
```

This generates icons and syncs version from package.json.

---

## Chrome / Edge / Brave

1. Run `npm run build:extensions`
2. Open `chrome://extensions`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select `browser-extensions/chrome/`

---

## Firefox

1. Run `npm run build:extensions`
2. Open `about:debugging#/runtime/this-firefox`
3. Click "Load Temporary Add-on"
4. Select `browser-extensions/firefox/manifest.json`

Or package as .xpi for installation: zip the contents of `firefox/` and rename to .xpi.

---

## Safari (macOS)

Safari 14+ supports Web Extensions. Use Apple's converter to create an Xcode project:

```bash
xcrun safari-web-extension-converter browser-extensions/chrome/
```

This creates a new folder (e.g. `LinkShelf Extension`) with an Xcode project. Then:

1. Open the .xcodeproj in Xcode
2. Select your Development Team in Signing & Capabilities
3. Product → Archive → Distribute App (or run on your Mac for testing)

Alternatively, create a new Safari App Extension target in Xcode and copy the Chrome extension files (manifest.json, popup.html, popup.js, icons/) into it.

See [Safari Web Extensions](https://developer.apple.com/documentation/safariservices/safari_web_extensions) for details.
