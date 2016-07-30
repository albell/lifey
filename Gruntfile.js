module.exports = function(grunt) {

	// Avoids manual maintenance of task loading.
	// https://jonsuh.com/blog/take-grunt-to-the-next-level/
	require('jit-grunt')(grunt);

	var path = require('path');
	var webpack = require('webpack');

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),

		jscs: {
			src: ['src/app/js/es6/app.js', 'src/app/js/es6/modules/*.js'],
			options: {
				preset: 'jquery',
				requireCurlyBraces: [ "if" ]
			}
		},

		jshint: {
			options: {
				debug: true,
				esnext: true
			},
			all: ['Gruntfile.js', 'src/app/js/es6/app.js', 'src/app/js/es6/modules/*.js']
		},

		jsonlint: {
			src: 'src/app/pat/*.json',
		},

		copy: {
			html: {
				nonull: true,
				src: 'src/index.html',
				dest: 'dist/index.html'
			},
			manifest: {
				nonull: true,
				src: 'src/manifest.json',
				dest: 'dist/manifest.json'
			},
			scripts: {
				expand: true,
				cwd: 'src/app/js',
				src: '**',
				dest: 'dist/js/'
			},
			styles: {
				expand: true,
				cwd: 'src/app/css',
				src: '**',
				dest: 'dist/css/'
			},
			pat: {
				expand: true,
				cwd: 'src/app/pat',
				src: '*',
				dest: 'dist/pat/'
			},
			icon: {
				expand: true,
				cwd: 'src/app/icon/',
				src: '*',
				dest: 'dist/icon/'
			}
		},

		webpack: {
			options: { // Config for all builds.
				entry: "./dist/js/es6/app.js", // Work from the copied file.
				output: {
					path: path.join(__dirname, "dist/js"),
					filename: "app.min.js",
				},
				debug: true,
				devtool: "sourcemap",
				failOnError: true,
				module : {
					loaders: [
						{
							loader: 'babel',
							query: {
								// https://github.com/babel/babel-loader#options
								// cacheDirectory: true,
								presets: ['es2015']
							}
						}
					]
				},
				plugins: [
					new webpack.BannerPlugin( `Lifey. version 0.1.0
Copyright 2016 Benjamin Lord.

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.` )
				],
				resolve: {
		 			modulesDirectories: [ "es6", "modules", "web_modules", "node_modules" ]
		 		},
		 		resolveLoader: {
			 		root: path.join(__dirname, "dist/js")
			 	}
			}, // Specific builds.
			build: {
				plugins: [
					new webpack.optimize.UglifyJsPlugin({
						sourceMap: true
					})
				],
			},
			buildDev: {
				plugins: [
					new webpack.DefinePlugin({
						__DEV__: true // Environment variable set inside closure.
					})
				],
			}
		},

		sass: {
			options: {
				outputStyle: 'compressed',
				sourceMap: true
			},
			dist: {
				files: {
					'dist/css/min/style.min.css': 'dist/css/style.scss'
				}
			}
		},

		minifyHtml: {
			dist: {
				files: {
					'dist/index.html': 'dist/index.html'
				}
			}
		},

		watch: {
			html: {
				files: ['src/index.html'],
				tasks: ['copy:html', 'minifyHtml']
			},
			scripts: {
				files: ['Gruntfile.js', 'src/app/js/es6/**'],
				tasks: ['copy:scripts', 'jscs', 'jshint', 'webpack:buildDev']
			},
			scss: {
				files: ['src/app/css/**'],
				tasks: ['copy:styles', 'sass'],
				options: {
					spawn: false
				}
			},
			pat: {
				files: ['src/app/pat/**'],
				tasks: ['jsonlint', 'copy:pat']
			}
		},

    intern: {
      releaseTarget: {
        options: {
          runType: 'client', // defaults to 'client' other option is 'runner'
          config: 'tests/intern',
          reporters: [ 'Console', 'Lcov' ]
          // suites: [ '' ],
          // functionSuites : []
        }
      }
    }

	});

	// Unit tests only, for the time being.
	grunt.registerTask('test', ['intern']);

	// For development builds.
	grunt.registerTask('default', [ 'jscs',
	                                'jshint',
	                                'jsonlint',
	                                'copy',
	                                'webpack:buildDev',
	                                'sass',
	                                'minifyHtml'
	                              ] );

	// For production builds.
	grunt.registerTask('prod', [ 'jscs', 'jshint', 'jsonlint', 'copy', 'webpack:build',
	                             'sass', 'minifyHtml' ]);
};
