import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerDMG } from '@electron-forge/maker-dmg';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { VitePlugin } from '@electron-forge/plugin-vite';
import type { ForgeConfig } from '@electron-forge/shared-types';
import { FuseV1Options, FuseVersion } from '@electron/fuses';

// Simple check: only sign if we have Apple ID credentials and not explicitly skipping
const shouldSign = !!(
  process.env.APPLE_ID &&
  process.env.APPLE_ID_PASSWORD &&
  process.env.SKIP_CODESIGN !== 'true'
);
const shouldNotarize = shouldSign;

const shortDescription = 'A robust color management tool for the modern age.';
const longDescription = `Swach is a powerful color management tool designed for modern workflows. 
  Features include color palette management, contrast checking, and an eyedropper 
  tool for precise color picking from any part of your screen.`;

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    darwinDarkModeSupport: true,
    icon: 'electron-app/resources/icon',
    name: 'Swach',
    // Only include codesigning configuration if certificates are available
    ...(shouldSign && {
      osxSign: {
        optionsForFile: () => {
          return {
            entitlements: 'electron-app/src/entitlements.plist',
            hardenedRuntime: true,
            identity:
              'Developer ID Application: Ship Shape Consulting LLC (779MXKT6B5)',
          };
        },
      },
    }),
    // Only include notarization if both certificates and credentials are available
    ...(shouldNotarize && {
      osxNotarize: {
        appleId: process.env.APPLE_ID,
        appleIdPassword: process.env.APPLE_ID_PASSWORD,
        teamId: '779MXKT6B5',
      },
    }),
    protocols: [
      {
        name: 'swach',
        schemes: ['swach'],
      },
    ],
    // Include all resources in the packaged app
    extraResource: [
      'electron-app/resources',
      // Conditionally include platform-specific Rust sampler binary
      ...(process.platform === 'win32'
        ? ['rust-sampler/target/release/swach-sampler.exe']
        : ['rust-sampler/target/release/swach-sampler']),
    ],
  },
  makers: [
    new MakerDeb(
      {
        options: {
          bin: 'Swach',
          name: 'Swach',
          productName: 'Swach',
          description: shortDescription,
          productDescription: longDescription,
          maintainer: 'Ship Shape Consulting LLC',
          homepage: 'https://swach.io',
          icon: 'electron-app/resources/icon.png',
          desktopTemplate: 'electron-app/resources/swach.desktop',
        },
      },
      ['linux']
    ),
    new MakerDMG(() => {
      return {
        name: 'Swach',
        background: 'electron-app/resources/installBackground.png',
        icon: 'electron-app/resources/dmg.icns',
      };
    }, ['darwin']),
    // Build unsigned executable - will be signed later with eSigner
    new MakerSquirrel(
      {
        name: 'Swach',
        setupExe: 'Swach-${version}.Setup.exe',
      },
      ['win32']
    ),
    new MakerZIP({}, ['darwin']),
  ],
  plugins: [
    new VitePlugin({
      // `build` can specify multiple entry builds, which can be Main process, Preload scripts, Worker process, etc.
      // If you are familiar with Vite configuration, it will look really familiar.
      build: [
        {
          // `entry` is just an alias for `build.lib.entry` in the corresponding file of `config`.
          entry: 'electron-app/main.ts',
          config: 'vite.main.config.ts',
          target: 'main',
        },
        {
          entry: 'electron-app/src/preload.ts',
          config: 'vite.preload.config.ts',
        },
        {
          entry: 'electron-app/magnifier/magnifier-preload.ts',
          config: 'vite.preload.config.ts',
        },
      ],
      renderer: [
        {
          name: 'main_window',
          config: 'vite.renderer.config.ts',
        },
        {
          name: 'magnifier_window',
          config: 'vite.magnifier.config.ts',
        },
      ],
    }),
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};

export default config;
