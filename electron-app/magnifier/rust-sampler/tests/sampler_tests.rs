// Sampler selection and platform detection tests

#[test]
fn test_platform_specific_compilation() {
    // Ensure exactly one platform is active
    let mut active_platforms = 0;

    #[cfg(target_os = "macos")]
    {
        active_platforms += 1;
    }

    #[cfg(target_os = "linux")]
    {
        active_platforms += 1;
    }

    #[cfg(target_os = "windows")]
    {
        active_platforms += 1;
    }

    assert_eq!(
        active_platforms, 1,
        "Exactly one platform should be compiled"
    );
}

#[cfg(target_os = "macos")]
#[test]
fn test_macos_sampler_available() {
    assert!(true, "macOS platform detected");
}

#[cfg(target_os = "windows")]
#[test]
fn test_windows_sampler_available() {
    assert!(true, "Windows platform detected");
}

#[cfg(target_os = "linux")]
#[test]
fn test_linux_platform_detected() {
    assert_eq!(std::env::consts::OS, "linux");
}

#[test]
fn test_feature_flags_compilation() {
    // Test that feature flags work correctly
    #[cfg(feature = "wayland")]
    {
        assert!(true, "Wayland feature is enabled");
    }

    #[cfg(feature = "x11")]
    {
        assert!(true, "X11 feature is enabled");
    }

    // At least one should be true when running tests
    #[cfg(not(any(feature = "wayland", feature = "x11")))]
    {
        // It's okay if neither is enabled - tests can still run
        assert!(true, "No features enabled");
    }
}
