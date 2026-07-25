# SplitCircle — Mobile Build (Capacitor)

## Prerequisites

- Node.js 18+
- Android Studio (for Android APK)
- Xcode 14+ (for iOS, macOS only)
- Java 17+ (for Android)

## Setup

```bash
# 1. Install dependencies
cd frontend
npm install

# 2. Install Capacitor CLI and core
npm install @capacitor/core @capacitor/cli
npm install @capacitor/android @capacitor/ios

# 3. Additional Capacitor plugins used by SplitCircle
npm install @capacitor/camera @capacitor/filesystem
npm install @capacitor/push-notifications @capacitor/local-notifications
npm install @capacitor/status-bar @capacitor/splash-screen
npm install @capacitor/keyboard

# 4. Initialize Capacitor (first time only)
npx cap init SplitCircle com.splitcircle.app --web-dir dist

# 5. Add platforms
npx cap add android
npx cap add ios

# 6. Build the web app
npm run build

# 7. Sync to native platforms
npx cap sync
```

## Android APK

```bash
# Open in Android Studio
npx cap open android

# Or build directly (requires Android SDK)
cd android && ./gradlew assembleDebug

# Release APK (requires signing keystore)
cd android && ./gradlew assembleRelease
```

## iOS (macOS only)

```bash
# Open in Xcode
npx cap open ios
# Then Archive → Distribute App from Xcode
```

## Live Reload during Development

```bash
# Start the Vite dev server first
npm run dev

# In capacitor.config.json, temporarily set:
# "server": { "url": "http://YOUR_LAN_IP:5173", "cleartext": true }

npx cap run android --livereload
npx cap run ios --livereload
```

## Camera / OCR Notes

The camera permission is already declared in `capacitor.config.json`.
The OCR upload page (`/ocr`) uses `<input type="file" accept="image/*" capture="environment" />`
which opens the native camera on mobile devices automatically.
No additional native code is needed for this flow.

## Notifications

Push notifications require:
1. Firebase project (Android) — add `google-services.json` to `android/app/`
2. Apple Developer account (iOS) — configure APNs certificate in Xcode
