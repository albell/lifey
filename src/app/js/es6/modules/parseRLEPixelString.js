/**  ---- Parse RLE pixel string ----
 *
 *	 Based on the syntax outline at:
 *	 http://www.mirekw.com/ca/ca_files_formats.html
 *
 *   b = a dead cell
 *   o = a live cell
 *   $ = end of a line of the pattern
 *
 *   4bob$3bobo$3bobo$b2obob$o2bo2b$b2o!
 *
 *	Returns a uInt8 Array of pixel data with 0 = dead, 1 = live
 *
 * @param {String} str
 * @param {Number} width
 * @param {Number} height
 * @returns {uInt8 Array}
 */
define( [ "Utility" ], function( ut ) {

	// Currently needed just for Intern to allow block-scoping.
	// Consider removing in build.
	"use strict";

	return function( str, width, height ) {
		width = width || 0;
		height = height || 0;
		let chrctr;
		let pos = 0;
		let runCount = ""; // Concatenated character by character
		let runCountInteger;
		let currentX = 0;
		let currentY = 0;
		let dataArray = new Int8Array( width * height ); // All zeros initially

		if ( !str || !width || !height ) {
			return; // Stay out of loop.
		}

		// Loop through each character in the string.
		while ( true ) {
			chrctr = str[ pos ];

			// If end of string reached, or exclamation point EOF marker.
			if ( !chrctr || chrctr === "!" ) {
				return dataArray;                // Main return path

			} else if ( ut.isDigit( chrctr ) ) {
				runCount += chrctr;

			} else if ( chrctr === "b" || chrctr === "o" ) {
				runCountInteger = parseInt( runCount ) || 1;

				// Don't bother setting empty cells on the typed array,
				// because it's pre-populated with all zeroes.
				if ( chrctr === "o" ) {
					for ( let i = 0; i < runCountInteger; i += 1 ) {
						dataArray[ currentY * width + currentX + i ] = 1;
					}
				}

				// Advance currentX (whether it's a "b" or an "o")
				currentX += runCountInteger;
				runCount = ""; // Reset

			} else if ( chrctr === "$" ) {

				// End of this row, and possibly the next rows, etc.
				// Basically treat runCount $s as "newlines" in the grid.
				runCountInteger = parseInt( runCount ) || 1;

				currentX = 0;
				currentY += runCountInteger;
				runCount = "";
			}

			pos += 1;
		}
	};

} );
