# SplitCircle — Desktop Build

Two options for desktop: **Electron** (cross-platform, JS-only) and **Tauri** (smaller bundle, requires Rust).

---

## Option A: Electron

### Prerequisites
- Node.js 18+
- For macOS builds: macOS + Xcode Command Line Tools
- For Windows builds: Windows or a Windows cross-compile environment

### Setup

```bash
cd electron
npm install
```

### Development (hot-reload)

```bash
# Terminal 1 — start Vite dev server
cd ../frontend && npm run dev

# Terminal 2 — start Electron
cd ../electron && npm start
```

Or use the combined script:
```bash
cd electron && npm run dev
```

### Production Builds

```bash
# First, build the frontend
cd ../frontend && npm run build

# Then build the desktop app
cd ../electron

# Windows (.exe installer + portable)
npm run build:win

# macOS (.dmg for Intel + Apple Silicon)
npm run build:mac

# Linux (AppImage + .deb + .rpm)
npm run build:linux

# All platforms (CI/CD)
npm run build:all
```

Output is in `electron/dist-electron/`.

---

## Option B: Tauri (Rust-based, smaller bundle)

### Prerequisites
- Node.js 18+
- Rust (https://rustup.rs)
- Platform-specific: `webkit2gtk` on Linux, Xcode on macOS, MSVC on Windows

### Setup

```bash
# Install Tauri CLI
cargo install tauri-cli

# Or via npm
npm install -g @tauri-apps/cli
```

### Development

```bash
cd tauri
cargo tauri dev
# or: npx tauri dev
```

### Production Build

```bash
cd tauri
cargo tauri build
# Output in tauri/target/release/bundle/
```

---

## Keyboard Shortcuts (Electron)

| Shortcut | Action |
|----------|--------|
| ⌘/Ctrl + 1 | Dashboard |
| ⌘/Ctrl + N | Add Expense |
| ⌘/Ctrl + Shift + O | Scan Receipt |
| ⌘/Ctrl + I | AI Insights |
