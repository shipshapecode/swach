# Testing the Rust Sampler

## Quick Test

1. **Build the sampler**:

   ```bash
   pnpm build:rust:dev
   ```

2. **Run Electron**:

   ```bash
   pnpm start:electron
   ```

3. **Launch color picker**:
   - Click the eyedropper icon in the menubar
   - The magnifier window should appear

4. **Move your cursor around**:
   - The magnifier should update at ~15-20 FPS
   - You should see live color updates
   - There will be a slight lag (50-70ms) - this is normal

## What to Expect

### Normal Behavior

✅ **Magnifier appears** within 1 second  
✅ **Colors update continuously** as you move  
✅ **Update rate**: 15-20 times per second  
✅ **Slight lag**: 50-70ms delay is normal  
✅ **Color accuracy**: Should match what's on screen

### Performance Characteristics

- **Initial startup**: ~100-200ms
- **Frame time**: ~50-70ms per update
- **Update rate**: ~15-20 FPS
- **Cursor tracking**: Smooth but not instant

### Common Issues

#### "Laggy" cursor (5 second delay)

**Symptom**: Magnifier takes 5+ seconds to follow cursor

**Cause**: Old implementation still running, or debug build

**Solution**:

```bash
# Kill old processes
pkill -f swach-sampler

# Rebuild
pnpm build:rust:dev

# Restart Electron
pnpm start:electron
```

#### Colors are wrong

**Symptom**: Colors don't match what's on screen

**Cause**: Retina display scaling or color space conversion

**Solution**: Check the Rust sampler stderr output for errors:

```bash
# Run Electron and watch for errors
pnpm start:electron 2>&1 | grep -i error
```

#### Magnifier doesn't appear

**Symptom**: Clicking eyedropper does nothing

**Cause**: Rust binary not found or Screen Recording permission denied

**Solution**:

1. Check binary exists:

   ```bash
   ls -la rust-sampler/target/debug/swach-sampler
   ```

2. Check macOS permissions:
   - System Preferences → Security & Privacy → Screen Recording
   - Enable for Electron or Swach

#### High CPU usage

**Symptom**: Fan spins up, CPU usage very high

**Cause**: Sample rate too high or infinite loop

**Solution**: Check the sample rate in `magnifier-main-rust.ts`:

```typescript
this.samplerManager.start(
  this.gridSize,
  20, // Should be 20, not 60!
```

## Performance Benchmarking

To see actual performance stats, check the terminal output when running Electron:

```bash
pnpm start:electron
```

Look for lines like:

```
Sampling at 16.2 FPS (target: 20 FPS)
Warning: frame took 61ms (target: 50ms)
```

These show:

- Actual FPS being achieved
- Per-frame timing
- Whether targets are being met

## Comparing to Old Implementation

### Old (Screenshot-based)

```typescript
// magnifier-main.ts
await this.captureInitialScreenshot(); // 200-500ms
// ... cursor moves ...
// NO UPDATES - frozen screenshot!
```

**Experience**: Initial delay, then frozen image

### New (Rust-based)

```typescript
// magnifier-main-rust.ts
this.samplerManager.start(...); // 50-70ms per frame
// ... cursor moves ...
// Continuous updates at 15-20 FPS!
```

**Experience**: Slight initial delay, then live continuous updates

## Platform-Specific Notes

### macOS

- **Permissions required**: Screen Recording
- **Performance**: 15-20 FPS (good)
- **Bottleneck**: CGDisplay API

To grant permissions:

1. System Preferences → Security & Privacy
2. Privacy tab → Screen Recording
3. Enable Electron.app
4. Restart Electron

### Linux (Wayland)

- **Tool required**: `grim`
- **Performance**: 10-15 FPS (acceptable)
- **Bottleneck**: Process spawning

Install grim:

```bash
sudo apt install grim  # Ubuntu/Debian
```

### Linux (X11)

- **Tool required**: ImageMagick or scrot
- **Performance**: 10-20 FPS (acceptable)
- **Bottleneck**: Process spawning

Install tools:

```bash
sudo apt install imagemagick xdotool
# OR
sudo apt install scrot xdotool
```

### Windows

- **Permissions**: None required
- **Performance**: 20-30 FPS (expected, not yet tested)
- **Bottleneck**: GDI API

## Debugging

### Enable verbose logging

The Rust sampler logs to stderr. To see all logs:

```bash
pnpm start:electron 2>&1 | tee /tmp/swach.log
```

Look for:

- "Swach pixel sampler starting..."
- "Sampler created successfully"
- "Starting sampling: grid_size=X, sample_rate=Y"
- "Sampling at X FPS"

### Check if sampler is running

```bash
ps aux | grep swach-sampler
```

Should show one process when color picker is active.

### Kill stuck processes

```bash
pkill -9 -f swach-sampler
```

### Test sampler directly

```bash
echo '{"command":"start","grid_size":9,"sample_rate":20"}' | rust-sampler/target/debug/swach-sampler
```

Should output JSON with color data.

## Expected Behavior Summary

| Phase           | Duration      | What Happens                     |
| --------------- | ------------- | -------------------------------- |
| **Launch**      | 100-200ms     | Spawn Rust process, init sampler |
| **First frame** | 50-100ms      | Capture first screen region      |
| **Continuous**  | 50-70ms/frame | Update at ~15-20 FPS             |
| **Shutdown**    | <100ms        | Clean process exit               |

## Success Criteria

✅ Magnifier appears quickly (<1 second)  
✅ Colors update continuously (not frozen)  
✅ Update rate feels smooth (~15-20 FPS)  
✅ Colors are accurate  
✅ Can zoom in/out smoothly  
✅ Can select color and it's added to palette  
✅ CPU usage is reasonable (<30%)

If all criteria are met, the Rust sampler is working correctly!
