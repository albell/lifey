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
            all: [
                'Gruntfile.js',
                'src/app/js/es6/app.js',
                'src/app/js/es6/modules/*.js'
            ]
        },

        jsonlint: {
            src: 'pat/*.json',
        },

        webpack: {
            options: { // Config for all builds.

                // Safari 10 still doesn't support fetch.
                // Polyfill both Promise and fetch.
                // Don't use webpack.ProvidePlugin, that is actually incorrect
                // and unnecessary overhead. Read comments by tarikjn at:
                // https://gist.github.com/Couto/b29676dd1ab8714a818f
                entry: ['es6-promise', 'whatwg-fetch', './src/app/js/es6/app.js'],
                output: {
                    path: path.join(__dirname, "js"),
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
                    new webpack.BannerPlugin( `Lifey. version 0.1.1
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
                    root: path.join(__dirname, "src/app/js")
                }
            },

            // Feature flags for specific builds.
            // https://github.com/petehunt/webpack-howto
            build: {
                plugins: [
                    new webpack.DefinePlugin({
                        __DEV__: false // Environment variable gets set inside closure.
                    }),
                    new webpack.optimize.UglifyJsPlugin({
                        sourceMap: true
                    })
                ],
            },
            buildDev: {
                plugins: [
                    new webpack.DefinePlugin({
                        __DEV__: true
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
                    'css/style.min.css': 'src/app/scss/style.scss'
                }
            }
        },

        minifyHtml: {
            dist: {
                files: {
                    'index.html': 'src/index.html'
                }
            }
        },

        watch: {
            html: {
                files: ['src/index.html'],
                tasks: ['minifyHtml']
            },
            scripts: {
                files: ['Gruntfile.js', 'src/app/js/es6/**'],
                tasks: ['jscs', 'jshint', 'webpack:buildDev']
            },
            scss: {
                files: ['css/*.scss'],
                tasks: ['sass'],
                options: {
                    spawn: false
                }
            },
            pat: {
                files: ['pat/**'],
                tasks: ['jsonlint']
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

    // Scripts-only task.
    grunt.registerTask('dev', [ 'jscs',
                                 'jshint',
                                 'webpack:build'
                                ] );

    // Development build.
    grunt.registerTask('default', [ 'jscs',
                                    'jshint',
                                    'jsonlint',
                                    'webpack:buildDev',
                                    'sass',
                                    'minifyHtml'
                                ] );

    // Production build.
    grunt.registerTask('prod', [ 'jscs',
                                 'jshint',
                                 'jsonlint',
                                 'webpack:build',
                                 'sass',
                                 'minifyHtml'
                                ] );
};
