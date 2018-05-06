const ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = {
  entry: {
    js: './src/main.js',
    css: './src/main.css',
  },
  output:
    { path: `${__dirname}/public`, filename: '[name].js' },
  module: {
    rules: [
      {
	test: /\.js$/,
	exclude: /node_modules/,
	use: {
	  loader: 'babel-loader',
	  options: {
            presets: ['es2015', 'react'],
          },
	},
      },
      {
	test: /\.css$/,
	use: ExtractTextPlugin.extract(
	  {
	    fallback: "style-loader",
	    use: ["css-loader",
		  {
		    loader: 'postcss-loader',
		    options: {
		      plugins: () => [
			require('postcss-easy-import')({ glob: true }),
		      ],
		    },
		  },
		 ],
	  },
	)
      },
    ],
  },
  plugins: [
    new ExtractTextPlugin('bundle.css'),
  ],
  devServer: {
    contentBase: `${__dirname}/public`,
    host: '0.0.0.0',
    port: 8080,
    inline: true,
    historyApiFallback: true,
  },
  devtool: 'source-map',
};
