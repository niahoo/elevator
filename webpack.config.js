var webpack = require("webpack")
var dotenv = require('dotenv')

dotenv.load()
console.log('APP_DEBUG=', process.env.APP_DEBUG)

function env(x) {
	return process.env[x]
}

function appfile (file) {
	return "./app/" + file
}

var plugins = [
	new webpack.optimize.OccurenceOrderPlugin(true),
	new webpack.optimize.DedupePlugin()
]

if (! process.env.APP_DEBUG) {
	plugins.push(new webpack.optimize.UglifyJsPlugin({minimize: true}))
}

module.exports = {
	entry: {
		"wontrepair": appfile("js/main.js"),
		// "wontrepair-lc_fr": appfile("js/lc/fr.js"),
		// "wontrepair-lc_en": appfile("js/lc/en.js")
	},
	output: {
		path: "dist",
		filename: "[name].js"
	},
	module: {
		preLoaders: [
			{ test: /\.(html|svg)$/, exclude: /node_modules/, loader: 'ractive', query: { type: 'none' } }
		],
		loaders: [
			{ test: /\.js$/, exclude: /node_modules/, loader: 'babel-loader'},
			{ test: /\.css$/, loader: "style-loader!css-loader" }
		]
	},
	amd: {phoenix: false},
	resolve: {
		modulesDirectories: ['app/js','app/css','node_modules']
	},
	// devtool: process.env.APP_DEBUG ? '#eval-source-map' : this.undefined,
	devtool: process.env.APP_DEBUG ? '#source-map' : this.undefined,
	plugins: plugins
}
