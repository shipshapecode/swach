module.exports = {
  packagerConfig: {
    asar: true,
    darwinDarkModeSupport: 'true',
    icon: 'electron-app/resources/icon',
    name: 'Swach',
    packageManager: 'yarn',
    ignore: [
      '/.gitignore',
      '/electron-forge-config.js',
      '/yarn.lock',
      '/ember-test(/|$)',
      '/tests(/|$)',
      '\\.map$'
    ],
    osxSign: {
      entitlements: 'electron-app/src/entitlements.plist',
      'entitlements-inherit': 'electron-app/src/entitlements.plist',
      'gatekeeper-assess': false,
      hardenedRuntime: true,
      identity:
        'Developer ID Application: Ship Shape Consulting LLC (779MXKT6B5)'
    },
    osxNotarize: {
      appleId: process.env['APPLE_ID'],
      appleIdPassword: process.env['APPLE_ID_PASSWORD']
    }
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
          icon: 'electron-app/resources/icon.png'
        }
      }
    },
    {
      name: '@electron-forge/maker-dmg',
      platforms: ['darwin'],
      config(arch) {
        return {
          name: arch === 'arm64' ? 'Swach-arm64' : 'Swach',
          background: 'electron-app/resources/installBackground.png',
          icon: 'electron-app/resources/dmg.icns'
        };
      }
    },
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'Swach',
        certificateFile: process.env['WINDOWS_PFX_FILE'],
        certificatePassword: process.env['WINDOWS_PFX_PASSWORD']
      }
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin']
    },
    {
      name: '@davidwinter/electron-forge-maker-snap',
      platforms: ['linux'],
      config: {
        categories: ['Development'],
        layout: {
          '/usr/lib/x86_64-linux-gnu/imlib2': {
            bind: '$SNAP/usr/lib/x86_64-linux-gnu/imlib2'
          }
        },
        stagePackages: [
          'default',
          'giblib1',
          'libimlib2',
          'libx11-6',
          'libxcursor1',
          'libxfixes3',
          'scrot'
        ]
      }
    }
  ]
};
