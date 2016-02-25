/**
 * Fn dataArrayToRLE
 * @returns {object}  returns object with properties
 *	 pattern {string},
 *	 width {integer},
 *	 height {integer},
 *   minCanvasX {integer},
 *   minCanvasY {integer},
 *   offsetX {integer},
 *   offsetY {integer}
 */

define( [], function() {

	// Currently needed just for Intern to allow block-scoping.
	"use strict";

	return function( dataArray, canvasWidth, canvasHeight ) {
		let len = dataArray.length;
		if ( len !== canvasWidth * canvasHeight ) {
			console.log( "dataArray doesn't match supplied canvas dimensions." );
			return false;
		}

		let posTopMost = 0; // Start at beginning.
		for ( ; posTopMost < len; posTopMost += 1 ) {
			if ( dataArray[ posTopMost ] === 1 ) {
				break; // Exit at first active cell.
			}
		}

		let posBottomMost = len - 1; // Start at end.
		for ( ; posBottomMost > 0; posBottomMost -= 1 ) {
			if ( dataArray[ posBottomMost ] === 1 ) {
				break;
			}
		}

		// Array position of leftmost active. Start all the way right and move left.
		let posLeftMost = canvasWidth - 1;
		for ( let i = 0; i < len; i += 1 ) {
			if ( dataArray[ i ] === 1 && i % canvasWidth < posLeftMost % canvasWidth ) {
				posLeftMost = i; // Must go through the full loop.
			}
		}

		// Array position of rightmost active. Start all the way left and move right.
		let posRightMost = 0;
		for ( let i = 0; i < len; i += 1 ) {
			if ( dataArray[ i ] === 1 && i % canvasWidth > posRightMost % canvasWidth ) {
				posRightMost = i; // Must go through the full loop.
			}
		}

		let patternWidth = posRightMost % canvasWidth  - posLeftMost % canvasWidth + 1;
		let patternHeight = Math.floor( posBottomMost / canvasWidth ) -
		                    Math.floor( posTopMost / canvasWidth ) + 1;
		let offsetX = posLeftMost % canvasWidth;
		let offsetY = Math.floor( posTopMost / canvasWidth );

		let croppedDataArray = cropArray( dataArray, canvasWidth, canvasHeight,
		                                  patternWidth, patternHeight, offsetX, offsetY );

		let ret = Object.create( null );
		ret.pattern = encodeArrayAsRLEString( croppedDataArray, patternWidth );
		ret.width = patternWidth;
		ret.height = patternHeight;

		if ( patternWidth < canvasWidth ) {
			ret.offsetX = offsetX;
			ret.minCanvasX = canvasWidth;
		}
		if ( patternHeight < canvasHeight ) {
			ret.offsetY = offsetY;
			ret.minCanvasY = canvasHeight;
		}

		// Handle the "completely empty canvas" case.
		// Never return a negative width and height.
		if ( posTopMost === len ) {
			ret.width = ret.height = ret.offsetX = ret.offsetY = 0;
		}

		return ret;
	};

	/**
	 *	Returns a cropped data Array.
	 *
	 *  offsetX and offsetY values are from top left.
	 */
	function cropArray( arr, currWidth, currHeight, cropWidth, cropHeight, offsetX, offsetY ) {
		let newDataArray = new Int8Array( cropWidth * cropHeight );

		// Loop through all of the newDataArray,
		// getting values from the old DataArray.
		for ( let i = 0; i < cropHeight; i += 1 ) {
			for ( let j = 0; j < cropWidth; j += 1 ) {
				newDataArray[ ( i  * cropWidth + j ) ] =
				              arr[ ( i + offsetY ) * currWidth + j + offsetX ];
			}
		}
		return newDataArray;
	}

function encodeArrayAsRLEString( dataArr, canvasWidth ) {
	let retStr = "";
	let currentChar, previousChar;
	let previousCharCount = 0;
	let previousEndRowCount = 0;

	let len = dataArr.length;

	for ( let i = 0; i < len; i += 1 ) {
		currentChar = dataArr[ i ] ? "o" : "b";

		// For tailing characters at the end of a row:
		// bb do nothing.
		// bo write number of repeats, then "b", then "o".
		// ob write number of repeats, then "o".
		// oo write number of repeats + 1, then "o".

		// If on the last cell of a row.
		if ( i > 0 && ( i + 1 ) % canvasWidth === 0 ) {
			if ( currentChar === "o" ) {

				// First, if there are any accumulated end-of-lines, print them
				// and reset the blank row counter.
				if ( previousEndRowCount ) {
					if ( previousEndRowCount > 1 ) {
						retStr += previousEndRowCount;
					}
					retStr += "$";
					previousEndRowCount = 0;
				}

				if ( previousChar === "o" ) {

					// INCREMENT
					previousCharCount += 1;
					retStr += previousCharCount;

				} else if ( previousChar === "b" ) {
					if ( previousCharCount > 1 ) {
						retStr += previousCharCount;
					}
					retStr += "b";
				}
				retStr = retStr + "o";

			} else if ( currentChar === "b" ) {
				if ( previousChar === "o" ) {
					if ( previousCharCount > 1 ) {
						retStr += previousCharCount;
					}
					retStr += previousChar;
				}
			}

			// Increment the row count, unless we're at the very end of the entire array.
			// TO DO: Consider adding the exclamation mark EOF? Possibly unnecessary in JSON.
			if ( i !== len - 1 ) {
				previousEndRowCount += 1;
				previousChar = undefined;
				previousCharCount = 0;
			}

		// INCREMENT, THE GENERAL CASE.
		} else if ( currentChar === previousChar ) {
			previousCharCount += 1;
			continue;

		// WRITE
		} else {

			// We're either:
			// 	- at the beginning of a new row with any value.
			//  - in the middle of a row that has live cells on it, and at
			//    a new character or a different character.

			// Write to the output string and reset the counter.

			// If reached an active cell and there is are any accumulated
			// end-of-lines, print them first and reset the blank row counter.
			if ( currentChar === "o" && previousEndRowCount ) {
				if ( previousEndRowCount > 1 ) {
					retStr += previousEndRowCount;
				}
				retStr += "$";
				previousEndRowCount = 0;
			}

			if ( previousCharCount > 1 ) {
				retStr += previousCharCount;
			}
			if ( previousChar ) {
				retStr += previousChar;
			}

			// Reset for next iteration of loop.
			previousChar = currentChar;
			previousCharCount = 1;
		}
	}

	return retStr;
}

} );
