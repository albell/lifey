define( function() {

	// Currently needed just for Intern to allow block-scoping. Possibly delete in build?
	"use strict";

	return {

		// http://www.jacklmoore.com/notes/rounding-in-javascript/
		round: function( value, decimalPlaces ) {
			return Number( Math.round( value + "e" + decimalPlaces ) + "e-" + decimalPlaces );
		},

		// Http://modernjavascript.blogspot.com/2013/08/building-better-debounce.html
		debounce: function( func, wait ) {

			// We need to save these in the closure
			let timeout, args, context, timestamp;

			return function() {

				// Save details of latest call
				context = this;
				args = [].slice.call( arguments, 0 );
				timestamp = new Date();

				// This is where the magic happens
				let later = function() {

					// How long ago was the last call
					let last = ( new Date() ) - timestamp;

					// If the latest call was less that the wait period ago
					// then we reset the timeout to wait for the difference
					if ( last < wait ) {
						timeout = setTimeout( later, wait - last );

					// Or if not we can null out the timer and run the latest
					} else {
						timeout = null;
						func.apply( context, args );
					}
				};

				// We only need to set the timer now if one isn't already running
				if ( !timeout ) {
					timeout = setTimeout( later, wait );
				}
			};
		},

		throttleRaf: function( func ) {
			let args, context, ticking;

			return function() {

				// Save details of latest call, e.g. event properties.
				context = this;
				args = [].slice.call( arguments, 0 );

				let later = function() {
					func.apply( context, args );
					ticking = false;
				};

				if ( !ticking ) {
					requestAnimationFrame( later );
					ticking = true;
				}
			};
		},

		// Get closest DOM element up the tree that contains a class, ID, or data attribute
		// @param  {Node} elem The base element
		// @param  {String} selector The class, id, data attribute, or tag to look for
		// @return {Node} Null if no match
		// http://gomakethings.com/climbing-up-and-down-the-dom-tree-with-vanilla-javascript/
		getClosest: function( elem, selector ) {
			let firstChar = selector.charAt( 0 );

			// Get closest match
			for ( ; elem && elem !== document; elem = elem.parentNode ) {

				// If selector is a class
				if ( firstChar === "." ) {
					if ( elem.classList.contains( selector.substr( 1 ) ) ) {
						return elem;
					}
				}

				// If selector is an ID
				if ( firstChar === "#" ) {
					if ( elem.id === selector.substr( 1 ) ) {
						return elem;
					}
				}

				// If selector is a data attribute
				if ( firstChar === "[" ) {
					if ( elem.hasAttribute( selector.substr( 1, selector.length - 2 ) ) ) {
						return elem;
					}
				}

				// If selector is a tag
				if ( elem.tagName.toLowerCase() === selector ) {
					return elem;
				}
			}
			return false;
		},

		extend: function() {
			for ( let i = 1; i < arguments.length; i += 1 ) {
				for ( let key in arguments[ i ] ) {
					if ( arguments[ i ].hasOwnProperty( key ) ) {
						arguments[ 0 ][ key ] = arguments[ i ][ key ];
					}
				}
			}
			return arguments[ 0 ];
		},

		isDigit: function( n ) {
			return Boolean( [ true, true, true, true, true, true, true, true, true, true ][ n ] );
		},

		isNonNegativeInteger: function( val ) {
		  return Number.isFinite( val ) && val % 1 === 0 && val >= 0;
		},

		stripPixelUnits: function( str ) {
			let ret = str.replace( /px$/i, "" );

			// Avoid converting "auto" to NaN, but still coerce "6px" to the number 6.
			if ( this.isDigit( str[ 0 ] ) ) {
				ret = parseFloat( ret );
			}
			return ret;
		},

		// @param  {object}
		// @return {string}
		serializeToQueryString: function( obj ) {
			let ret = "";
			for ( let prop in obj ) {
				ret += prop + "="  + obj[ prop ] + "&";
			}
			if ( ret ) {
				ret = ret.slice( 0, -1 ); // Remove final trailing ampersand.
			}
			return ret;
		},

		deserializeQueryString: function( str ) {
			var ret = Object.create( null );
			if ( str.indexOf( "?" ) > -1 ) {
				str = str.split( "?" )[ 1 ];
			}
			var pairs = str.split( "&" );
			pairs.forEach( function( pair ) {
				pair = pair.split( "=" );
				ret[ pair[ 0 ] ] = decodeURIComponent( pair[ 1 ] || "" );
			} );
			return ret;
		},

		selectContents: function( el ) {

			// FF doesn"t support select() method.
			// Webkit throws InvalidStateError on setSelectionRange on an input type=number.
			// https://code.google.com/p/chromium/issues/detail?id=346270
			try {
				el.focus();
				el.setSelectionRange( 0, 9999 );
			} catch ( e ) {
				el.select();
			}
			return el;
		},

		copyTextToClipBoard: function( text ) {
			let input = document.createElement( "textarea" );
			document.body.appendChild( input );
			input.value = text;
			this.selectContents( input );
			document.execCommand( "Copy" );
			document.body.removeChild( input );
			return text;
		}
	};
} );
