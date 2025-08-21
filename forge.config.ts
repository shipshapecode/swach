import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerDMG } from '@electron-forge/maker-dmg';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { VitePlugin } from '@electron-forge/plugin-vite';
import type { ForgeConfig } from '@electron-forge/shared-types';
import { FuseV1Options, FuseVersion } from '@electron/fuses';

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    darwinDarkModeSupport: true,
    icon: 'electron-app/resources/icon',
    name: 'Swach',
    packageManager: 'pnpm',
    ignore: [
      '/.gitignore',
      '/electron-forge-config.js',
      '/ember-test(/|$)',
      '/tests(/|$)',
      '\\.map$',
    ],
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
    osxNotarize: {
      tool: 'notarytool',
      appleId: process.env['APPLE_ID'],
      appleIdPassword: process.env['APPLE_ID_PASSWORD'],
      teamId: '779MXKT6B5',
    },
    protocols: [
      {
        protocol: 'swach',
        name: 'swach',
        schemes: 'swach',
      },
    ],
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
    new MakerDMG(
      (arch) => {
        return {
          name: arch === 'arm64' ? 'Swach-arm64' : 'Swach',
          background: 'electron-app/resources/installBackground.png',
          icon: 'electron-app/resources/dmg.icns',
        };
      },
      ['darwin']
    ),
    // {
    //   name: '@electron-forge/maker-snap',
    //   platforms: ['linux'],
    //   config: {
    //     base: 'core22',
    //     icon: 'electron-app/resources/icon.png',
    //     confinement: 'strict',
    //     description: 'A robust color management tool for the modern age.',
    //     summary: 'A robust color management tool for the modern age.',
    //     grade: 'stable',
    //     layout: {
    //       '/usr/lib/x86_64-linux-gnu/imlib2': {
    //         bind: '$SNAP/usr/lib/x86_64-linux-gnu/imlib2',
    //       },
    //     },
    //     appConfig: {
    //       extensions: ['gnome'],
    //     },
    //     parts: {
    //       setup: {
    //         plugin: 'nil',
    //         'stage-packages': [
    //           'default',
    //           'giblib1',
    //           'libimlib2',
    //           'libx11-6',
    //           'libxcursor1',
    //           'libxfixes3',
    //           'scrot',
    //         ],
    //       },
    //     },
    //     type: 'app',
    //   },
    // },
    new MakerSquirrel({
      name: 'Swach',
      certificateFile: process.env['WINDOWS_PFX_FILE'],
      certificatePassword: process.env['WINDOWS_PFX_PASSWORD'],
    }),
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
