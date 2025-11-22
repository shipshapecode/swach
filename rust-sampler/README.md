# Swach Pixel Sampler

A high-performance, cross-platform pixel sampling tool written in Rust for the Swach color picker.

## Overview

This Rust binary provides continuous, real-time pixel sampling for the Swach color picker's magnifier feature. It communicates with the Electron main process via JSON over stdin/stdout.

## Platform Support

### macOS

- Uses Core Graphics `CGDisplayCreateImage` for efficient screen capture
- Direct pixel access without full screenshots
- Hardware-accelerated sampling

### Linux (Wayland)

- **Requires `grim` for Wayland screenshot support**
- Falls back to X11 methods (`import` from ImageMagick or `scrot`) when available
- Automatically detects Wayland vs X11 session

### Linux (X11)

- Uses ImageMagick's `import` command
- Falls back to `scrot` if ImageMagick is not available
- Requires `xdotool` for cursor position tracking

### Windows

- Uses Windows GDI `GetPixel` API
- Direct pixel sampling without screenshots
- Native cursor position tracking

## Linux/Wayland Setup

For Wayland users, you need to install `grim`:

```bash
# Arch Linux
sudo pacman -S grim

# Ubuntu/Debian
sudo apt install grim

# Fedora
sudo dnf install grim

# openSUSE
sudo zypper install grim
```

For X11 users (fallback), install one of:

```bash
# ImageMagick (recommended)
sudo apt install imagemagick  # Ubuntu/Debian
sudo dnf install ImageMagick  # Fedora
sudo pacman -S imagemagick    # Arch Linux

# OR scrot (lighter alternative)
sudo apt install scrot        # Ubuntu/Debian
sudo dnf install scrot        # Fedora
sudo pacman -S scrot          # Arch Linux

# For cursor tracking on X11
sudo apt install xdotool      # Ubuntu/Debian
sudo dnf install xdotool      # Fedora
sudo pacman -S xdotool        # Arch Linux
```

## Building

### Development Build

```bash
cargo build
```

The debug binary will be at `target/debug/swach-sampler`

### Release Build

```bash
cargo build --release
```

The optimized binary will be at `target/release/swach-sampler`

## Communication Protocol

### Input (Commands from Electron)

Commands are sent as JSON over stdin, one per line:

```json
{"command": "start", "grid_size": 9, "sample_rate": 60}
{"command": "update_grid", "grid_size": 11}
{"command": "stop"}
```

#### Start Command

- `grid_size`: Number of pixels in each dimension (e.g., 9 = 9x9 grid)
- `sample_rate`: Target sampling frequency in Hz (e.g., 60 = 60 FPS)

#### Update Grid Command

- `grid_size`: New grid size to use

#### Stop Command

- No parameters, cleanly exits the sampler

### Output (Pixel Data to Electron)

Pixel data is sent as JSON over stdout, one object per sample:

```json
{
  "cursor": {"x": 100, "y": 200},
  "center": {"r": 255, "g": 128, "b": 64, "hex": "#FF8040"},
  "grid": [
    [
      {"r": 255, "g": 128, "b": 64, "hex": "#FF8040"},
      {"r": 254, "g": 127, "b": 63, "hex": "#FE7F3F"},
      ...
    ],
    ...
  ],
  "timestamp": 1700000000000
}
```

### Error Output

Errors are sent as JSON to stdout:

```json
{
  "error": "Failed to capture screen: permission denied"
}
```

Debug/diagnostic messages are sent to stderr.

## Performance Notes

### Sampling Rate

- macOS: Can achieve 60+ FPS easily with direct pixel access
- Windows: Similar to macOS, native GDI is very fast
- Linux (X11): Limited by screenshot tool speed (~30-60 FPS)
- Linux (Wayland): Limited by screenshot tool speed (~30-60 FPS)

### Wayland Screenshot Caching

The Linux/Wayland implementation caches screenshots for 100ms to balance performance and accuracy. This means:

- Updates happen approximately 10 times per second
- Reduces CPU usage significantly
- Provides smooth-enough experience for color picking

### Grid Sampling

Larger grid sizes (e.g., 15x15 vs 9x9) have minimal performance impact since they sample from the same cached image data.

## Permissions

### macOS

- Requires "Screen Recording" permission in System Preferences → Security & Privacy → Screen Recording
- Electron app must be granted this permission

### Linux (Wayland)

- No special permissions required
- Screenshot tool (`grim`) handles Wayland compositor communication

### Linux (X11)

- No special permissions required
- Direct X11 access for screenshots and cursor position

### Windows

- No special permissions required
- Uses standard GDI APIs

## Integration with Electron

The `RustSamplerManager` class in `electron-app/src/rust-sampler-manager.ts` handles spawning and communicating with this binary.

### Development Mode

Binary location: `rust-sampler/target/debug/swach-sampler`

### Production Mode

Binary location: `<app.resourcesPath>/swach-sampler` (or `.exe` on Windows)

The binary is automatically bundled with the Electron app during packaging.
