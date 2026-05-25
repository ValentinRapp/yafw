# 🎬 YAFW — Yet Another FFmpeg Wrapper

**YAFW** is a modern, lightweight video editing app styled in the beautiful **Catppuccin Mocha** dark theme. It is designed to let you cut, trim, adjust, and re-encode videos in seconds with a fast, professional timeline layout.

---

## 🚀 Key Features

- **Professional Timeline Editor**: Trim videos precisely using dynamic timecode scales, a scrubbable playhead, and draggable brackets.
- **Frame Stepping & Jumps**: Jump to trim boundaries (`⏮` / `⏭`) and step backward/forward by 100ms (`◀` / `▶`) for frame-accurate cuts.
- **Advanced Encoder Settings**: Customize video output formats (`.mp4`, `.webm`, `.mkv`, `.mov`, etc.), bitrates, target file sizes, locked aspect-ratio resolutions, and framerates.
- **Dual-Processing Architecture**:
  - **Browser Mode (WASM)**: Processes videos fully client-side inside the browser sandbox using `@ffmpeg/ffmpeg` (WASM), keeping your data 100% private.
  - **Desktop App Mode (Electrobun)**: Accesses your machine's native, hardware-accelerated FFmpeg for up to 50x faster exports.

---

## 🛠️ Getting Started

### Installing the application

#### MacOS

Open your Terminal application and run:
```bash
brew tap valentinrapp/yafw
brew install --cask valentinrapp/yafw/yafw
```

#### Windows and Linux

1) Go to the [releases tab](https://github.com/ValentinRapp/yafw/releases/latest)
2) Download the appropriate installer for your platform
  - **Windows** -> ``stable-win-x64-yafw-Setup.zip``
  - **Linux** -> ``stable-linux-x64-yafw-Setup.tar.gz``
3) Decompress the archive and run the installer

## 🔧 Developing

### Prerequisites

You need [Bun](https://bun.sh) installed on your system.

### Setup

```bash
# Clone the repository and navigate to the directory
git clone https://github.com/ValentinRapp/yafw.git
cd yafw

# Install dependencies
bun install
```

### Running Development Server

To launch the app with Hot Module Replacement (HMR) enabled:

```bash
# Starts Vite HMR server on port 5173 and launches the Electrobun app window
bun run dev:hmr
```
