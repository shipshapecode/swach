# Dependency Patches

This crate applies patches to Rust dependencies during the build process to fix compatibility issues.

## How It Works

The `build.rs` script manually applies patches to downloaded dependencies in the `target/patch/` directory. This approach avoids pulling in problematic dependencies like `cargo-patch` which had compatibility issues.

## Current Patches

### libspa modifier type fix

**Purpose:** Fixes a type compatibility issue between pipewire-rs and newer PipeWire system libraries.

**Problem:**

- Newer PipeWire versions changed the `modifier` field in `spa_video_info_raw` from `u64` to `i64`
- The pipewire-rs crate's high-level wrappers have hardcoded `u64` types
- This causes compilation errors on systems with PipeWire 0.3.x and newer

**Solution:**
The build script applies a patch that adds type casts in `libspa/src/param/video/raw.rs`:

- `set_modifier()`: Casts `u64` to `i64` when setting the field
- `modifier()`: Casts `i64` to `u64` when reading the field

**Patch Content:**

```diff
diff --git a/libspa/src/param/video/raw.rs b/libspa/src/param/video/raw.rs
index 1234567..abcdefg 100644
--- a/libspa/src/param/video/raw.rs
+++ b/libspa/src/param/video/raw.rs
@@ -266,11 +266,11 @@ impl VideoInfoRaw {
     }

     pub fn set_modifier(&mut self, modifier: u64) {
-        self.0.modifier = modifier;
+        self.0.modifier = modifier as i64;
     }

     pub fn modifier(self) -> u64 {
-        self.0.modifier
+        self.0.modifier as u64
     }

     pub fn set_size(&mut self, size: Rectangle) {
```

**Upstream Status:**
This is a known issue in pipewire-rs. The proper fix would be to use conditional compilation based on the PipeWire version. Once upstream fixes this issue, we can remove this patch.

## Implementation Details

The patch is applied by:

1. The build script finds the git checkout directory for pipewire-rs in `~/.cargo/git/checkouts/`
2. It applies sed commands to modify the libspa source files directly
3. The modified git checkout is then used for compilation

## Why Manual Patching

Originally, we used `cargo-patch` but it pulled in an old version of the `cargo` crate which had a broken `gix-url` dependency. Manual patching avoids this dependency chain while still providing the necessary compatibility fixes.

For git dependencies, Cargo doesn't create a separate `target/patch/` directory - it compiles directly from the git checkout. Therefore, we patch the git checkout directory itself.

## Adding New Patches

To add new patches:

1. Modify the `apply_patches()` function in `build.rs`
2. Add the patch logic for the new dependency
3. Test that the patch applies correctly

## Troubleshooting

If patches fail to apply:

1. Check that the target directory exists (`target/patch/crate-version/`)
2. Verify the patch format is correct
3. Ensure the `patch` command is available on the system
4. Check build output for specific patch application errors
