fn main() {
    // Ensure build script re-runs if Cargo.toml or patches change
    println!("cargo:rerun-if-changed=Cargo.toml");
    println!("cargo:rerun-if-changed=patches/");
    
    // Apply patches to dependencies
    // This patches the libspa crate to fix the modifier type mismatch
    // where newer PipeWire versions use i64 instead of u64
    cargo_patch::patch().expect("Failed to apply patches to dependencies");
}
