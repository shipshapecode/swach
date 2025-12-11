# Dependency Patches

This directory contains patches applied to Rust dependencies during the build process.

## How It Works

We use [cargo-patch](https://github.com/itmettkeDE/cargo-patch) to automatically apply patch files to dependencies before compilation. The patches are applied via the `build.rs` script which runs before the crate is built.

## Current Patches

### libspa-modifier-i64.patch

**Purpose:** Fixes a type compatibility issue between pipewire-rs and newer PipeWire system libraries.

**Problem:**

- Newer PipeWire versions changed the `modifier` field in `spa_video_info_raw` from `u64` to `i64`
- The pipewire-rs crate's high-level wrappers have hardcoded `u64` types
- This causes compilation errors on systems with PipeWire 0.3.x and newer

**Solution:**
The patch adds type casts in `libspa/src/param/video/raw.rs`:

- `set_modifier()`: Casts `u64` to `i64` when setting the field
- `modifier()`: Casts `i64` to `u64` when reading the field

This allows the code to compile on both older and newer PipeWire versions.

**Upstream Status:**
This is a known issue in pipewire-rs. The proper fix would be to use conditional compilation based on the PipeWire version. Once upstream fixes this issue, we can remove this patch.

## Adding New Patches

1. Create a patch file in `patches/` directory
2. Add the patch configuration to `Cargo.toml`:
   ```toml
   [package.metadata.patch.crate-name]
   version = "x.y"
   patches = [
       "patches/your-patch.patch"
   ]
   ```
3. The patch will be automatically applied during the next build

## Patch File Format

Patches should be in unified diff format (created with `diff -u` or `git diff`). File paths in the patch must be relative to the dependency's root directory.

Example:

```diff
diff --git a/src/file.rs b/src/file.rs
index abc123..def456 100644
--- a/src/file.rs
+++ b/src/file.rs
@@ -10,7 +10,7 @@
 fn example() {
-    old_code();
+    new_code();
 }
```

## Troubleshooting

If patches fail to apply:

1. Check that the patch file path is correct in `Cargo.toml`
2. Verify the patch format matches the dependency's source code
3. Ensure the dependency version matches what the patch expects
4. Try running `cargo clean` to clear cached dependencies
5. Check the build output for specific patch application errors
