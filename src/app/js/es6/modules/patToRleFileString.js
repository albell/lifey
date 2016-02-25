/**  ---- Convert Pattern Object to RLE file string ----
 *
 *	 Based on the syntax outline at:
 *	 http://www.mirekw.com/ca/ca_files_formats.html
 *
 *   #N Beehive at beehive
 *   #C A simple 12-cell still life composed of two beehive.
 *   #C www.conwaylife.com/wiki/index.php?title=Beehive_at_beehive
 *   #O ook "The Librarian"@unseen.edu Fri Apr 30 19:38:52 1999
 *   #R -22 -57
 *   x = 6, y = 6, rule = 23/3
 *   4bob$3bobo$3bobo$b2obob$o2bo2b$b2o!
 *
 *   TO DO: Integrate #R value with offsetX and offsetY? It's unclear to me
 *   right now what negative #R values here are relative to.
 *
 */
define( function() {

	return function( pat ) {
		let retStr = "";

		if ( pat.name ) {
			retStr += "#N " + pat.name + "\n";
		}
		if ( pat.author ) {
			retStr += "#O " + pat.author + "\n";
		}
		retStr += "x = " + pat.width + ", y=" + pat.height + ", rule = B3/S23\n";
		retStr += pat.pattern + "!\n";

		return retStr;
	};
} );
