define(function (require) {
	"use strict";

	var registerSuite = require('intern!object');
	var assert = require('intern/chai!assert');
	var dataArrayToRLE = require('src/app/js/es6/modules/dataArrayToRLE');

// KEY
// *   b = a dead cell
// *   o = a live cell
// *   $ = end of a line of the pattern

	registerSuite({
		name: 'dataArrayToRLE',

		"empty canvas": function () {
			var inputArr = [ 0,0,0,
			                 0,0,0,
			                 0,0,0
			               ];
			var expectedStr = "";
			var enc = dataArrayToRLE( inputArr, 3, 3 );

			assert.strictEqual( enc.pattern, expectedStr,
				"Do array patterns get correctly encoded to RLE strings?");
			assert.strictEqual( enc.width, 0, "width is 0?");
			assert.strictEqual( enc.height, 0, "height is 0?");
			assert.strictEqual( enc.minCanvasX, 3, "minCanvasX is 3?");
			assert.strictEqual( enc.minCanvasY, 3, "minCanvasY is 3?");
			assert.strictEqual( enc.offsetX, 0, "offsetX is zero?");
			assert.strictEqual( enc.offsetY, 0, "offsetY is zero?");
		},


		"simple string encode": function () {
			var inputArr = [ 0,0,0,0,1,
			                 1,1,1,1,1,
			                 0,0,1,1,0,
			                 1,0,0,1,1,
			                 0,1,1,1,0
			               ];
			var expectedStr = "4bo$" +
			                  "5o$" +
			                  "2b2o$" +
			                  "o2b2o$" +
			                  "b3o"
			var enc = dataArrayToRLE( inputArr, 5, 5 );

			assert.strictEqual( enc.pattern, expectedStr,
				"Do array patterns get correctly encoded to RLE strings?");
			assert.strictEqual( enc.width, 5, "Reported at the full width?");
			assert.strictEqual( enc.height, 5, "Reported at the full height?");
			assert.strictEqual( enc.minCanvasX, undefined, "minCanvasX not assigned?");
			assert.strictEqual( enc.minCanvasY, undefined, "minCanvasY not assigned?");
			assert.strictEqual( enc.offsetX, undefined, "offsetX not assigned?");
			assert.strictEqual( enc.offsetY, undefined, "offsetY not assigned?");
		},

		"larger string encode square": function () {
			var inputArr = [ 1,0,0,0,0,
			                 0,0,0,0,0,
			                 0,0,0,0,0,
			                 1,1,1,1,1,
			                 0,1,1,1,0,
			                 1,1,0,0,0
			               ];
			var expectedStr = "o3$5o$b3o$2o";
			var enc = dataArrayToRLE( inputArr, 5, 6 );

			assert.strictEqual( enc.pattern, expectedStr,
				"Do array patterns get correctly encoded to RLE strings?");
			assert.strictEqual( enc.width, 5, "Reported at the full width?");
			assert.strictEqual( enc.height, 6, "Reported at the full height?");
			assert.strictEqual( enc.minCanvasX, undefined, "minCanvasX not assigned?");
			assert.strictEqual( enc.minCanvasY, undefined, "minCanvasY not assigned?");
			assert.strictEqual( enc.offsetX, undefined, "offsetX not assigned?");
			assert.strictEqual( enc.offsetY, undefined, "offsetY not assigned?");
		},

		"simple rectangle": function () {
			var inputArr = [ 1,0,0,0,0,0,
			                 0,0,0,0,0,1
			               ];
			var expectedStr = "o$5bo";
			var enc = dataArrayToRLE( inputArr, 6, 2 );

			assert.strictEqual( enc.pattern, expectedStr,
				"Do array patterns get correctly encoded to RLE strings?");
			assert.strictEqual( enc.width, 6, "Reported at the full width?");
			assert.strictEqual( enc.height, 2, "Reported at the full height?");
			assert.strictEqual( enc.minCanvasX, undefined, "minCanvasX not assigned?");
			assert.strictEqual( enc.minCanvasY, undefined, "minCanvasY not assigned?");
			assert.strictEqual( enc.offsetX, undefined, "offsetX not assigned?");
			assert.strictEqual( enc.offsetY, undefined, "offsetY not assigned?");
		},

		"second to last": function () {
			var inputArr = [ 1,0,0,0,0,0,
			                 0,0,0,0,1,0,
			                 0,0,0,0,0,1
			               ];
			var expectedStr = "o$4bo$5bo";
			var enc = dataArrayToRLE( inputArr, 6, 3 );

			assert.strictEqual( enc.pattern, expectedStr,
				"Do array patterns get correctly encoded to RLE strings?");
			assert.strictEqual( enc.width, 6, "Reported at the full width?");
			assert.strictEqual( enc.height, 3, "Reported at the full height?");
			assert.strictEqual( enc.minCanvasX, undefined, "minCanvasX not assigned?");
			assert.strictEqual( enc.minCanvasY, undefined, "minCanvasY not assigned?");
			assert.strictEqual( enc.offsetX, undefined, "offsetX not assigned?");
			assert.strictEqual( enc.offsetY, undefined, "offsetY not assigned?");
		},

		"big gap": function () {
			var inputArr = [ 1,0,0,0,0,0,
			                 0,0,0,0,0,1,
			                 0,0,0,0,0,0,
			                 0,0,0,0,0,0,
			                 0,0,0,0,1,0
			               ];
			var expectedStr = "o$5bo3$4bo";
			var enc = dataArrayToRLE( inputArr, 6, 5 );

			assert.strictEqual( enc.pattern, expectedStr,
				"Do array patterns get correctly encoded to RLE strings?");
			assert.strictEqual( enc.width, 6, "Reported at the full width?");
			assert.strictEqual( enc.height, 5, "Reported at the full height?");
			assert.strictEqual( enc.minCanvasX, undefined, "minCanvasX not assigned?");
			assert.strictEqual( enc.minCanvasY, undefined, "minCanvasY not assigned?");
			assert.strictEqual( enc.offsetX, undefined, "offsetX not assigned?");
			assert.strictEqual( enc.offsetY, undefined, "offsetY not assigned?");
		},

		"small string encode with empty rows": function () {
			var inputArr = [ 1,0,0,
			                 0,0,0,
			                 1,0,1
			               ];
			var expectedStr = "o2$obo"
			var enc = dataArrayToRLE( inputArr, 3, 3 );

			assert.strictEqual( enc.pattern, expectedStr,
				"Do empty rows get correctly encoded to RLE strings?");
			assert.strictEqual( enc.width, 3, "Reported at the full width?");
			assert.strictEqual( enc.height, 3, "Reported at the full height?");
			assert.strictEqual( enc.minCanvasX, undefined, "minCanvasX not assigned?");
			assert.strictEqual( enc.minCanvasY, undefined, "minCanvasY not assigned?");
			assert.strictEqual( enc.offsetX, undefined, "offsetX not assigned?");
			assert.strictEqual( enc.offsetY, undefined, "offsetY not assigned?");
		},

		"larger string encode with empty rows": function () {
			var inputArr = [ 1,0,1,0,1,
			                 0,0,0,0,0,
			                 0,0,0,0,0,
			                 0,0,0,0,0,
			                 1,0,1,0,1
			               ];
			var expectedStr = "obobo4$" +
			                  "obobo"
			var enc = dataArrayToRLE( inputArr, 5, 5 );

			assert.strictEqual( enc.pattern, expectedStr,
				"Do empty rows get correctly encoded to RLE strings?");
			assert.strictEqual( enc.width, 5, "Reported at the full width?");
			assert.strictEqual( enc.height, 5, "Reported at the full height?");
			assert.strictEqual( enc.minCanvasX, undefined, "minCanvasX not assigned?");
			assert.strictEqual( enc.minCanvasY, undefined, "minCanvasY not assigned?");
			assert.strictEqual( enc.offsetX, undefined, "offsetX not assigned?");
			assert.strictEqual( enc.offsetY, undefined, "offsetY not assigned?");
		},

		"simple crop": function () {
			var inputArr = [ 0,0,0,0,0,
			                 0,1,1,1,0,
			                 0,1,1,1,0,
			                 0,1,1,1,0,
			                 0,0,0,0,0
			               ];
			var expectedStr = "3o$" +
			                  "3o$" +
			                  "3o";
			var enc = dataArrayToRLE( inputArr, 5, 5 );

			assert.strictEqual( enc.pattern, expectedStr,
				"Do array patterns get correctly cropped?");
			assert.strictEqual( enc.width, 3, "Cropped to the active width?");
			assert.strictEqual( enc.height, 3, "Cropped to their active height?");
			assert.strictEqual( enc.minCanvasX, 5, "Is uncropped width correctly assigned?");
			assert.strictEqual( enc.minCanvasY, 5, "Is uncropped height correctly assigned?");
			assert.strictEqual( enc.offsetX, 1, "Is uncropped width correctly assigned?");
			assert.strictEqual( enc.offsetY, 1, "Is uncropped height correctly assigned?");
		},

		"horizontal crop": function () {
			var inputArr = [ 0,0,0,1,0,
			                 0,1,1,1,0,
			                 0,0,1,0,0,
			                 0,1,0,0,0,
			                 0,0,1,0,0
			               ];
			var expectedStr = "2bo$" +
			                  "3o$" +
			                  "bo$" +
			                  "o$" +
			                  "bo";
			var enc = dataArrayToRLE( inputArr, 5, 5 );

			assert.strictEqual( enc.pattern, expectedStr,
				"Do array patterns get correctly cropped?");
			assert.strictEqual( enc.width, 3, "Cropped to the active width?");
			assert.strictEqual( enc.height, 5, "Cropped to their active height?");
			assert.strictEqual( enc.minCanvasX, 5, "Is uncropped width correctly assigned?");
			assert.strictEqual( enc.minCanvasY, undefined, "Is uncropped height correctly assigned?");
			assert.strictEqual( enc.offsetX, 1, "Is uncropped width correctly assigned?");
			assert.strictEqual( enc.offsetY, undefined, "Is uncropped height correctly assigned?");
		},

		"vertical crop": function () {
			var inputArr = [ 0,0,0,0,0,
			                 0,1,1,1,0,
			                 1,0,1,0,0,
			                 0,1,0,0,1,
			                 0,0,0,0,0
			               ];
			var expectedStr = "b3o$" +
			                  "obo$" +
			                  "bo2bo";
			var enc = dataArrayToRLE( inputArr, 5, 5 );

			assert.strictEqual( enc.pattern, expectedStr,
				"Do array patterns get correctly cropped?");
			assert.strictEqual( enc.width, 5, "Cropped to the active width?");
			assert.strictEqual( enc.height, 3, "Cropped to their active height?");
			assert.strictEqual( enc.minCanvasX, undefined, "Is uncropped width correctly assigned?");
			assert.strictEqual( enc.minCanvasY, 5, "Is uncropped height correctly assigned?");
			assert.strictEqual( enc.offsetX, undefined, "Is uncropped width correctly assigned?");
			assert.strictEqual( enc.offsetY, 1, "Is uncropped height correctly assigned?");
		},

		"invalid dimension arguments": function () {
			var inputArr = [ 0,0,0,0,0,
			                 0,1,1,1,0,
			                 0,1,1,1,0,
			                 0,1,1,1,0,
			                 0,0,0,0,0
			               ];
			var enc = dataArrayToRLE( inputArr, 1000, 1000 );
			assert.strictEqual( enc, false,
				"Do inaccurate canvas dimensions return false?");
		}

	});
});