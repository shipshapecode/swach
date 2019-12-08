module.exports = {
  packagerConfig: {
    darwinDarkModeSupport: 'true',
    icon: 'electron-app/resources/icon.png',
    name: 'Swach',
    osxSign: {
      entitlements: 'electron-app/src/entitlements.plist',
      'entitlements-inheret': 'electron-app/src/entitlements.plist',
      'gatekeeper-assess': false,
      hardenedRuntime: true,
      identity: 'Developer ID Application: Ship Shape Consulting LLC (779MXKT6B5)'
    },
    osxNotarize: {
      appleId: process.env['APPLE_ID'],
      appleIdPassword: process.env['APPLE_ID_PASSWORD']
    },
    packageManager: 'yarn'
  },
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'Swach'
      }
    },
    {
      name: '@electron-forge/maker-dmg',
      platforms: ['darwin']
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin']
    },
    {
      name: '@electron-forge/maker-deb',
      config: {}
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {}
    }
  ]
};
