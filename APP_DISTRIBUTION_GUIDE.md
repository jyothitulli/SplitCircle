# Getting SplitCircle onto a phone or PC

There are three separate ways to distribute SplitCircle as an installable
app, in order of how much extra setup they need:

## 1. Install from the website (PWA) — no extra build step, works today

This is already fully wired up. Once you deploy the frontend anywhere with
HTTPS (or run it locally), visiting the site shows a **"Get the app"**
button — it's in the top navbar on desktop, in the mobile drawer menu (☰),
and on the login/register screens. Tapping it either:

- triggers the browser's native install prompt directly, or
- if the browser hasn't offered that yet, opens a modal with exact
  step-by-step instructions for iOS / Android / desktop.

Once installed this way, the app opens full-screen with no browser bar,
gets a home-screen/desktop icon, and works offline for anything already
loaded. **This is the option that lets you "send a link" and have someone
install it with one tap — no APK file to send at all.**

Nothing further to run for this one — it works as soon as the site is deployed.

## 2. A real, shareable `.apk` file (Android) — via Capacitor

The project already has `capacitor.config.json` configured. I added the
missing pieces (`@capacitor/core`, `@capacitor/cli`, `@capacitor/android`,
and npm scripts) so you can generate an actual native Android project and
build a `.apk` from it. This step needs **Android Studio and the Android
SDK installed on your own machine** — it can't be done inside this chat,
the same way I can't compile an iOS app without a Mac.

```bash
cd frontend
npm install                    # pulls in the Capacitor packages
npm run cap:add:android        # builds the web app, creates android/, syncs it
npm run cap:open:android       # opens the native project in Android Studio
```

From Android Studio: **Build → Build Bundle(s) / APK(s) → Build APK(s)**.
The `.apk` lands in `frontend/android/app/build/outputs/apk/`. That file is
what you send to someone — they enable "install unknown apps" once, open
the file, and it installs like any other Android app.

For a Play Store-ready signed release build, you'll additionally need a
keystore (`android/app/release.keystore`, referenced in
`capacitor.config.json`) and to run a signed release build instead of debug.

## 3. A real desktop installer (Windows/Mac/Linux) — via Electron

The project already has a complete, working Electron setup in `/electron`
(nothing missing here — just needs building on your machine):

```bash
cd frontend && npm run build     # build the web app first
cd ../electron
npm install
npm run build:win     # -> .exe installer + portable .exe, in dist-electron/
npm run build:mac     # -> .dmg (must be run on a Mac)
npm run build:linux   # -> AppImage / .deb / .rpm
```

The resulting file in `dist-electron/` is a normal installer — double-click
it and it installs SplitCircle as a native desktop app with a Start Menu /
Dock shortcut.

---

**Recommendation:** start with option 1 (PWA) since it needs zero extra
build tooling and is already live in this zip — it covers "click a link,
tap install, done" for both phone and PC. Reach for options 2/3 only if you
specifically need a standalone file to distribute outside the browser (e.g.
sideloading on Android, or a Play Store / desktop-store listing later).
