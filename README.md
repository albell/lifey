# Lifey

[Lifey](https://albell.github.io/lifey) is a simple drawing program that implements Conway's Game of Life, using a web browser. It utilizes the performance and convenience features of the modern web, with the familiar interface of industry-standard pixel editing software. It includes an extensive browsable library of historical patterns in JSON format. It supports touch interfaces, including multitouch fingerpainting and pinch-zooming. It supports pattern sharing via URL, with the ease and convenience of zero-install software.

[Conway's Game of Life](https://en.wikipedia.org/wiki/Conway%27s_Game_of_Life) is probably the most programmed game in the history of computing.

### Browser Support

To minimize the code base, and keep things lightweight, Lifey only runs on modern, standards-based browsers. That currently means Firefox 44+, Chrome 48+, and Safari 10+. No Microsoft Edge yet, because it doesn't support CSS "image-rendering" on <canvas> elements. Soon, hopefully.

### Issues

If you find a bug or have feedback, please file it on the [the issue tracker](https://github.com/albell/lifey/issues)

### Building Lifey

Creating your own build is straightforward using a command line interface. First, ensure that you have the latest [Node.js](http://nodejs.org/) installed. NPM comes bundled with Node. You can run `node -v` to find out the current installed version.

Test that Grunt's command line interface is installed by running `grunt --version`.  If the command isn't found, run `npm install -g grunt-cli`.  For more information about installing Grunt, see the [getting started guide](http://gruntjs.com/getting-started).

1. Fork and then clone the Github repo.
1. Run `cd filepath`, to change directory to the repo replacing "filepath" with the local filepath of your repository.
1. Run `npm install` to install all dependencies (including Grunt).
1. Run `grunt` to build Lifey from the source files. The grunt tasks will create an "index.html" file, and "css" and "js" folders in the root directory, which you can use to serve files locally for testing. There is no "dist" directory, for compatibility with Github Pages.

### Contributing

Code contributions are welcome. For a wish list of possible improvements, please refer to the issue tracker. Please get in touch on Github before doing a bunch of work and filing a pull request. Please run `grunt intern` to run the current, somewhat limited test suite.

### I Want to Add a Pattern to Lifey!

Pattern additions and refinements are welcome, provided that they are genuinely novel, noteworthy, inspired, or instructive in some way. Please first share your discoveries on the [LifeWiki forums](http://conwaylife.com/forums), where the community can referee them. If the forums confirm your pattern, please create a LifeWiki page for your pattern prior to sending a pull request to Lifey. There are also some great historical patterns from [Alan Hensel's pattern collection](http://www.radicaleye.com/lifepage/patterns/contents.html) that are not yet included in Lifey, and might be nice to include.

### Social Practice

You can [follow Lifey](https://twitter.com/playlifey) on Twitter, where occasional news and updates are shared.

### License

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
