import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerDMG } from '@electron-forge/maker-dmg';
import { MakerSnap } from '@electron-forge/maker-snap';
// import { MakerSquirrel } from '@electron-forge/maker-squirrel';
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
    extraResource: ['electron-app/resources'],
  },
  makers: [
    new MakerDeb(
      {
        options: {
          bin: 'Swach',
          name: 'swach',
          productName: 'Swach',
          productDescription:
            'A robust color management tool for the modern age.',
          maintainer: 'Ship Shape Consulting LLC',
          homepage: 'https://swach.io',
          icon: 'electron-app/resources/icon.png',
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
    new MakerSnap(
      {
        base: 'core22',
        confinement: 'strict',
        grade: 'stable',
        summary: 'A robust color management tool for the modern age.',
        description:
          'Swach is a modern color palette manager that helps designers and developers organize, manage, and share color palettes effectively.',
        icon: 'electron-app/resources/icon.png',
        // Simplified configuration - let Electron Forge handle the app structure
        executableName: 'swach',
      },
      ['linux']
    ),
    // new MakerSquirrel({
    //   name: 'Swach',
    //   certificateFile: process.env['WINDOWS_PFX_FILE'],
    //   certificatePassword: process.env['WINDOWS_PFX_PASSWORD'],
    // }),
    new MakerZIP({}, ['darwin']),
  ],
  plugins: [
    new VitePlugin({
      // `build` can specify multiple entry builds, which can be Main process, Preload scripts, Worker process, etc.
      // If you are familiar with Vite configuration, it will look really familiar.
      build: [
        {
          // `entry` is just an alias for `build.lib.entry` in the corresponding file of `config`.
          entry: 'electron-app/src/main.ts',
          config: 'vite.main.config.ts',
          target: 'main',
        },
        {
          entry: 'electron-app/src/preload.ts',
          config: 'vite.preload.config.ts',
          target: 'preload',
        },
      ],
      renderer: [
        {
          name: 'main_window',
          config: 'vite.renderer.config.ts',
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
  // publishers: [
  //   {
  //     name: '@electron-forge/publisher-snapcraft',
  //     platforms: ['linux'],
  //     config: {
  //       release: '[latest/stable]',
  //     },
  //   },
  // ],
};

export default config;
