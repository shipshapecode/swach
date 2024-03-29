module.exports = {
  packagerConfig: {
    asar: true,
    darwinDarkModeSupport: 'true',
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
    {
      name: '@electron-forge/maker-deb',
      platforms: ['linux'],
      config: {
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
    },
    {
      name: '@electron-forge/maker-dmg',
      platforms: ['darwin'],
      config(arch) {
        return {
          name: arch === 'arm64' ? 'Swach-arm64' : 'Swach',
          background: 'electron-app/resources/installBackground.png',
          icon: 'electron-app/resources/dmg.icns',
        };
      },
    },
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
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'Swach',
        certificateFile: process.env['WINDOWS_PFX_FILE'],
        certificatePassword: process.env['WINDOWS_PFX_PASSWORD'],
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
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
