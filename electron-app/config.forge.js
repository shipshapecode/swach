module.exports = {
  packagerConfig: {
    asar: true,
    darwinDarkModeSupport: 'true',
    icon: 'electron-app/resources/icon',
    name: 'Swach',
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
    },
    packageManager: 'yarn'
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
      config: {
        background: 'electron-app/resources/installBackground.png',
        icon: 'electron-app/resources/dmg.icns'
      }
    },
    {
      name: '@electron-forge/maker-snap',
      platforms: ['linux'],
      config: {
        appConfig: { name: 'swach', title: 'Swach' },
        appPlugs: [
          'desktop',
          'desktop-legacy',
          'home',
          'x11',
          'unity7',
          'browser-support',
          'network',
          'gsettings'
        ],
        plugs: {
          'browser-support': {
            interface: 'browser-support',
            'allow-sandbox': false
          }
        },
        confinement: 'strict',
        description: 'A robust color management tool for the modern age.',
        features: {
          audio: true,
          browserSandbox: false,
          webgl: true
        },
        grade: 'stable',
        name: 'swach',
        summary: 'A robust color management tool for the modern age.'
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
    }
  ]
};
