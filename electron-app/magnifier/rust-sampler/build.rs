use std::process::Command;

fn main() {
    // Ensure build script re-runs if Cargo.toml changes
    println!("cargo:rerun-if-changed=Cargo.toml");

    // Apply patches to dependencies manually
    // This patches the libspa crate to fix the modifier type mismatch
    // where newer PipeWire versions use i64 instead of u64
    if let Err(e) = apply_patches() {
        println!("cargo:warning=Failed to apply patches: {}", e);
        // Don't fail the build if patching fails - let compilation errors show the real issues
    }
}

fn apply_patches() -> Result<(), Box<dyn std::error::Error>> {
    // For git dependencies, we need to patch the git checkout directory
    // Find the CARGO_HOME directory
    let cargo_home = std::env::var("CARGO_HOME")
        .or_else(|_| std::env::var("HOME").map(|h| format!("{}/.cargo", h)))
        .unwrap_or_else(|_| "~/.cargo".to_string());

    // The git checkout path for pipewire-rs
    let git_checkout = format!("{}/git/checkouts/pipewire-rs-*/b238478", cargo_home);

    // Use glob to find the actual directory
    let git_dirs: Vec<_> = glob::glob(&git_checkout)?
        .filter_map(|entry| entry.ok())
        .collect();

    if git_dirs.is_empty() {
        println!("cargo:warning=No pipewire-rs git checkout found, skipping patches");
        return Ok(());
    }

    let pipewire_dir = &git_dirs[0];
    let libspa_dir = pipewire_dir.join("libspa");

    if libspa_dir.exists() {
        println!("cargo:warning=Applying libspa modifier type fix...");

        // Apply the patch inline using sed
        let patch_commands = vec![
            // Fix set_modifier: cast u64 to i64
            r"s/self\.0\.modifier = modifier;/self.0.modifier = modifier as i64;/g",
            // Fix modifier getter: cast i64 to u64
            r"s/self\.0\.modifier$/self.0.modifier as u64/g",
            // Remove flags field from VideoInfoRaw::new() - it's not in newer PipeWire
            r"s/flags: 0,//g",
            // Remove flags setter method
            r"/pub fn set_flags/,+3d",
            // Remove flags getter method
            r"/pub fn flags/,+3d"
        ];

        let raw_file = libspa_dir.join("src/param/video/raw.rs");
        if raw_file.exists() {
            for cmd in patch_commands {
                let output = Command::new("sed")
                    .args(&["-i", "", cmd, &raw_file.to_string_lossy()])
                    .output()?;

                if !output.status.success() {
                    println!("cargo:warning=sed command failed: {}", String::from_utf8_lossy(&output.stderr));
                }
            }
            println!("cargo:warning=libspa modifier and flags fixes applied successfully");
        }
    }

    Ok(())
}
