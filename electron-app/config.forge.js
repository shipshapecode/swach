module.exports = {
  packagerConfig: {
    darwinDarkModeSupport: 'true',
    icon: 'electron-app/resources/icon.png',
    name: 'Swach',
    osxSign: true,
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
