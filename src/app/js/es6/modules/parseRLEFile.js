/**
 * Parse RLE to JSON
 *
 * Parses "run-length-encoded" (.rle) files used for storing
 * cellular automata patterns. Written as AMD module.
 *
 * By Alex Bell |  MIT License
 *
 * @returns {
 *     name: String,
 *     comments: String,
 *     author: String,
 *     coordinates: [Integer, Integer],
 *     rule: String,
 *     width: Integer,
 *     height: Integer,
 *     pattern: str
 *  }
 *
 * Based on the very basic syntax/grammar outline here
 * http://www.mirekw.com/ca/ca_files_formats.html
 *
 *   b = a dead cell
 *   o = a live cell
 *   $ = end of a line of the pattern
 *
 *   #N Beehive at beehive
 *   #C A simple 12-cell still life composed of two beehive.
 *   #C www.conwaylife.com/wiki/index.php?title=Beehive_at_beehive
 *   #O ook "The Librarian"@unseen.edu Fri Apr 30 19:38:52 1999
 *   #R -22 -57 (this is the offset from the top left.)
 *   x = 6, y = 6, rule = 23/3
 *   4bob$3bobo$3bobo$b2obob$o2bo2b$b2o!
 */
define( function() {

	return function( str ) {
		let ret = Object.create( null );

		if ( !str ) { return; } // Stay out of trouble.

		let pos = 0;
		let chrctr;
		let inComment = false;
		let currentTerm; // Can be "width", "height", or "rule"

		ret.name = ""; // These are the really the only two properties certain to be included.
		ret.pattern = "";

		let isSpace = function( c ) {
			return ( c === "\u0020" || // Space
			         c === "\u0009" );  // Horizontal tab
		};

		let isNewLine = function( c ) {
			return ( c === "\u000A" || // New line
			         c === "\u000C" || // Form feed
			         c === "\u000D" );  // Carriage return
		};

		// http://jsperf.com/isdigittest/5
		let isDigit = function( n ) {
		    return Boolean( [ true, true, true, true, true, true, true, true, true, true ][ n ] );
		};

		let stripTrailingSpaces = function( str ) {
			while ( isSpace( str[ str.length - 1 ] ) ) {
				str = str.substring( 0, str.length - 2 );
			}
			return str;
		};

		let createEmptyPropIfNone = function( str ) {
			if ( !ret[ str ] ) {
				ret[ str ] = "";
			}
		};

		while ( true ) {
			chrctr = str[ pos ];

			// If string has no length, or we've hit the exclamation point EOF marker,
			// or end of string reached.
			if ( !chrctr || chrctr === "!" ) {
				return ret;
			}

			// Determine if entering a comment
			if ( chrctr === "#" ) {
				if ( str[ pos + 1 ] === "N" || str[ pos + 1 ] === "n" ) {
					inComment = "name";
				} else if ( str[ pos + 1 ] === "C" || str[ pos + 1 ] === "c" ) {
					inComment = "comments";
					createEmptyPropIfNone( "comments" );
				} else if ( str[ pos + 1 ] === "O" || str[ pos + 1 ] === "o" ) {
					inComment = "author";
					createEmptyPropIfNone( "author" );
				} else if ( str[ pos + 1 ] === "R" ) {
					inComment = "coordinates";
					createEmptyPropIfNone( "coordinates" );
				}
				pos = pos + 2;
				continue;

			// Inside a comment
			} else if ( inComment ) {

				// Bail out of comment on newline.
				if ( isNewLine( chrctr ) ) {

					// Remove trailing spaces from a comment line.
					ret[ inComment ] = stripTrailingSpaces( ret[ inComment ] );

					if ( inComment === "coordinates" ) {
						ret.coordinates = ret.coordinates.split( " " );
						ret.coordinates[ 0 ] = parseInt( ret.coordinates[ 0 ], 10 ); // The x
						ret.coordinates[ 1 ] = parseInt( ret.coordinates[ 1 ], 10 ); // The y
					}
					inComment = false;

				// Ignore leading spaces and tabcharacters inside a comment if
				// the corresponding property is currently an empty string.
				} else if ( isSpace( chrctr ) && ret[ inComment ] === "" ) {

						// Do nothing inside here. Do Not remove.

				// The coordinates string should be only digits, hyphens, spaces.
				// Skip over anything else like letters or punctuation.
				} else if ( inComment === "coordinates" && !isSpace( chrctr ) &&
				           !isDigit( chrctr ) && chrctr !== "-" ) {
						pos += 1;
						continue;

				} else {

					// The general case: add the character to the comment.
					ret[ inComment ] += chrctr;
				}

			// Not in a comment from here on down.
			// Determine if entering a property
			} else if ( chrctr === "x" ) {
				currentTerm = "width";
				createEmptyPropIfNone( "width" );

			} else if ( chrctr === "y" ) {
				currentTerm = "height";
				createEmptyPropIfNone( "height" );

			} else if ( str.substring( pos, pos + 4 ) === "rule" ) {
				currentTerm = "rule";
				createEmptyPropIfNone( "rule" );

			// Reset currentTerm to empty on commas or newlines
			} else if ( chrctr === "," || isNewLine( chrctr ) ) {
				currentTerm = "";

				// Convert to number
				if ( ret.width && ret.height ) {
					ret.width = parseInt( ret.width );
					ret.height = parseInt( ret.height );
				}

			} else if ( currentTerm ) {

				// Width, height, and rule all accept any digit.
				if ( isDigit( chrctr ) ) {
					ret[ currentTerm ] += chrctr;

				// "rule" additionally accepts a slash
				} else if ( currentTerm === "rule" && chrctr === "/" ) {
					ret[ currentTerm ] += "/";
				}

			// Not in a comment, and not in currentTerm,
			// which means we've reached the actual pattern.
			} else if ( isDigit( chrctr ) || chrctr === "b" ||
			            chrctr === "o" || chrctr === "$" ) {
			 ret.pattern += chrctr;
			}

			pos += 1;

		} // End of big while loop.
	};

} );
