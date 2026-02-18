/**
 * Generate forge.config.js and the 4 webpack config files.
 */
export function generateForgeConfig() {
  return `module.exports = {
  packagerConfig: {
    asar: true,
  },
  rebuildConfig: {},
  makers: [
    { name: '@electron-forge/maker-squirrel', config: {} },
    { name: '@electron-forge/maker-zip', platforms: ['darwin'] },
    { name: '@electron-forge/maker-deb', config: {} },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
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
`;
}

export function generateWebpackMainConfig() {
  return `module.exports = {
  entry: './main.js',
  module: {
    rules: require('./webpack.rules.js'),
  },
  resolve: {
    extensions: ['.js', '.jsx', '.json'],
  },
};
`;
}

export function generateWebpackRendererConfig() {
  return `const rules = require('./webpack.rules.js');

rules.push(
  {
    test: /\\.css$/,
    use: ['style-loader', 'css-loader'],
  }
);

module.exports = {
  module: { rules },
  resolve: {
    extensions: ['.js', '.jsx', '.json'],
  },
};
`;
}

export function generateWebpackPreloadConfig() {
  return `module.exports = {
  entry: './preload.js',
  module: {
    rules: require('./webpack.rules.js'),
  },
  resolve: {
    extensions: ['.js', '.json'],
  },
};
`;
}

export function generateWebpackRules() {
  return `module.exports = [
  {
    test: /native_modules[\\\\/].+\\.node$/,
    use: 'node-loader',
  },
  {
    test: /[\\\\/]node_modules[\\\\/].+\\.(m?js|node)$/,
    parser: { amd: false },
    use: {
      loader: '@vercel/webpack-asset-relocator-loader',
      options: { outputAssetBase: 'native_modules' },
    },
  },
  {
    test: /\\.jsx?$/,
    exclude: /node_modules/,
    use: {
      loader: 'babel-loader',
      options: {
        presets: ['@babel/preset-env', '@babel/preset-react'],
      },
    },
  },
];
`;
}
