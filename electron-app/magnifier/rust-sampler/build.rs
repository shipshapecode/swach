use std::process::Command;

fn main() {
    // Ensure build script re-runs if Cargo.toml changes
    println!("cargo:rerun-if-changed=Cargo.toml");

    // Apply patches to dependencies manually
    // This patches the libspa crate to fix the modifier type mismatch
    // where newer PipeWire versions use i64 instead of u64
    apply_patches().expect("Failed to apply patches to dependencies");
}

fn apply_patches() -> Result<(), Box<dyn std::error::Error>> {
    // Find the target directory where dependencies are downloaded
    let target_dir = std::env::var("CARGO_TARGET_DIR")
        .unwrap_or_else(|_| "target".to_string());

    let patch_dir = format!("{}/patch", target_dir);

    // Check if patch directory exists
    if !std::path::Path::new(&patch_dir).exists() {
        println!("cargo:warning=No patch directory found, skipping patches");
        return Ok(());
    }

    // Apply our libspa modifier type fix
    let libspa_dir = format!("{}/libspa-0.9.2", patch_dir);
    if std::path::Path::new(&libspa_dir).exists() {
        println!("cargo:warning=Applying libspa modifier type fix...");

        // Apply the patch inline using sed
        let patch_commands = vec![
            // Fix set_modifier: cast u64 to i64
            r"s/self\.0\.modifier = modifier;/self.0.modifier = modifier as i64;/g",
            // Fix modifier getter: cast i64 to u64
            r"s/self\.0\.modifier$/self.0.modifier as u64/g"
        ];

        let raw_file = format!("{}/src/param/video/raw.rs", libspa_dir);
        for cmd in patch_commands {
            let output = Command::new("sed")
                .args(&["-i", "", cmd, &raw_file])
                .output()?;

            if !output.status.success() {
                println!("cargo:warning=sed command failed: {}", String::from_utf8_lossy(&output.stderr));
            }
        }

        println!("cargo:warning=libspa modifier type fix applied successfully");
    }

    Ok(())
}
