define(function (require) {
	var registerSuite = require('intern!object');
	var assert = require('intern/chai!assert');
	var ut = require('src/app/js/es6/modules/Utility');

// KEY
// *   b = a dead cell
// *   o = a live cell
// *   $ = end of a line of the pattern

	registerSuite({
		name: 'utility',

		"round": function () {
			assert.strictEqual( ut.round( 1.5, 0 ), 2, "Does .5 value get rounded up?");
			assert.strictEqual( ut.round( 11.499, 0 ), 11, "Do less than half values get rounded down?");
			assert.strictEqual( ut.round( 59.9, 0 ), 60, "Do larger than half values get rounded up?");
		},

		"debounce": function () {
			var dfd = this.async( 4000 );

			var theFn = function() {
				console.log( "theFn is called." );
				dfd.resolve();
			}

			ut.debounce( theFn, 100 )();
		},

		"extend": function () {
			var obj1 = {
				car: "kitt"
			};
			var obj2 = {
				driver: "hasselhoff",
				rpm: 7000
			};
			var obj3 = {
				car: "karr",
				topSpeed: 150
			};
			var expectedObj = {
				car: "karr",
				driver: "hasselhoff",
				rpm: 7000,
				topSpeed: 150
			};
			assert.deepEqual( ut.extend( obj1, obj2, obj3 ), expectedObj );
		},


		"isDigit": function () {
			assert.strictEqual( ut.isDigit( "0" ), true, "Is string '0' a digit?");
			assert.strictEqual( ut.isDigit( "1" ), true, "Is string '1' a digit?");
			assert.strictEqual( ut.isDigit( "9" ), true, "Is string '9' a digit?");
			assert.strictEqual( ut.isDigit( "11" ), false, "Is string '11' a digit?");
			assert.strictEqual( ut.isDigit( "99" ), false, "Is string '99' a digit?");
			assert.strictEqual( ut.isDigit( 0 ), true, "Is number 0 a digit?");
			assert.strictEqual( ut.isDigit( 1 ), true, "Is number 1 a digit?");
			assert.strictEqual( ut.isDigit( 9 ), true, "Is number 9 a digit?");
		},

		"isNonNegativeInteger": function () {
			assert.strictEqual( ut.isNonNegativeInteger( 5 ), true, "Is 5 a non negative integer?");
			assert.strictEqual( ut.isNonNegativeInteger( 600 ), true, "Is 5 a non negative integer?");
			assert.strictEqual( ut.isNonNegativeInteger( -5 ), false, "Is -5 a non negative integer?");
			assert.strictEqual( ut.isNonNegativeInteger( 5.5 ), false, "Is 5.5 a non negative integer?");
			assert.strictEqual( ut.isNonNegativeInteger( "5" ), false, "Is the string '5' a non negative integer?");
			assert.strictEqual( ut.isNonNegativeInteger( NaN ), false, "Is NaN a non negative integer?");
			assert.strictEqual( ut.isNonNegativeInteger( Infinity ), false, "Is Infinity a non negative integer?");
			assert.strictEqual( ut.isNonNegativeInteger( "monkey" ), false, "Is 'monkey' a non negative integer?");
		},

		"stripPixelUnits": function () {
			assert.strictEqual( ut.stripPixelUnits( "5px" ), 5 );
			assert.strictEqual( ut.stripPixelUnits( "55.5px" ), 55.5 );
			assert.strictEqual( ut.stripPixelUnits( "auto" ), "auto" );
		},

		"serializeToQueryString": function () {
			var testObj = {
				car: "kitt",
				driver: "hasselhoff",
				rpm: 7000
			};
			var expectedStr = "car=kitt&driver=hasselhoff&rpm=7000";
			assert.strictEqual( ut.serializeToQueryString( testObj ), expectedStr );
			assert.strictEqual( ut.serializeToQueryString( {} ), "" );
		}
	});
});