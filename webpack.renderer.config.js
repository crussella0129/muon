const rules = require('./webpack.rules');

rules.push(
  {
    test: /\.css$/,
    use: ['style-loader', 'css-loader'],
  },
  {
    test: /\.jsx?$/,
    exclude: /node_modules/,
    use: {
      loader: 'babel-loader',
      options: {
        presets: ['@babel/preset-env', '@babel/preset-react'],
      },
    },
  }
);

module.exports = {
  module: { rules },
  resolve: {
    extensions: ['.js', '.jsx', '.json', '.css'],
  },
};
