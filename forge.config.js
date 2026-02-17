const path = require('path');

module.exports = {
  packagerConfig: {
    asar: true,
    name: 'Muon',
  },
  rebuildConfig: {},
  makers: [
    { name: '@electron-forge/maker-squirrel', config: {} },
    { name: '@electron-forge/maker-zip', platforms: ['darwin'] },
    { name: '@electron-forge/maker-deb', config: {} },
  ],
  plugins: [
    { name: '@electron-forge/plugin-auto-unpack-natives', config: {} },
    {
      name: '@electron-forge/plugin-webpack',
      config: {
        mainConfig: './webpack.main.config.js',
        renderer: {
          config: './webpack.renderer.config.js',
          entryPoints: [
            {
              html: './src/index.html',
              js: './src/index.jsx',
              name: 'main_window',
              preload: {
                js: './preload.js',
                config: './webpack.preload.config.js',
              },
            },
          ],
        },
      },
    },
  ],
};
