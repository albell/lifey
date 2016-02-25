define(function (require) {
	"use strict";

	var registerSuite = require('intern!object');
	var assert = require('intern/chai!assert');
	var parseRLEPixelString = require('src/app/js/es6/modules/parseRLEPixelString');

	registerSuite({
		name: 'parseRLEPixelString',

		"simple parse": function () {
			var parsed = parseRLEPixelString( "obobo4$obobo", 5, 5 );

			
			var referenceArr = [ 1,0,1,0,1,
			                     0,0,0,0,0,
			                     0,0,0,0,0,
			                     0,0,0,0,0,
			                     1,0,1,0,1
			                   ];
			var expectedArr = new Int8Array( 25 );
			for ( let i = 0; i < 25; i += 1 ) {
				expectedArr[ i ] = referenceArr[ i ];
			}
			assert.deepEqual( parsed, expectedArr, "Are simple RLE pixel strings parsed correctly?");
		},

		"no argument": function () {
			assert.strictEqual( parseRLEPixelString(), undefined );
		}


	});
});