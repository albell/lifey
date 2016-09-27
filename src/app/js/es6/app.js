let Flingable = require( "Flingable" );
let Resizable = require( "Resizable" );
let ut = require( "Utility" );
let Modal = require( "Modal" );
let modalCanvasSize = require( "modalCanvasSize" );
let modalOpenPattern = require( "modalOpenPattern" );
let modalSavePattern = require( "modalSavePattern" );
let modalSharePattern = require( "modalSharePattern" );
let parseRLEPixelString = require( "parseRLEPixelString" );
let parseBMP = require( "parseBMP" );
let patToRleFileString = require( "patToRleFileString" );
let dataArrayToRLE = require( "dataArrayToRLE" );
let saveTextAsFile = require( "saveTextAsFile" );
let Hammer = require( "hammerjs" );

// Tooltips imports Gator for easy event delegation.
require( "tooltips-and-stacking" );

// Note: Don't use the broken version of Keymaster on npm.
// Lifey uses a modified version based on a fork of Keymaster which
// supports direct binding to single modifier keys e.g. "shift":
// https://github.com/madrobby/keymaster/pull/136
// (The local version in modules also has other es6-related changes,
// including not binding to window etc.)
let key = require( "keymaster" );

//*******************************************
//*******
//******* ---- Elements ----
//*******
//*******************************************

const w = window;
const doc = document;

const htmlEl = doc.documentElement;
const bodyEl = doc.body;

const scrollSs = doc.querySelector( "#scroll-stylesheet" ).sheet;

const outerBgEl = doc.querySelector( ".outer-background" );
const innerViewEl = doc.querySelector( ".inner-background" );
const canvasEl = doc.querySelector( ".main-canvas" );
const canvasCtx = canvasEl.getContext( "2d" );

const splashEl = doc.querySelector( ".splash" );

const navCanvasEl = doc.querySelector( ".navigator__canvas" );
const navCanvasCtx = navCanvasEl.getContext( "2d" );
const navOutlineEl = doc.querySelector( ".navigator__canvas-outline" );

const toolboxEl = doc.querySelector( "[data-toolbox]" );
const toolboxButtonEls = doc.querySelectorAll( ".toolbox__button" );

const infoCursorXEl = doc.querySelector( "[data-info-cursor-position-x]" );
const infoCursorYEl = doc.querySelector( "[data-info-cursor-position-y]" );
const infoDimensionXEl = doc.querySelector( "[data-info-dimension-x]" );
const infoDimensionYEl = doc.querySelector( "[data-info-dimension-y]" );
const infoCanvasSizeButtonEl = doc.querySelector( "[data-info-button='resize']" );

const playerPanelEl = doc.querySelector( ".player" );
const playerToroidalWrapperEl = doc.querySelector( ".player__toroidal" );
const playerToroidalInputEl = doc.querySelector( "[data-player-toroidal]" );
const playerSpeedEl = doc.querySelector( "[data-player-speed]" );
const playerSpeedInputEl = doc.querySelector( "[data-player-speed-input]" );
const playerCounterEl = doc.querySelector( "[data-generations-counter]" );
const playerClearButtonEl = doc.querySelector( "[data-player-button='clear']" );
const playerResetButtonEl = doc.querySelector( "[data-player-button='reset']" );
const playerPlayButtonEl = doc.querySelector( "[data-player-button='play']" );
const playerStepButtonEl = doc.querySelector( "[data-player-button='step']" );

const patternsPanelEl = doc.querySelector( ".patterns" );
const patternsOuterWrapperEl = doc.querySelector( ".patterns__outer-wrapper" );
const patternsOpenButtonEl = doc.querySelector( "[data-pattern-button=open]" );
const patternsSaveButtonEl = doc.querySelector( "[data-pattern-button=save]" );
const patternsShareButtonEl = doc.querySelector( "[data-pattern-button=share]" );
const patternsWrapperEl = doc.querySelector( ".patterns__outer-wrapper" );
const patternsListItemEls = doc.querySelectorAll( ".pat" );

// Mobile-only UI
const meterButtonMobileEl = doc.querySelector( ".meter__mobile-button" );
const menuButtonMobileEl = doc.querySelector( ".menu__mobile-button" );
const patternsButtonMobileEl = doc.querySelector( ".patterns__mobile-button" );
const requestFullscreenButtonEl = doc.querySelector( ".mobile-menu__go-fullscreen" );
const exitFullscreenButtonEl = doc.querySelector( ".mobile-menu__exit-fullscreen" );

// All panels
const panelArray = [
	doc.querySelector( "[data-toolbox]" ),
	doc.querySelector( "[data-navigator]" ),
	doc.querySelector( "[data-info]" ),
	doc.querySelector( "[data-player]" ),
	doc.querySelector( "[data-patterns]" )
];

//*******************************************
//*******
//******* ---- Browser Specifics/Feature detects ----
//*******
//*******************************************

// Note: window.browser is already defined in the <head> for detects and avoiding FOUC.

// Safari currently "supports" the 'webkit-crisp-edges' value on CSS
// image-rendering, but doesn't actually render it for <canvas> elements.
// Because it's a false positive, it's hard to test for.
// Use crummy vendor detection for now until Apple fixes it.
w.browser = w.browser || Object.create( null );
w.browser.isSafari = navigator.vendor && navigator.vendor.indexOf( "Apple" ) > -1;

// Modern Opera also uses this value.
w.browser.isBlink = navigator.vendor && navigator.vendor === "Google Inc.";

w.browser.isMac = navigator.platform &&
                navigator.platform.toUpperCase().indexOf( "MAC" ) >= 0;

w.browser.shortkey = browser.isMac ? "⌘" : "ctrl";

w.browser.isFirefox = navigator.userAgent.toLowerCase().indexOf( "firefox" ) !== -1;

	// TO DO: INSERT Polyfill for lack of current Firefox support.
	// See https://bugzilla.mozilla.org/show_bug.cgi?id=960316
	// The document root should never scroll/overscroll.
	// (For now FF seems to work without this.)
	// if ( !( "touchAction" in document.documentElement.style ) ) {
	// }

//*******************************************
//*******
//******* ---- State ----
//*******
//*******************************************

let state = Object.create( null );
state.userIsDrawing = false;
state.pointerIsHoveringResizableEdge = false;

state.innerView = Object.create( null );
state.innerView.dragPageStart = Object.create( null );
state.innerView.dragScrollStart = Object.create( null );
state.innerView.isDragging = false;
state.innerView.mouseIsDown = false;

// Scroll values are initially undefined because initial view always fit in window.
state.innerView.scroll = Object.create( null );

state.canvas = Object.create( null );
state.canvas.overflowsInnerView = false;
state.canvas.domDim = Object.create( null );
state.canvas.scale = 6; // Initially match the CSS transform scale() in CSS.

state.toolbox = Object.create( null );
state.toolbox.tool = "brush";
state.toolbox.selectedButton = doc.querySelector( ".toolbox__button" ); // Brush is first

state.nav = Object.create( null );
state.nav.canvas = Object.create( null );
state.nav.outline = Object.create( null );
state.nav.outline.posX = 0;
state.nav.outline.posY = 0;
state.nav.outline.percentageX = 1; // 100% initial.
state.nav.outline.percentageY = 1;

state.player = Object.create( null );
state.player.isPlaying = false;
state.player.toroidal = false; // Initially unchecked.
state.player.generation = 0;
state.player.delay = 500; // Initially the input type=range slider is in the middle.

state.patterns = Object.create( null );

state.scrollbarDim = 0; // Assume zero until load.

let nextFrameID;  // Timeouts set in the player.

//*******************************************
//*******
//******* ---- Flingable and Resizable Panels ----
//*******
//*******************************************

// Make each panel Flingable except for the last panel (patterns).
for ( let i = 0; i < 4; i += 1 ) {
	let panelElement = panelArray[ i ];
	Object.create( Flingable )
	.initFlingable( panelElement, {
		flingCoast: false,
		flingContainer: bodyEl,
		flingHandleEl: panelElement.querySelector( "[data-flingable-handle]" )
	} );
}

// Pattern panel is uniquely both Flingable and Resizable.
let patternPanel = Object.create( ut.extend( Object.create( Flingable ), Resizable ) );

patternPanel.rzblAbortResize = function() {
	return state.canvas.isDrawing || state.isModalOpen; // Prevents resize handle behaviors.
};

patternPanel.reportResizing = function( isResizing ) {
	state.panelIsResizing = isResizing; // Set state when an edge is being resized.
};

patternPanel.initFlingable( panelArray[ 4 ], {
	flingCoast: false,
	flingContainer: bodyEl,
	flingHandleEl: panelArray[ 4 ].querySelector( "[data-flingable-handle]" )
} )
.initResizable( panelArray[ 4 ], {
	rzblTop: false,
	rzblHorizontalCssProp: "right"
} );

//*******************************************
//*******
//******* ---- Prevent Default on Panel drag
//*******
//*******************************************

// Suppress the default I-beam cursor when user is mistakenly trying to drag
// a panel by something other than the "panel__dragspot" at the top.
// The only time we want to allow default native mousedown behavior is when the
// speed slider is dragged.
Gator( bodyEl ).on( [ "mousedown" ], ".panel", function( e ) {
	if ( e.target.className !== "player__speed-input" ) {
		e.preventDefault();
	}
} );

//*******************************************
//*******
//******* ---- innerView ----
//*******
//*******************************************

let innerView = {
	getVisibleDimensions: function() {

		// The outer background dimensions, minus any scrollbars. offsetDim includes scrollbars.
		// state.innerView.visibleWidth = outerBgEl.clientWidth - state.scrollbarDim;
		// state.innerView.visibleHeight = outerBgEl.clientHeight - state.scrollbarDim;
		state.innerView.visibleWidth = outerBgEl.clientWidth;
		state.innerView.visibleHeight = outerBgEl.clientHeight;

	},

	onResize: function() {
		innerView.getVisibleDimensions();
		canvas.evaluateOverflow(); // Will set dimensions if goes into overflow.
	},

	onScroll: function() {
		if ( state.innerView.isDragging ) {
			return; // Bail out, drag memoizes scroll position on its own,
			        // and the debounce breaks it.
		}

		state.innerView.scroll.x = state.innerView.dragScrollStart.x = this.scrollLeft;
		state.innerView.scroll.y = state.innerView.dragScrollStart.y = this.scrollTop;

		updateNavOutline( false );
	},

	setScrollPosition: function( x, y ) {
		if ( !state.canvas.overflowsInnerView ) {
			return;
		}

		// TO-DO: limit the height to max?
		x = Math.max( 0, x );
		y = Math.max( 0, y );

		outerBgEl.scrollLeft = state.innerView.scroll.x = x;
		outerBgEl.scrollTop = state.innerView.scroll.y = y;
	},

	onPointerDown: function( e ) {

		if ( !state.canvas.overflowsInnerView ||
		     ( browser.isBig && !key.shift && state.toolbox.tool !== "hand" ) ||
		     ( !browser.isBig && state.toolbox.tool !== "zoom-in" ) ) {
			return; // Get out, don't handle drag by scrolling.
		}

		state.innerView.dragPageStart.x = e.pageX;
		state.innerView.dragPageStart.y = e.pageY;

		// Record the initial scroll position at the start of the drag.
		// This is the only place where this property get written.
		state.innerView.dragScrollStart.x = state.innerView.scroll.x;
		state.innerView.dragScrollStart.y = state.innerView.scroll.y;
		state.innerView.isDragging = true;

		bodyEl.addEventListener( "mousemove", innerView.onDragMove );
		bodyEl.addEventListener( "mouseleave", innerView.onDragEnd );
		bodyEl.addEventListener( "mouseup", innerView.onDragEnd );

	},

	onDragMove: function( e ) {
		let pageX = e.pageX;
		let pageY = e.pageY;

		let moveX = pageX - state.innerView.dragPageStart.x;
		let moveY = pageY - state.innerView.dragPageStart.y;

		// Set on DOM. These values get clamped by scroll endpoints.
		outerBgEl.scrollLeft = state.innerView.dragScrollStart.x - moveX;
		outerBgEl.scrollTop = state.innerView.dragScrollStart.y - moveY;

		// Read clamped value back into memory for the navigator to use.
		// Fix this to be cleaner later.
		state.innerView.scroll.x = outerBgEl.scrollLeft;
		state.innerView.scroll.y = outerBgEl.scrollTop;

		if ( browser.isBig ) {
			w.setTimeout( function() {
				updateNavOutline( false );
			}, 0 );
		}
	},

	onDragEnd: function( e ) {
		state.innerView.isDragging = false;

		bodyEl.removeEventListener( "mousemove", innerView.onDragMove );
		bodyEl.removeEventListener( "mouseleave", innerView.onDragEnd );
		bodyEl.removeEventListener( "mouseup", innerView.onDragEnd );

		// Read values back from Dom into memory, to normalize for min/max values
		state.innerView.scroll.x = outerBgEl.scrollLeft;
		state.innerView.scroll.y = outerBgEl.scrollTop;
	}
};

// ---- innerView Bindings are added on page load, below.
// Firefox on Android can fire mysterious early resize events which cause trouble.

//*******************************************
//*******
//******* ---- Canvas ----
//*******
//*******************************************

let canvas = Object.create( null );

canvas.setCanvasDim = function( x, y ) {
	state.canvas.domDim.x = canvasEl.width = x;
	state.canvas.domDim.y = canvasEl.height = y;

	// Turning off canvas image smoothing shouldn't really matter,
	// but there may be a very slight performance gain:
	// https://jsperf.com/imagesmoothingenabled
	// image smoothing must be reset after resize.
	canvasCtx.imageSmoothingEnabled = false;

	// Whenever a new canvas dimension is specified. Temporarily reset to white
	// on eraser mousedown on canvas.
	canvasCtx.fillStyle = "rgba(0,0,0,1)";
	navCanvasCtx.fillStyle = "rgba(0,0,0,1)";

	canvas.clearMainAndNavCanvases();
	canvas.setNavigatorCanvasDimensions();

	// Set the user-displayed dimensions in the Info panel.
	infoDimensionXEl.textContent = x;
	infoDimensionYEl.textContent = y;

	// Allows optimized fast 2d drawing in the render loop. See:
	// https://hacks.mozilla.org/2011/12/faster-canvas-pixel-manipulation-with-typed-arrays/
	state.canvas.imageData = canvasCtx.getImageData( 0, 0, x, y );
	state.canvas.pixelBuffer = new Int32Array( state.canvas.imageData.data.buffer );

};

canvas.setNavigatorCanvasDimensions = function() {
	const containerMaxWidth = 158;
	const containerMaxHeight = 164;
	let mainCanvasX = state.canvas.domDim.x;
	let mainCanvasY = state.canvas.domDim.y;
	let navWidth, navHeight;
	let containerAspectRatio = containerMaxWidth / containerMaxWidth;
	let canvasAspectRatio = mainCanvasX / mainCanvasY;

	// Always maximize nav canvas within the nav container regardless of main canvas dimensions.

	// The wide case.
	if ( canvasAspectRatio >= containerAspectRatio ) {
		navWidth = containerMaxWidth;
		navHeight = Math.round( containerMaxWidth / canvasAspectRatio );

	// The tall case.
	} else {
		navWidth = Math.round( containerMaxHeight * canvasAspectRatio );
		navHeight = containerMaxHeight;
	}

	// Inline styles
	navCanvasEl.style.width = navWidth + "px";
	navCanvasEl.style.height = navHeight + "px";

	// Stored state.
	state.nav.canvas.width = navWidth;
	state.nav.canvas.height = navHeight;

	// Navigator Canvas Dom Dimensions match the main canvas.
	// This is more efficient for the player loop.
	navCanvasEl.width	= mainCanvasX;
	navCanvasEl.height = mainCanvasY;

	// Must be reset after resize.
	// Keeps the navigator canvas from being blurry when the main canvas is tiny.
	// Otherwise keep smoothing on because it generally looks better.
	if ( mainCanvasX <= containerMaxWidth && mainCanvasY <= containerMaxHeight ) {
		navCanvasCtx.imageSmoothingEnabled = false;
	}
};

canvas.clearDataArray = function() {
	state.canvas.dataArray = new Int8Array( state.canvas.domDim.x * state.canvas.domDim.y );
};

canvas.clearMainAndNavCanvases = function() {
	let cWidth = state.canvas.domDim.x;
	let cHeight = state.canvas.domDim.y;
	canvasCtx.clearRect( 0, 0, cWidth, cHeight );
	navCanvasCtx.clearRect( 0, 0, cWidth, cHeight );
};

// Commented out but preserve for performance checking.
let paintBothCanvasesPerfCounter = 0;
let paintBothCanvasesDuration = 0;

canvas.paintBothCanvasesBitwise = function() {

	// Performance checking Main paint start.
	let paintBothCanvasesStart = performance.now();

	let dataArr = state.canvas.dataArray;
	let len = dataArr.length;
	let canvasWidth = state.canvas.domDim.x;

	// Thanks to:
	// https://hacks.mozilla.org/2011/12/faster-canvas-pixel-manipulation-with-typed-arrays/
	// Note however that 32-bit direct manipulation is actually fastest. See:
	// http://jsperf.com/canvas-pixel-manipulation/8

	let pixels = state.canvas.pixelBuffer;

	for ( let i = 0; i < len; i += 1 ) {

		// Convert 1 (live) to 0. Convert 0 (dead) to 255.
		let value = 255 - ( dataArr[ i ] * 255 );

		pixels[ i ] =
			( 255   << 24 ) |    /* alpha always opaque*/
			( value << 16 ) |    /* blue */
			( value <<  8 ) |    /* green */
			  value;             /* red */
	}

	canvasCtx.putImageData( state.canvas.imageData, 0, 0 );
	navCanvasCtx.putImageData( state.canvas.imageData, 0, 0 );

	// Performance checking Main paint end.
	let paintBothCanvasesEnd = performance.now();
	paintBothCanvasesDuration += paintBothCanvasesEnd - paintBothCanvasesStart;
	if ( paintBothCanvasesPerfCounter  === 59 ) {
		console.log( "Avg canvas.paintBothCanvasesBitwise: " +
		             paintBothCanvasesDuration / 60 + " ms." );
		paintBothCanvasesPerfCounter = 0;
		paintBothCanvasesDuration = 0;
	}
	paintBothCanvasesPerfCounter += 1;

};

canvas.draw = function( e ) {
	let cWidth = state.canvas.domDim.x;
	let cHeight = state.canvas.domDim.y;
	let sc = state.canvas.scale;
	let scrollX = state.innerView.scroll.x;
	let scrollY = state.innerView.scroll.y;
	let arrayVal = 1; // Assume paint.
	let pageX, pageY, targetOffsetLeft,	targetOffsetTop, transOffsetLeft, transOffsetTop, x, y;

	if ( e.type === "touchmove" ) { e.preventDefault(); } // Prevent simulated mouse events.
	if ( key.shift ) { return; } // Don't draw anything if shift is held.

	// Note: clearRect() sometimes leaves ghosting in Blink. Yes, using integers. ARGH!
	// Erase on the main canvas by painting with opaque white instead.
	// This is super ugly but it's the only way to get clean whites.

	// Changing the destination mode only works for true 2D erasing. Saving this for
	// future reference though:
	// canvasCtx.globalCompositeOperation = "source-over";
	// canvasCtx.globalCompositeOperation = "destination-out";

	// Note that these fill styles will need to be reset to black on mouseup/touchend,
	// otherwise the player won't work.
	if ( state.toolbox.tool === "eraser" ) {
		arrayVal = 0;
		canvasCtx.fillStyle = "rgba(255,255,255,1)";
		navCanvasCtx.fillStyle = "rgba(255,255,255,1)";
	}

	// Handle multitouch drawing/erasing.
	let pointerCount = e.targetTouches && e.targetTouches.length || 1;
	let pointerArray = [];

	// Synthesize offsetX / Y for all drawing, including mouse.

		for ( let i = 0; i < pointerCount; i += 1 ) {

			// Emulate/synthesize offsetX and offsetY event properties for touch events.
			if ( e.type === "touchstart" || e.type === "touchmove" ) {
				pageX = e.touches[ i ].pageX;
				pageY = e.touches[ i ].pageY;
				targetOffsetLeft = e.touches[ i ].target.offsetLeft;
				targetOffsetTop = e.touches[ i ].target.offsetTop;
			} else {
				pageX = e.pageX;
				pageY = e.pageY;
				targetOffsetLeft = e.target.offsetLeft;
				targetOffsetTop = e.target.offsetTop;
			}

			transOffsetLeft = targetOffsetLeft - ( cWidth * sc - cWidth ) / 2;
			transOffsetTop = targetOffsetTop - ( cHeight * sc - cHeight ) / 2;

			x = ( pageX - transOffsetLeft ) / sc;
			y = ( pageY - transOffsetTop ) / sc;

			// Need to check before compensating for scroll.
			// Scroll values are undefined when canvas fits in innerView.
			if ( scrollX ) { x += scrollX / sc; }
			if ( scrollY ) { y += scrollY / sc; }

			// Lastly adjust for the "auto" left margin value created on
			// tall overflowing canvases.
			pointerArray[ i ] = {
				x: Math.floor( x - state.innerView.marginLeft / sc ),
				y: Math.floor( y )
			};
		}

	for ( let j = 0; j < pointerCount; j += 1 ) {
		let drawX = pointerArray[ j ].x;
		let drawY = pointerArray[ j ].y;

		// Note: fillRect() is fastest on modern browsers
		// http://jsperf.com/setting-canvas-pixel
		canvasCtx.fillRect( drawX, drawY, 1, 1 );
		navCanvasCtx.fillRect( drawX, drawY, 1, 1 );
		state.canvas.dataArray[ drawY * state.canvas.domDim.x + drawX ] = arrayVal;
	}
};

canvas.onPointerDown = function( e ) {

	// Early return for non-drawing modes.
	if ( state.toolbox.tool !== "brush" && state.toolbox.tool !== "eraser" || // E.g. hand, zoom
	     state.toolbox.override || // Hand keyboard shortcut state.
	     state.panelIsResizing || // On canvas but resizing a panel.
	     state.isHoveringResizableEdge || // On canvas but near a drag-resizable edge. TO DO?
	     state.isModalOpen ||
	     e.which === 3  ) { // Right mouse click shouldn't paint.

		return;
	}

	// Keep below early return.
	// Don't prevent default regular native inertial touch-dragging.
	if ( e.type === "touchstart" ) {
		e.preventDefault();
	}

	// Read and stored for draw positioning when canvas is narrow but overflows vertically,
	// and width is less than the inner view width minus all horizontal padding.
	state.innerView.marginLeft = parseInt( w.getComputedStyle( innerViewEl ).marginLeft, 10 );

	// Drawing on top of a pattern in the library deselects that pattern.
	voidCurrentSelectedPatternLink();
	clearAnyHash();

	canvas.draw( e );
	state.canvas.isDrawing = true;

	if ( e.type === "touchstart" ) {
		canvasEl.addEventListener( "touchmove", canvas.draw );
		w.addEventListener( "touchend", canvas.onPointerUp );
	} else { // Assume mouse.
		canvasEl.addEventListener( "mousemove", canvas.draw );
		w.addEventListener( "mouseup", canvas.onPointerUp );
	}
};

canvas.onPointerUp = function( e ) {
	state.canvas.isDrawing = false;

	// Canvas fill style must be reset to black on end of eraser (white draw)
	// so that player drawing will work.
	if ( state.toolbox.tool === "eraser" ) {
		canvasCtx.fillStyle = "rgba(0,0,0,1)";
		navCanvasCtx.fillStyle = "rgba(0,0,0,1)";
	}

	if ( e.type === "touchend" ) {
		e.preventDefault();
		canvasEl.removeEventListener( "touchmove", canvas.draw );
		w.removeEventListener( "touchend", canvas.onPointerUp );
	} else { // Assume mouse.
		canvasEl.removeEventListener( "mousemove", canvas.draw );
		w.removeEventListener( "mouseup", canvas.onPointerUp );
	}
};

canvas.handleResize = function( newWidth, newHeight, anchorX, anchorY ) {
	let oldWidth = state.canvas.domDim.x;
	let oldHeight = state.canvas.domDim.y;

	let oldDataArray = state.canvas.dataArray;
	let newDataArray = new Int8Array( newWidth * newHeight );

	// The amount to crop out from the origin (left, top) sides of the original.
	// If the new dims are bigger, there will be no crop, and offset will be 0.
	// If the new dims are smaller, offset will be a positive integer.
	// These are only used to determine where the loop starts.
	let oldCenterMap = Object.create( null, {
		left:   { value: 0 },
		center: { value: Math.round( Math.max( oldWidth - newWidth, 0 ) / 2 ) },
		right:  { value: Math.max( oldWidth - newWidth, 0 ) },
		top:    { value: 0 },
		middle: { value: Math.round( Math.max( oldHeight - newHeight, 0 ) / 2 ) },
		bottom: { value: Math.max( oldHeight - newHeight, 0 ) }
	} );

	let oldXOffset = oldCenterMap[ anchorX ];
	let oldYOffset = oldCenterMap[ anchorY ];

	// The endpoint of the loop will be the smaller of the current and new dims.
	let xLen = oldXOffset + Math.min( oldWidth, newWidth );
	let yLen = oldYOffset + Math.min( oldHeight, newHeight );

	// These offsets handle the cases when the new canvas is bigger.
	// Handling these separately keeps the loop clean.
	let newCenterMap = Object.create( null, {
		left:   { value: 0 },
		center: { value: Math.round( Math.max( newWidth - oldWidth, 0 ) / 2 ) },
		right:  { value: Math.max( newWidth - oldWidth, 0 ) },
		top:    { value: 0 },
		middle: { value: Math.round( Math.max( newHeight - oldHeight, 0 ) / 2 ) },
		bottom: { value: Math.max( newHeight - oldHeight, 0 ) }
	} );

	let newXOffset = newCenterMap[ anchorX ];
	let newYOffset = newCenterMap[ anchorY ];

	// Loop through all (or part) of the old dataArray,
	// applying it with an offset to the newDataArray.
	for ( let i = oldYOffset; i < yLen; i += 1 ) {
		for ( let j = oldXOffset; j < xLen; j += 1 ) {
			newDataArray[ ( i - oldYOffset + newYOffset ) * newWidth +
			              ( j - oldXOffset + newXOffset ) ] =
			              oldDataArray[ i * oldWidth + j ];
		}
	}

	state.canvas.dataArray = newDataArray;

	// Don't reset generations counter on canvas resize.
	redrawCanvasFromDataArray( newDataArray, newWidth, newHeight );
};

//
// ---- Canvas Drawing Binding ----
//

canvasEl.addEventListener( "touchstart", canvas.onPointerDown );
canvasEl.addEventListener( "mousedown", canvas.onPointerDown );

//
// ---- Zoom Stuff ----
//

canvas.repaintBoxShadow = function() {

	// Blink misrenders the canvas edge as blurry after any zoom.
	// Blink also sometimes mistakenly shows scroll bars on the outer bg.
	// This is a Blink bug, the internal dim is less than the outer bg.
	// Removing the box-shadow class, forcing render, then
	// adding it back again fixes it. Yuck!
	canvasEl.classList.remove( "main-canvas--box-shadow" );
	w.getComputedStyle( canvasEl ); // Force render. Yuck.
	w.setTimeout( function() {
		canvasEl.classList.add( "main-canvas--box-shadow" );
	}, 90 ); // Waiting less than 90ms doesn't seem to work. WTF.
};

canvas.handleIncrementalZoom = function( e, keybindingZoomDirection ) {

	// Zoom on touch is handled via pinch. We want to duck synthetic click events.
	// For mobile/touch, get out, and don't prevent default.
	if ( state.toolbox.tool !== "zoom-in" && state.toolbox.tool !== "zoom-out" &&
	    !keybindingZoomDirection || state.toolbox.override || !browser.isBig ) {
		return;
	}

	let currentScale = state.canvas.scale;
	let newScale = currentScale;	// Default to same. In case of some mistake below.

	// Snapshot of previous pre-zoom state for passing to scroll calculator.
	let prevScroll = {
		overflowed: state.canvas.overflowsInnerView,
		x: state.innerView.scroll.x,
		y: state.innerView.scroll.y,
		scale: currentScale
	};

	let zoomArray = [
		0.333, // 0 (index number)
		0.5,   // 1
		0.667, // 2
		1,     // 3 (= 100% scale)
		2,     // 4
		3,     // 5
		4,     // 6
		5,     // 7
		6,     // 8
		7,     // 9
		8,     // 10
		12,    // 11
		16,    // 12
		32,    // 13
		64     // 14
	];

	let direction = state.toolbox.tool; // E.g. "zoom-in" or "zoom-out"

	// Keyboard shortcut overrides toolbox
	if ( keybindingZoomDirection ) {
		direction = keybindingZoomDirection;	// Again, "zoom-in" or "zoom-out"
	}

	if ( direction === "zoom-in" ) {
		for ( let i = 0; i < 15; i += 1 ) {
			if ( zoomArray[ i ] > currentScale ) {
				newScale = zoomArray[ i ];
				break;
			}
		}
	} else {
		for ( let i = 14; i > -1; i -= 1 ) {
			if ( zoomArray[ i ] < currentScale ) {
				newScale = zoomArray[ i ];
				break;
			}
		}
	}

	// If no change, perhaps we're at one of the ends of the zoom scale, get out.
	if ( newScale === currentScale ) { return; }

	// Set scale since it has changed.
	canvasEl.setAttribute( "style", "transform: scale(" + newScale + ")" );
	state.canvas.scale = newScale;
	if ( browser.isBlink ) {
		canvas.repaintBoxShadow();
	}

	// Toggles classes and styles on innerView, and will remove scroll if canvas is contained.
	canvas.evaluateOverflow( newScale );

	if ( state.canvas.overflowsInnerView ) {
		canvas.setScrollPositionBasedOnZoomEvent( e, prevScroll,
		                                          keybindingZoomDirection );
	}
};

canvas.evaluateOverflow = function( newScale ) {
	let canvasWidth = state.canvas.domDim.x;
	let canvasHeight = state.canvas.domDim.y;
	let theScale = state.canvas.scale;
	let newOverflow = false;
	let newInnerViewWidth, newInnerViewHeight;
	let removeNavOutlineDimensions = false;

	// For example, newScale is undefined when called on resize.
	// Also note newScale equals 0 when zoomed all the way out.
	if ( newScale !== undefined ) {
		theScale = newScale;
	}

	// No overflow on update.
	if ( canvasWidth * theScale < state.innerView.visibleWidth &&
	     canvasHeight * theScale < state.innerView.visibleHeight ) {

		if ( state.canvas.overflowsInnerView ) {

			// Unsure on this. TO DO: review state etc.
			state.innerView.width = innerView.visibleWidth;
			state.innerView.height = innerView.visibleHeight;
			state.innerView.scroll.x = undefined;
			state.innerView.scroll.y = undefined;

			innerViewEl.classList.remove( "inner-background--canvas-overflows" );

			// Effectively reverts height and width back to 100% values in stylesheet.
			innerViewEl.style.width = "";
			innerViewEl.style.height = "";
			removeNavOutlineDimensions = true;
		}

	// Else one or more of the dims overflows the innerView,
	// so switch into overflow state if we aren't already,
	// and set dims using explicit numeric CSS values.
	} else {
		newOverflow = true;

		// Base innerView dims on canvas.
		// Note however that height is constrained to min-height: 100% in stylesheet,
		// in the stylesheet, otherwise vertical centering would break.
		newInnerViewWidth = canvasWidth * theScale + state.canvas.zoomPadding * 2;
		newInnerViewHeight = canvasHeight * theScale + state.canvas.zoomPadding * 2;

		// But don't let them ever be less than 100% or it breaks centering
		state.innerView.width = newInnerViewWidth;
		state.innerView.height = newInnerViewHeight;
		innerViewEl.style.width = newInnerViewWidth + "px";
		innerViewEl.style.height = newInnerViewHeight + "px";

		// Note that in this case scroll positions will still need to be set.

		if ( !state.canvas.overflowsInnerView ) {
			innerViewEl.classList.add( "inner-background--canvas-overflows" );
		}
	}

	state.canvas.overflowsInnerView = newOverflow;
	updateNavOutline( removeNavOutlineDimensions );
};

// Set scroll position on any overflow.
// Always called within a conditional. Assume state.canvas.overflowsInnerView true.
canvas.setScrollPositionBasedOnZoomEvent = function( e, prevScroll,
                                                     keybindingZoomDirection,
                                                     pinchCenterX, pinchCenterY,
                                                     pinchPanX, pinchPanY ) {
	let cWidth = state.canvas.domDim.x;
	let cHeight = state.canvas.domDim.y;
	let zoomPadding = state.canvas.zoomPadding;
	let prevScale = prevScroll.scale;
	let newScale = state.canvas.scale;
	pinchPanX = pinchPanX || 0;
	pinchPanY = pinchPanY || 0;

	// Event pageX/Y will exist for for mouse clicks.
	// (Keyboard-shortcut-initiated zooms have a synthetic pageX/Y.)
	// e will be null for pinch zooms.
	let zoomCenterX = e && e.pageX || pinchCenterX;
	let zoomCenterY = e && e.pageY || pinchCenterY;

	let canvasTransX, canvasTransY,
	    curCenteredFromLeft, curCenteredFromTop,
	    canvasRawX, canvasRawY,
	    newScrollX, newScrollY;

	if ( prevScroll.overflowed ) {
		canvasTransX = zoomCenterX + prevScroll.x - zoomPadding;
		canvasTransY = zoomCenterY + prevScroll.y - zoomPadding;

	// Previously no scroll bars
	} else {
		curCenteredFromLeft = ( state.innerView.visibleWidth - cWidth * prevScale ) / 2;
		curCenteredFromTop = ( state.innerView.visibleHeight - cHeight * prevScale ) / 2;

		canvasTransX = zoomCenterX - curCenteredFromLeft;
		canvasTransY = zoomCenterY - curCenteredFromTop;
	}

	canvasRawX = canvasTransX / prevScale;
	canvasRawY = canvasTransY / prevScale;

	// If the user is scroll centered, and zoom-clicks in the center of the canvas,
	// the new scroll should scale up in proportion to the
	// (new innerView / old Inner view)

	newScrollX = zoomPadding + canvasRawX * newScale - zoomCenterX;
	newScrollY = zoomPadding + canvasRawY * newScale - zoomCenterY;

	// Adjust for possible pinch panning. (Moving the pinch center during the pinch.)
	newScrollX -= pinchPanX;
	newScrollY -= pinchPanY;

	innerView.setScrollPosition( newScrollX, newScrollY );
};

canvas.handleFitZoom = function() {
	let canvasWidth = state.canvas.domDim.x;
	let canvasHeight = state.canvas.domDim.y;
	let innerViewVisWidth = state.innerView.visibleWidth;
	let innerViewVisHeight = state.innerView.visibleHeight;
	let newScale;
	let innerViewVisibleProportion = innerViewVisWidth / innerViewVisHeight;
	let canvasProportion = canvasWidth / canvasHeight;

	if ( innerViewVisibleProportion >= canvasProportion ) {

		// The wide Inner View case, fit height
		newScale = innerViewVisHeight / canvasHeight;
	} else {
		newScale = innerViewVisWidth / canvasWidth;
	}

	// Remove any overflow styles
	if ( state.canvas.overflowsInnerView ) {
		innerViewEl.classList.remove( "inner-background--canvas-overflows" );

		// Remove explicit width and height
		innerViewEl.removeAttribute( "style" );
	}

	// Fit should always center the canvas, removing any CSS translate()
	canvasEl.setAttribute( "style", "transform: scale(" + newScale + ")" );

	state.canvas.overflowsInnerView = false;

	// Remove scroll
	state.innerView.scroll.x = undefined;
	state.innerView.scroll.y = undefined;

	// Reset navigation outline
	navOutlineEl.removeAttribute( "style" );
	state.nav.outline.posX = 0;
	state.nav.outline.posY = 0;
	state.nav.outline.percentageX = 1;
	state.nav.outline.percentageY = 1;

	state.canvas.scale = newScale;
	if ( browser.isBlink ) {
		canvas.repaintBoxShadow();
	}
};

// Don't bother binding a listener for touchstart because pinch handles
// all zoom in the mobile/tablet interface.
innerViewEl.addEventListener( "click", canvas.handleIncrementalZoom );

//*******************************************
//*******
//******* ---- Pinch/Zoom on Touch ----
//*******
//*******************************************

// Create a manager for the inner view.
var hammerInnerV = new Hammer.Manager( innerViewEl, {
	touchAction: "pan-x pan-y" // Allow default native panning behaviors for single touches.
} );

// Create a recognizer, and add that recognizer to the manager.
hammerInnerV.add( new Hammer.Pinch() );

// Holds snapshot of pre-pinch state.
let initPinch = Object.create( null );

hammerInnerV.on( "pinchstart", function( e ) {
	e.preventDefault(); // Always on pinchstart.
	if ( state.toolbox.tool !== "zoom-in" ) { return; }

	initPinch.overflowed = state.canvas.overflowsInnerView;
	initPinch.x = state.innerView.scroll.x;
	initPinch.y = state.innerView.scroll.y;
	initPinch.scale = state.canvas.scale;
	initPinch.center = e.center;

	// No CSS scale transition timing.
	canvasEl.classList.remove( "main-canvas--transition-scale" );
} );

hammerInnerV.on( "pinch", function( e ) {
	e.preventDefault(); // Always on pinch.

	if ( state.toolbox.tool !== "zoom-in" ) { return; }

	let newScale = initPinch.scale * e.scale;
	canvasEl.style.transform = "scale(" +  newScale + ")";
	state.canvas.scale = newScale;

	let initPinchCenter = initPinch.center;
	let newPinchCenter = e.center;

	// Reevaluate overflow continuously during the pinch.
	canvas.evaluateOverflow( newScale );

	// When in overflow mode, scroll should adjust so that the center of the pinch on the canvas
	// tracks to the same screen position. Also pinch centers can "pan" during pinch.
	let pinchPanX = newPinchCenter.x - initPinchCenter.x;
	let pinchPanY = newPinchCenter.y - initPinchCenter.y;

	canvas.setScrollPositionBasedOnZoomEvent( null, initPinch, null,
                                            initPinchCenter.x,
                                            initPinchCenter.y,
                                            pinchPanX,
                                            pinchPanY );
} );

hammerInnerV.on( "pinchend", function( e ) {
	e.preventDefault(); // Always on pinchend.

	if ( state.toolbox.tool !== "zoom-in" ) { return; }

	if ( browser.isBlink ) {
		canvas.repaintBoxShadow();
	}
} );

//*******************************************
//*******
//******* ---- Toolbox ----
//*******
//*******************************************

// Arguments are button event, string is "brush" or "eraser or "hand" etc.
let setToolboxTool = function( e, newToolNameStr ) {
	newToolNameStr = newToolNameStr || this.getAttribute( "data-tool-button" );

	if ( newToolNameStr === state.toolbox.tool ) {return;} // Get out
	for ( let i = 0; i < 5; i += 1 ) {
		toolboxButtonEls[ i ].classList.remove( "panel__button--selected" );
	}
	let selectedButton = doc.querySelector( "[data-tool-button=" + newToolNameStr );
	selectedButton.classList.add( "panel__button--selected" );

	// Handle CSS cursors.
	innerViewEl.classList.remove( "brush-tool",
	                              "eraser-tool",
	                              "hand-tool",
	                              "zoom-in-tool",
	                              "zoom-out-tool" );
	innerViewEl.classList.add( newToolNameStr + "-tool" );

	state.toolbox.tool = newToolNameStr;
};

Gator( toolboxEl ).on( [ "touchstart", "mousedown" ], ".toolbox__button", setToolboxTool );

//*******************************************
//*******
//******* ---- Navigator ----
//*******
//*******************************************

// Called by innerView.onUserScroll and canvas.evaluateOverflow
let updateNavOutline = function( removeNavOutlineDimensions ) {
	if ( !browser.isBig ) { return; }

	// Called from evaluateOverflow if there's been a change from
	// overflow to no overflow.
	if ( removeNavOutlineDimensions ) {
		navOutlineEl.removeAttribute( "style" );
		return;
	}

	// This early return must stay in place here. Don't refactor.
	if ( !state.canvas.overflowsInnerView ) { return; }

	// Default if roughly centered, doesn't yet account for scroll position.
	let mainCanvasVisibleX = state.innerView.visibleWidth;
	let mainCanvasVisibleY = state.innerView.visibleHeight;
	let padding = state.canvas.zoomPadding;
	let scale = state.canvas.scale;
	let percentageVisibleX, percentageVisibleY, ratioBetweenCanvases,
	    outlinePosX, outlinePosY;

	// If scrolled to left edge
	if ( state.innerView.scroll.x < padding ) {
		mainCanvasVisibleX -= ( padding - state.innerView.scroll.x );

	// If scrolled to right edge
	}	else if ( state.innerView.scroll.x > state.innerView.width -
	            state.innerView.visibleWidth - padding ) {
		mainCanvasVisibleX -= state.innerView.scroll.x - ( state.innerView.width -
		                      state.innerView.visibleWidth - padding );
	}

	// If scrolled to top edge
	if ( state.innerView.scroll.y < padding ) {
		mainCanvasVisibleY -= ( padding - state.innerView.scroll.y );

	// If scrolled to bottom edge
	}	else if ( state.innerView.scroll.y > state.innerView.height -
	            state.innerView.visibleHeight - padding ) {
		mainCanvasVisibleY -= state.innerView.scroll.y - ( state.innerView.height -
		                      state.innerView.visibleHeight - padding );
	}

	percentageVisibleX = mainCanvasVisibleX /
	                     ( state.canvas.domDim.x * scale );
	percentageVisibleY = mainCanvasVisibleY /
	                     ( state.canvas.domDim.y * scale );

	// If width or height have changed then set them on the element
	if ( percentageVisibleX !== state.nav.outline.percentageX ) {
		state.nav.outline.percentageX = percentageVisibleX;
		navOutlineEl.style.width = percentageVisibleX * 100 + "%";
	}
	if ( percentageVisibleY !== state.nav.outline.percentageY ) {
		state.nav.outline.percentageY = percentageVisibleY;
		navOutlineEl.style.height = percentageVisibleY * 100 + "%";
	}

	// Use the larger of the two dimensions to calculate the ratio,
	// in order to minimize ugly rounding errors.
		if ( state.nav.canvas.width > state.nav.canvas.height ) {
			ratioBetweenCanvases = state.nav.canvas.width /
			                       ( state.canvas.domDim.x * scale );
		} else {
			ratioBetweenCanvases = state.nav.canvas.height /
			                       ( state.canvas.domDim.y * scale );
		}

	outlinePosX = ( state.innerView.scroll.x - padding ) * ratioBetweenCanvases;
	outlinePosY = ( state.innerView.scroll.y - padding ) * ratioBetweenCanvases;

	// Clamp outline to 0,0 (don't allow negative).
	outlinePosX = Math.max( 0, outlinePosX );
	outlinePosY = Math.max( 0, outlinePosY );

	state.nav.outline.posX = outlinePosX;
	state.nav.outline.posy = outlinePosY;
	navOutlineEl.style.transform = "translate(" + outlinePosX + "px," + outlinePosY + "px)";
};

//*******************************************
//*******
//******* ---- Info ----
//*******
//*******************************************

let updateCursorCoordinates = function( e ) {

	// IE reports non-integer values for offset. Round down.
	// Consider removing floor() if never supporting IE.
	infoCursorXEl.textContent = Math.floor( e.offsetX );
	infoCursorYEl.textContent = Math.floor( e.offsetY );
};

let handleCoordinatesEnter = function( e ) {
	updateCursorCoordinates( e );
	canvasEl.addEventListener( "mousemove", updateCursorCoordinates );
	canvasEl.addEventListener( "mouseleave", handleCoordinatesLeave );
};

let handleCoordinatesLeave = function( e ) {
	infoCursorXEl.textContent = "";
	infoCursorYEl.textContent = "";
	canvasEl.removeEventListener( "mousemove", updateCursorCoordinates );
	canvasEl.removeEventListener( "mouseleave", handleCoordinatesLeave );
};

//*******************************************
//*******
//******* ---- Player ----
//*******
//*******************************************

let player = Object.create( null );

player.setSpeed = function( event, num ) {

	// Arguments will include an Event in case it's being emitted from the input
	// slider, but can also be set directly below based on read-in values.
	let val = ( event && event.target ) ? event.target.value : num;
	val = Math.max( 0, Math.min( 6, val ) ); // Must be between 0 and 6 inclusive.
	state.player.delay = [ 1600, 750, 200, 100, 50, 25, "none" ][ val ]; // Durations in ms.

	if ( !event ) { playerSpeedInputEl.value = val; }

	// The data-* attribute creates a CSS hook for the position styling of the SVG thumb.
	playerSpeedInputEl.setAttribute( "data-player-speed-input", val );
};

// Allow the next few often-called fns to live in the outermost scope, to reduce object lookups.

// A 3x3 bitmap has 2^9 = 512 possible states.
// 000000001 = 1
// 000000010 = 2
// 000000011 = 3
// 000000100 = 4
// 000000101 = 5
// 000000110 = 6
// 000000111 = 7
// 000001000 = 8
// 000001001 = 9
// 000001010 = 10
// 000001011 = 11
// 000001100 = 12
// 000001101 = 13
// 000001110 = 14
// 000001111 = 15
// 111000000 = 448 etc.

// Pre-build and store a lookup array mapping all the possibilities.
// Stores the number of active cells in the nine cell neighborhood,
// including the center cell.
let bitmapLookupArr = new Uint8Array( 512 );
for ( let i = 0; i < 512; i += 1 ) {
	bitmapLookupArr[ i ] = i.toString( 2 ).split( "1" ).length - 1;
}

let bitmap = 0;

let getTileFromFlatArray = function( x, y, cWidth, dataArray ) {
	return dataArray[ y * cWidth + x ];
};

// Listlife reference at: http://dotat.at/prog/life/life.html
// Local cell neighborhood as binary map:
//  _______________________________________________________
//  |                  |                 |                 |
//  |  001000000 = 64  |  000001000 = 8  |  000000001 = 1  |
//  |__________________|_________________|_________________|
//  |                  |                 |                 |
//  |  010000000 = 128 |  000010000 = 16 |  000000010 = 2  |
//  |__________________|_________________|_________________|
//  |                  |                 |                 |
//  |  100000000 = 256 |  000100000 = 32 |  000000100 = 4  |
//  |__________________|_________________|_________________|

let countNonToroidal = function( x, y, cWidth, cHeight, dataArray ) {

	let ret = 0;
	let leftEdge = x === 0;
	let rightEdge = x === ( cWidth - 1 );
	let topEdge = y === 0;
	let bottomEdge = y === ( cHeight - 1 );
	let centerActive = false;
	let neighborhoodCount;

	if ( leftEdge ) {
		bitmap = 0;
	} else {

		// Move binary representation three cells to left, adding zeroes from the right.
		// Using the shift allows 3 array lookups for non-edge cells, instead of 9.
		bitmap = bitmap << 3;
		bitmap = bitmap & 511; // 511 = "111111111". Set all but the 9 right most digits equal to 0.
		centerActive = ( bitmap & 16 ) === 16;
	}

	// Always add cells in column to the right, for all cases.

	// Top right cell.
	if ( !rightEdge && !topEdge && getTileFromFlatArray( x + 1, y - 1, cWidth, dataArray ) ) {
		bitmap = bitmap | 1;
	}

	// Right cell.
	if ( !rightEdge && getTileFromFlatArray( x + 1, y, cWidth, dataArray ) ) {
		bitmap = bitmap | 2;
	}

	// Bottom right cell.
	if ( !rightEdge && !bottomEdge && getTileFromFlatArray( x + 1, y + 1, cWidth, dataArray ) ) {
		bitmap = bitmap | 4;
	}

	if ( leftEdge ) {

		// Top cell.
		if ( !topEdge && getTileFromFlatArray( x, y - 1, cWidth, dataArray ) ) {
			bitmap = bitmap | 8;
		}

		// Center cell.
		if ( getTileFromFlatArray( x, y, cWidth, dataArray ) ) {
			bitmap = bitmap | 16;
			centerActive = true;
		}

		// Bottom cell.
		if ( !bottomEdge && getTileFromFlatArray( x, y + 1, cWidth, dataArray ) ) {
			bitmap = bitmap | 32;
		}
	}

	neighborhoodCount = bitmapLookupArr[ bitmap ];
	if ( neighborhoodCount === 3 || ( centerActive && neighborhoodCount === 4 ) ) {
		ret = 1;
	}
	return ret;
};

// Substantially similar logic, but putting in a separate function avoids an extra "if"
// statement (or wrapper function) in the typical render loop.
let countToroidal = function( x, y, cWidth, cHeight, dataArray ) {

	let ret = 0;
	let leftEdge = x === 0;
	let rightEdge = x === ( cWidth - 1 );
	let topEdge = y === 0;
	let bottomEdge = y === ( cHeight - 1 );
	let centerActive = false;
	let neighborhoodCount;

	if ( leftEdge ) {
		bitmap = 0;
	} else {

		// Move binary representation three cells to left, adding zeroes from the right.
		// Using the shift allows 3 array lookups for non-edge cells, instead of 9.
		bitmap = bitmap << 3;
		bitmap = bitmap & 511; // 511 = "111111111". Set all but the 9 right most digits equal to 0.
		centerActive = ( bitmap & 16 ) === 16;
	}

	// Account for wrapping behavior.
	let left = x - 1;
	let right = x + 1;
	let top = y - 1;
	let bottom = y + 1;

	if ( leftEdge ) {
		left = cWidth - 1;       // Wrap left edge over to the right.
	} else if ( rightEdge ) {
		right = 0;               // Wrap right edge over to the left.
	}
	if ( topEdge ) {
		top = cHeight - 1;       // Wrap above top over to the bottom.
	} else if ( bottomEdge ) {
		bottom = 0;              // Wrap below bottom over to the top.
	}

	// Always add cells in column to the right, for all cases, even on the edges.

	// Top right cell.
	if ( getTileFromFlatArray( right, top, cWidth, dataArray ) ) {
		bitmap = bitmap | 1;
	}

	// Right cell.
	if ( getTileFromFlatArray( right, y, cWidth, dataArray ) ) {
		bitmap = bitmap | 2;
	}

	// Bottom right cell.
	if ( getTileFromFlatArray( right, bottom, cWidth, dataArray ) ) {
		bitmap = bitmap | 4;
	}

	// Add center and left columns.
	if ( leftEdge ) {

		// Top cell.
		if ( getTileFromFlatArray( x, top, cWidth, dataArray ) ) {
			bitmap = bitmap | 8;
		}

		// Center cell.
		if ( getTileFromFlatArray( x, y, cWidth, dataArray ) ) {
			bitmap = bitmap | 16;
			centerActive = true;
		}

		// Bottom cell.
		if ( getTileFromFlatArray( x, bottom, cWidth, dataArray ) ) {
			bitmap = bitmap | 32;
		}

		// Top left cell.
		if ( getTileFromFlatArray( left, top, cWidth, dataArray ) ) {
			bitmap = bitmap | 64;
		}

		// Left cell.
		if ( getTileFromFlatArray( left, y, cWidth, dataArray ) ) {
			bitmap = bitmap | 128;
		}

		// Bottom left cell.
		if ( getTileFromFlatArray( left, bottom, cWidth, dataArray ) ) {
			bitmap = bitmap | 256;
		}
	}

	neighborhoodCount = bitmapLookupArr[ bitmap ];
	if ( neighborhoodCount === 3 || ( centerActive && neighborhoodCount === 4 ) ) {
		ret = 1;
	}
	return ret;
};

let countLiveNeighbors = countNonToroidal; // Initial setting.

player.setToroidal = function( e ) {
	if ( e.target.checked ) {
		state.player.toroidal = true;
		countLiveNeighbors = countToroidal;
	} else {
		state.player.toroidal = false;
		countLiveNeighbors = countNonToroidal;
	}
};

// Perf Testing.
// let renderNextGenPerfCounter = 0;
// let renderNextGenDuration = 0;

player.renderNextGeneration = function() {

	// Performance checking Main paint start.
	// let renderNextGenStart = performance.now();

	let currentValue, neighborCount;
	let cWidth = state.canvas.domDim.x;
	let cHeight = state.canvas.domDim.y;
	let dataArray = state.canvas.dataArray;
	let newDataArray = new Int8Array( cWidth * cHeight ); // All initially zero.
	let pixels = state.canvas.pixelBuffer;

	// Performance checking math start.
	// let arrayMathStart = performance.now();

	for ( let i = 0; i < cHeight; i += 1 ) { // Outer loop is rows.
		for ( let j = 0; j < cWidth; j += 1 ) { // Inner loop is columns.

			// A 1 (live) or 0 (dead)
			let value = countLiveNeighbors( j, i, cWidth, cHeight, dataArray );
			newDataArray[ i * cWidth + j ] = value;

			// Repeat the logic from canvas.paintBothCanvasesBitwise here to
			// avoid an separate loop through all pixels.
			// Convert 1 (live) to 0. Convert 0 (dead) to 255.
			let colorValue = 255 - ( value * 255 );

			pixels[ ( i * cWidth ) + j ] =
				( 255   << 24 ) |        /* alpha always opaque*/
				( colorValue << 16 ) |   /* blue */
				( colorValue <<  8 ) |   /* green */
				  colorValue;            /* red */
		}
	}

	canvasCtx.putImageData( state.canvas.imageData, 0, 0 );
	navCanvasCtx.putImageData( state.canvas.imageData, 0, 0 );

	// Performance checking Main paint end.
	// let renderNextGenEnd = performance.now();
	// renderNextGenDuration += renderNextGenEnd - renderNextGenStart;
	// if ( renderNextGenPerfCounter  === 59 ) {
	// 	console.log( "Avg renderNextGen: " + ( renderNextGenDuration / 60 ) + " ms." );
	// 	renderNextGenPerfCounter = 0;
	// 	renderNextGenDuration = 0;
	// }
	// renderNextGenPerfCounter += 1;

	state.canvas.dataArray = newDataArray; // Swap.

	// Increment the generation counter
	playerCounterEl.textContent = state.player.generation = state.player.generation += 1;

	// If playing, then loop.
	if ( state.player.isPlaying ) {
		if ( state.player.delay === "none" ) {
			nextFrameID = requestAnimationFrame( player.renderNextGeneration );
		} else {
			nextFrameID = w.setTimeout( function() {
				requestAnimationFrame( player.renderNextGeneration );
			}, state.player.delay );
		}
	}
};

player.pause = function() {

	// Cancel any scheduled stepAll call so that resets while playing don't step forward
	// to generation 1.
	if ( state.player.isPlaying ) {
		if ( state.player.delay === "none" ) {
			cancelAnimationFrame( nextFrameID );
		} else {
			w.clearTimeout( nextFrameID );
		}
	}
	state.player.isPlaying = false;
	playerPlayButtonEl.classList.remove( "player__play-button--is-playing" );
};

player.onPlayerClearButton = function( e ) {
	player.onResetGenerationsCounter( e );
	voidCurrentSelectedPatternLink();
	canvas.clearDataArray();
	canvas.clearMainAndNavCanvases();
};

player.onResetGenerationsCounter = function( e ) {
	if ( e && e.type === "touchstart" ) { e.preventDefault(); }
	player.pause();
	playerCounterEl.textContent = "0";
	state.player.generation = 0;
};

player.onStepButton = function( e ) {
	if ( e && e.type === "touchstart" ) { e.preventDefault(); }
	if ( state.player.isPlaying ) {
		player.pause();
	}
	voidCurrentSelectedPatternLink();
	clearAnyHash();
	player.renderNextGeneration();
};

player.play = function() {
	state.player.isPlaying = true;
	playerPlayButtonEl.classList.add( "player__play-button--is-playing" );
	voidCurrentSelectedPatternLink();
	clearAnyHash();
	player.renderNextGeneration();
};

player.onPlayStopButton = function( e ) {
	if ( e && e.type === "touchstart" ) { e.preventDefault(); }
	if ( state.player.isPlaying ) {
		player.pause();
	} else {
		player.play();
	}
};

playerToroidalInputEl.addEventListener( "change", player.setToroidal );

playerSpeedInputEl.addEventListener( "input", player.setSpeed );

playerClearButtonEl.addEventListener( "touchstart", player.onPlayerClearButton );
playerClearButtonEl.addEventListener( "mousedown", player.onPlayerClearButton );

playerResetButtonEl.addEventListener( "touchstart", player.onResetGenerationsCounter );
playerResetButtonEl.addEventListener( "mousedown", player.onResetGenerationsCounter );

playerPlayButtonEl.addEventListener( "touchstart", player.onPlayStopButton );
playerPlayButtonEl.addEventListener( "mousedown", player.onPlayStopButton );

playerStepButtonEl.addEventListener( "touchstart", player.onStepButton );
playerStepButtonEl.addEventListener( "mousedown", player.onStepButton );

//*******************************************
//*******
//******* ---- Patterns ----
//*******
//*******************************************

let voidCurrentSelectedPatternLink = function() {
	let currentSelectedLink = state.patterns.currentSelectedLink;
	if ( currentSelectedLink ) {
		currentSelectedLink.parentNode.classList.remove( "pat--selected", "pat--loading" );
		state.patterns.currentSelectedLink = null;
	}
};

// Patterns need room to breathe.
// Canvas of an imported pattern that doesn't have a minCanvasX or minCanvasY properties
// should be at least three times the core pattern dimensions on that side, with a
// minimum value based on viewport media query.
// (This helps keep small patterns fast on mobile.)
// If the pattern includes minimum dimensions and/or offset values for positioning,
// use those.
let addPatternMargins = function( patPixArray, patWidth, patHeight,
                                  minCanvasX, minCanvasY, offsetX, offsetY ) {

	let minMargin = w.browser.isBig ? 200 : 80;
	let outputWidth = minCanvasX || Math.max( patWidth * 3, minMargin );
	let outputHeight = minCanvasY || Math.max( patHeight * 3, minMargin );
	let newPixArray = new Int8Array( outputWidth * outputHeight ); // All zeros initially
	let len = patWidth * patHeight;
	let curX, curY;

	// Use any pixel offset if supplied, otherwise calculate
	// Validate offset values.
	if ( !ut.isNonNegativeInteger( offsetX ) ) {
		offsetX = Math.floor( ( outputWidth - patWidth ) / 2 ); // Default to centered
	}
	if ( !ut.isNonNegativeInteger( offsetY ) ) {
		offsetY = Math.floor( ( outputHeight - patHeight ) / 2 );
	}

	for ( let i = 0; i < len; i += 1 ) {
		curX = i % patWidth;
		curY = Math.floor( i / patWidth );
		newPixArray[ ( curY + offsetY ) * outputWidth + curX + offsetX ] = patPixArray[ i ];
	}

	return {
		dataArray: newPixArray,
		width: outputWidth,
		height: outputHeight
	};
};

let redrawCanvasFromDataArray = function( dataArray, width, height ) {

	// Don't reset generations counter here, because might be canvas resizing.
	// Don't transition-zoom.
	canvasEl.classList.remove( "main-canvas--transition-scale" );
	canvas.setCanvasDim( width, height );
	state.canvas.dataArray = dataArray;
	canvas.paintBothCanvasesBitwise();

	w.requestAnimationFrame( function() {
		canvas.handleFitZoom();
		canvasEl.classList.add( "main-canvas--transition-scale" );
	} );
};

 /**
	* @param {object} d - The JSON
	* @param {Boolean} addMargin - Whether or not additional margins should be considered.
	*/
let loadPatternJSONToCanvas = function( d, addMargin ) {
	let patternStr = d.pattern;
	let width = d.width;
	let height = d.height;
	let minCanvasX = d.minCanvasX;
	let minCanvasY = d.minCanvasY;
	let offsetX = d.offsetX;
	let offsetY = d.offsetY;
	let isToroidal = !!d.toroidal;

	if ( !patternStr ) {
		console.log( "Pattern file parse error" );
	}

	let pixelArray = parseRLEPixelString( patternStr, width, height );
	let marginAddedObj;

	// Add margins for included JSON patterns.
	if ( addMargin ) {
		marginAddedObj = addPatternMargins( pixelArray, width, height,
	                                        minCanvasX, minCanvasY, offsetX, offsetY );
	  pixelArray = marginAddedObj.dataArray;
	  width = marginAddedObj.width;
	  height = marginAddedObj.height;
	}

	redrawCanvasFromDataArray( pixelArray, width, height );
	player.onResetGenerationsCounter();

	playerToroidalInputEl.checked = isToroidal; // Set on DOM element. Doesn't fire a change event.
	state.player.toroidal = isToroidal;
	countLiveNeighbors = isToroidal ? countToroidal : countNonToroidal;
};

let onPatternLinkClick = function( e ) {
	e.preventDefault(); // Always for both touch and mouse.

	// Hide any mobile UI.
	// patternsPanelEl.classList.remove( "patterns--mobile-show" );
	// patternsButtonMobileEl.classList.remove( "panel__button--selected" );

	openCloseMobileFlyouts(); // Don't need to pass e. Calling w/o arguments closes everything.

	let patternListItem = this.parentNode;

	player.pause(); // Stop any current animation.
	canvas.clearMainAndNavCanvases();

	voidCurrentSelectedPatternLink();

	// Remove loading class from all other pattern list items.
	for ( let i = 0; i < patternsListItemEls.length; i += 1 ) {
		patternsListItemEls[ i ].classList.remove( "pat--loading" );
	}
	patternListItem.classList.add( "pat--selected", "pat--loading" );

	// Store for comparison when XHR returns, and also for removing classes.
	state.patterns.currentSelectedLink = this;

	fetch( this.href )
	.then( function( response ) {

		// Unlike jQuery.AJAX(), 404 errors do not reject in fetch.
		// Must check for these manually.
		if ( !response.ok ) {
			let error = new Error( response.statusText );
			error.response = response;
			throw error;
		} else {
			return response;
		}
	} ).then( function( response ) {

		// Patterns may return from the network out of the order clicked on.
		if ( response.url !== state.patterns.currentSelectedLink.href ) {
			return Promise.reject( "Pattern loaded was not the most recently clicked" );
		}

		// Get relative path from absolute and drop the extension.
		// Sanity check as there are probably some typos in markup.
		let fileName = response.url.split( "/" ).pop();
		if ( fileName.slice( -5 ) === ".json" ) {
			fileName = fileName.slice( 0, -5 );
			w.history.replaceState( undefined, undefined, "#" + fileName );
			return response.json();
		} else {
			return Promise.reject( "Response didn't have a '.json' extension" );
		}
	} ).then( function( json ) {

		loadPatternJSONToCanvas( json, true );
	} ).catch( function( error ) {

		// Catch and log any error that has happened along the way.
		console.log( "error:", error );
	} ).then( function() {

		// Always remove the "loading" class when the promise is settled
		// and no longer pending, in all cases.
		patternListItem.classList.remove( "pat--loading" );
	} );
};

// Attach delegated event handler for patterns.
// Don't listen for touchstart because the link list needs to be scrollable.
Gator( patternsWrapperEl ).on( "click", ".pat__link", onPatternLinkClick );

//*******************************************
//*******
//******* ---- All Modals ----
//*******
//*******************************************

Modal.modalSetOpenState = function( bool ) {
	state.isModalOpen = bool;
};

//*******************************************
//*******
//******* ---- Canvas Size Modal ----
//*******
//*******************************************

modalCanvasSize.modalBeforeOpen = function() {
	this.currentCanvasWidth = state.canvas.domDim.x;
	this.currentCanvasHeight = state.canvas.domDim.y;
};
modalCanvasSize.modalSubmit = function() {
	canvas.handleResize( this.newWidth, this.newHeight,
	                     this.resizeIconPositionX, this.resizeIconPositionY );
};
modalCanvasSize.init( infoCanvasSizeButtonEl );

//*******************************************
//*******
//******* ---- Pattern Open Modal ----
//*******
//*******************************************

modalOpenPattern.modalSubmit = function() {
	let fileExt = this.fileExtension;
	let pat = this.parsedPattern;

	// The selected file should already be parsed by the time the user clicks "OK" in modal.
	// (We don't currently check for this asynchronicity.)
	// Don't ever add any margins to patterns loaded externally.

	// Text files have RLE string for pattern property.
	if ( fileExt === "JSON" || fileExt === "RLE" ) {
		loadPatternJSONToCanvas( pat, false );
	} else if ( fileExt === "BMP" ) {

		// BMP files have data array for pixels property.
		redrawCanvasFromDataArray( pat.pixels, pat.width, pat.height );
	}

	voidCurrentSelectedPatternLink();
	clearAnyHash();
	player.onResetGenerationsCounter();
	w.history.replaceState( undefined, undefined, w.location.pathname );
};

modalOpenPattern.init( patternsOpenButtonEl );

//*******************************************
//*******
//******* ---- Pattern Save Modal ----
//*******
//*******************************************

modalSavePattern.modalSubmit = function() {
	let fileFormatEl = doc.querySelector( "[data-modal-save-file-format]" );
	let patternNameEl = doc.querySelector( "[data-modal-save-pattern-name]" );
	let patternAuthorEl = doc.querySelector( "[data-modal-save-pattern-author]" );
	let suppliedPatternName = patternNameEl.value;
	let usedPatternName = suppliedPatternName || "my-lifey-pattern";
	let fileType = fileFormatEl.value;
	let outputStr;

	let orderedPatternForJSON = Object.create( null );
	let patternObj = dataArrayToRLE( state.canvas.dataArray,
	                                 state.canvas.domDim.x, state.canvas.domDim.y );

	// Add the properties to the new object in the order they should be printed.
	if ( suppliedPatternName ) {
		orderedPatternForJSON.name = suppliedPatternName;
	}
	if ( patternAuthorEl.value ) {
		orderedPatternForJSON.author = patternAuthorEl.value;
	}
	orderedPatternForJSON.width = patternObj.width;
	orderedPatternForJSON.height = patternObj.height;
	orderedPatternForJSON.minCanvasX = patternObj.minCanvasX;
	orderedPatternForJSON.minCanvasY = patternObj.minCanvasY;
	orderedPatternForJSON.offsetX = patternObj.offsetX;
	orderedPatternForJSON.offsetY = patternObj.offsetY;
	orderedPatternForJSON.pattern = patternObj.pattern;

	if ( fileType === "json" ) {
		outputStr = JSON.stringify( orderedPatternForJSON, null, "\t" );
	} else if ( fileType === "rle" ) {
		outputStr = patToRleFileString( orderedPatternForJSON );
	}

	saveTextAsFile( outputStr, usedPatternName + "." + fileType );
};

modalSavePattern.init( patternsSaveButtonEl );

//*******************************************
//*******
//******* ---- Pattern Share Modal ----
//*******
//*******************************************

// Runs after innerMarkup has been added. Not really a binding in this case, but can use.
modalSharePattern.modalInternalBinding = function() {
	let modalSharePatternFitsEl = doc.querySelector( ".pattern-fits-in-url" );
	let urlDivEl = doc.querySelector( "[data-modal-shareable-url]" );
	let cWidth = state.canvas.domDim.x;
	let cHeight = state.canvas.domDim.y;
	let baseURL = w.location.href;
	let patRLEObj = dataArrayToRLE( state.canvas.dataArray, cWidth, cHeight );
	let msg, linkURL;

	// If sharing a pattern from the library, don't use query string data.
	if ( state.patterns.currentSelectedLink ) {
		linkURL = baseURL;
	} else {
		linkURL = baseURL + "#" + ut.serializeToQueryString( patRLEObj );
	}

	if ( !linkURL || linkURL.length > 4000 ) {
		msg = "Sorry, but your pattern is too large to be shared in a URL." +
		      " Please consider saving to a JSON or RLE text file instead." +
		      " You can also right-click directly on the canvas to save it as a PNG.";
		urlDivEl.classList.add( "hide-url" );

	} else {
		msg = "The following URL is a permanent, shareable link to the current pattern." +
		      " It has been copied to your system clipboard.";
		urlDivEl.innerHTML = linkURL;
		urlDivEl.focus();
		ut.copyTextToClipBoard( linkURL );
	}

	modalSharePatternFitsEl.innerHTML = msg;
};

modalSharePattern.init( patternsShareButtonEl );

//*******************************************
//*******
//******* ---- Keyboard Shortcuts ----
//*******
//*******************************************

// Keymaster defines shortcuts within a particular "scope" that corresponds to an area of a
// single page app. Lifey currently has two areas: "main" and "modal". Nearly all general
// keyboard shortcuts are disabled in the modal view.
key.setScope( "main" ); // Keymaster default scope is "all".

// By default, Keymaster doesn't process shortcuts when INPUT, SELECT, or
// TEXTAREA elements are focused. Loosen this restriction to allow shortcuts
// to work when INPUT elements are focused.
key.filter = function( event ) {
	var tagName = ( event.target || event.srcElement ).tagName;
	return !( tagName == "SELECT" || tagName == "TEXTAREA" );
};

// Kill all repeated key events.
bodyEl.addEventListener( "keydown", function( e ) {
	if ( e.repeat ) { return false; }
} );

// ---- Toolbox Shortcuts ----

// Shift key switches toolbox to the hand tool until the key is released.
key( "shift", "main", function() {
	bodyEl.classList.add( "shift-depressed" );
	state.toolbox.override = "hand";
} );

// Keyup must be done manually without Keymaster.
bodyEl.addEventListener( "keyup", function( e ) {
	if ( e.which === 16 ) {
		bodyEl.classList.remove( "shift-depressed" );
		state.toolbox.override = null;
	}
} );

key( "b", "main", function() {
	setToolboxTool( "brush" );
} );

key( "e", "main", function() {
	setToolboxTool( "eraser" );
} );

key( "h", "main", function() {
	setToolboxTool( "hand" );
} );

key( "z", "main", function() {
	setToolboxTool( "zoom-in" );
} );

// ---- Zoom Shortcuts ----

// Plus key.
key( browser.shortkey + "+=", "main", function( e ) {
  e.preventDefault();

  // Treat keyboard-shortcut-initiated zooms as occurring at center of the visible innerView.
  // Synthesize an event property on them for simplicity.
  e.pageX = state.innerView.visibleWidth / 2;
	e.pageY = state.innerView.visibleHeight / 2;
  canvas.handleIncrementalZoom( e, "zoom-in" );
} );

// Minus key.
key( browser.shortkey + "+-", "main", function( e ) {
  e.preventDefault();
  e.pageX = state.innerView.visibleWidth / 2;
	e.pageY = state.innerView.visibleHeight / 2;
  canvas.handleIncrementalZoom( e, "zoom-out" );
} );

// Zero key.
key( browser.shortkey + "+0", "main", function( e ) {
  e.preventDefault();
  canvas.handleFitZoom();
} );

// ---- Player Shortcut ----

// As in video software, space bar plays/pauses.
key( "space", "main", function() {
	player.onPlayStopButton();
} );

// ---- Hide Panels Shortcut ----

// Tab key.
key( "tab", "main", function() {
	bodyEl.classList.toggle( "hide-panels" );
	return false;
} );

// ---- Modal Shortcuts ----

// Treat hitting "enter" as clicking "ok".
key( "enter", "modal", function( e ) {
	doc.querySelector( "[data-modal-ok]" ).click();
} );

//*******************************************
//*******
//******* ---- Hash Management ----
//*******
//*******************************************

let clearAnyHash = function() {
	if ( w.location.hash ) {
		w.history.replaceState( undefined, undefined, w.location.pathname );
	}
};

//*******************************************
//*******
//******* ---- Fullscreen API
//*******
//*******************************************

requestFullscreenButtonEl.addEventListener( "click", function( e ) {
	let requestFullScreen = htmlEl.requestFullscreen ||
	                        htmlEl.mozRequestFullScreen ||
                          htmlEl.webkitRequestFullScreen;

	requestFullScreen.call( htmlEl );
} );

exitFullscreenButtonEl.addEventListener( "click", function( e ) {
	let exitFullScreen = doc.exitFullscreen ||
	                     doc.mozCancelFullScreen ||
                       doc.webkitExitFullscreen;

	exitFullScreen.call( doc );
} );

//*******************************************
//*******
//******* ---- Refresh from Standalone
//*******
//*******************************************

let mobileRefreshEl = doc.querySelector( ".mobile-menu__refresh" );

mobileRefreshEl.addEventListener( "click", function( e ) {
	e.preventDefault();
	w.location = "https://bellandwhistle.net/lifey";

} );

//*******************************************
//*******
//******* ---- Mobile-only UI
//*******
//*******************************************

let onPointerStartAnyPanelButton = function( e ) {
	if ( e.type === "touchstart" ) {
		e.preventDefault();

		// :active styling is screwed up on FF for Android.
		// Manually add and remove classes instead. :/
		this.classList.add( "panel__button--touch-pressed" );
	}
	openCloseMobileFlyouts( e, this );
};

let onTouchEndAnyPanelButton = function( e ) {
	e.preventDefault();
	this.classList.remove( "panel__button--touch-pressed" );
};

let openCloseMobileFlyouts = ( function() {
	let activeFlyout;
	let flyoutTargets = {
		"meter": {
			"buttonEl": meterButtonMobileEl,
			"targetEl": playerPanelEl,
			"className": "player--mobile-show-speed"
		},
		"menu": {
			"buttonEl": menuButtonMobileEl,
			"targetEl": playerPanelEl,
			"className": "player--mobile-show-toroidal"
		},
		"patterns": {
			"buttonEl": patternsButtonMobileEl,
			"targetEl": patternsPanelEl,
			"className": "patterns--mobile-show"
		}
	};

	return function( e, button ) {

		// Could be "meter", "menu", "patterns" or undefined.
		let pointeredStr;

		if ( button ) {
			pointeredStr = button.getAttribute( "data-mobile-button" );
		}

		// Unified closing logic:
		// If the clicked button is currently active, close it and return.
		// If another flyout is active, close it.
		if ( activeFlyout ) {
			let activeTarget = flyoutTargets[ activeFlyout ];
			activeTarget.buttonEl.classList.remove( "panel__button--selected" );
			activeTarget.targetEl.classList.remove( activeTarget.className );

			// If clicked button was currently active, get out.
			if ( pointeredStr && pointeredStr === activeFlyout ) {
				activeFlyout = undefined;
				return;
			}
			activeFlyout = undefined; /* May be overridden below. */
		}

		// Opening logic:
		if ( button ) {
			let pointeredTarget = flyoutTargets[ pointeredStr ];
			if ( !pointeredTarget ) { return; }
			pointeredTarget.buttonEl.classList.add( "panel__button--selected" );
			pointeredTarget.targetEl.classList.add( pointeredTarget.className );
			activeFlyout = pointeredStr;
		}
	};

}() );

// This works on all panel buttons everywhere. So canvas size, save as, share buttons all
// close any current flyout.
Gator( bodyEl ).on( [ "touchstart", "click" ], ".panel__button", onPointerStartAnyPanelButton );

// Hamburger menu item click should close the hamburger menu.
// Use click instead of touchstart here to reduce glitching on the menu item handlers,
// which fire on touchstart.
Gator( playerToroidalWrapperEl ).on( "click", ".mobile-menu__item", openCloseMobileFlyouts );

Gator( bodyEl ).on( "touchend", ".panel__button", onTouchEndAnyPanelButton );

// On touch, tapping tortoise/hare should increment/decrement the input range slider.
Gator( playerSpeedEl ).on( "touchstart", "svg", function( e ) {
	let val = this.classList.contains( "player__tortoise" ) ? -1 : 1;
	player.setSpeed( null, parseInt( playerSpeedInputEl.value, 10 ) + val );
} );

//*******************************************
//*******
//******* ---- Scrollbar Styles for Firefox
//*******
//*******************************************

// Firefox currently doesn't support CSS on scrollbars.
// Use overlaid dummy elements and CSS mix-blend-mode to style.
// This is gross but it's better than either of the alternatives.

let addFirefoxScrollStyleElements = function() {

	let widthInvert = doc.createElement( "div" );
	let widthLighter = doc.createElement( "div" );
	let heightInvert = doc.createElement( "div" );
	let heightLighter = doc.createElement( "div" );
	let cornerBox = doc.createElement( "div" );

	let heightInvertPatterns, heightLighterPatterns, heightSingleLine;

	widthInvert.classList.add(   "ff-scroll", "ff-scroll--horizontal", "ff-scroll--invert" );
	widthLighter.classList.add(  "ff-scroll", "ff-scroll--horizontal", "ff-scroll--lighter" );
	heightInvert.classList.add(  "ff-scroll", "ff-scroll--vertical",   "ff-scroll--invert" );
	heightLighter.classList.add( "ff-scroll", "ff-scroll--vertical",   "ff-scroll--lighter" );

	cornerBox.classList.add( "ff-scroll", "ff-scroll-corner" );

// Clone a full-height set for the patterns panel.
	heightInvertPatterns = heightInvert.cloneNode();
	heightInvertPatterns.classList.add( "ff-scroll--full-height" );
	heightLighterPatterns = heightLighter.cloneNode();
	heightLighterPatterns.classList.add( "ff-scroll--full-height" );

// Divs on the main background need to save room for a corner.
	widthInvert.classList.add( "ff-scroll--horizontal-with-corner" );
	widthLighter.classList.add( "ff-scroll--horizontal-with-corner" );
	heightInvert.classList.add( "ff-scroll--vertical-with-corner" );
	heightLighter.classList.add( "ff-scroll--vertical-with-corner" );

	heightSingleLine = doc.createElement( "div" );
	heightSingleLine.classList.add( "ff-scroll", "ff-scroll--vertical",
	                                "ff-scroll--full-height",
	                                "ff-scroll--single-line" );

	// Main panels need to sit in front of the FF color-flipping divs
	// otherwise there are weird compositing glitches.
	bodyEl.insertBefore( widthInvert,   toolboxEl );
	bodyEl.insertBefore( widthLighter,  toolboxEl );
	bodyEl.insertBefore( heightInvert,  toolboxEl );
	bodyEl.insertBefore( heightLighter, toolboxEl );
	bodyEl.insertBefore( cornerBox,     toolboxEl );

	patternsOuterWrapperEl.appendChild( heightInvertPatterns );
	patternsOuterWrapperEl.appendChild( heightLighterPatterns );

	// Black 1px line prevents an occasional weird white line from rendering.
	patternsOuterWrapperEl.appendChild( heightSingleLine );
};

if ( w.browser.isFirefox ) {
	addFirefoxScrollStyleElements();
}

	// No way to disable browser-level zoom in Firefox. Rebuild styles on both load and resize.
// Add rules to existing stylesheet to indent desktop toolbars on the right by the scrollbar width.
let writeScrollbarDependentRules = function() {

	let rulesLength = scrollSs.cssRules.length;
	for ( let i = 0; i < rulesLength; i += 1 ) { scrollSs.deleteRule( 0 ); }

	// Always on page load for all browsers.
	scrollSs.insertRule( ".panel--right { right: " + state.scrollbarDim + "px;}", 0 );

	if ( w.browser.isFirefox ) {
		scrollSs.insertRule( ".ff-scroll--horizontal {" +
		                     "height: " + state.scrollbarDim + "px;", 1 );

		scrollSs.insertRule( ".ff-scroll--vertical  {" +
		                     "width: " + state.scrollbarDim + "px;", 2 );

		scrollSs.insertRule( ".ff-scroll--horizontal-with-corner {" +
		                     "width: calc(100% - " + state.scrollbarDim + "px);}", 3 );

		scrollSs.insertRule( ".ff-scroll--vertical-with-corner {" +
		                     "height: calc(100% - " + state.scrollbarDim + "px);}", 4 );

		scrollSs.insertRule( ".ff-scroll-corner { width: " + state.scrollbarDim + "px;" +
		                     "height: " + state.scrollbarDim + "px);}", 5 );

	}
};

//*******************************************
//*******
//******* ---- Master Window Resize Handler
//*******
//*******************************************

// Refer to different padding values in base.SCSS starting at line 46.
let deriveViewportDependentConstants = function() {

	// Track mobile vs desktop state, for layout math.
	// Current this is only needed to deal with changing scrollbars and padding.
	w.browser.isBig = false;
	state.canvas.zoomPadding = 100;

	// These breakpoints must match the breakpoints on line 17 of "_vars.scss"
	if ( w.matchMedia( "(min-width: 790px) and (min-height: 600px)" ).matches ) {
		state.canvas.zoomPadding = 200;
		w.browser.isBig = true;

		// Don't track mouse cursor position if we're not actually showing it.
		canvasEl.addEventListener( "mouseenter", handleCoordinatesEnter );
	}

	// Scrollbar CSS pixel thickness varies between browsers and sometimes zoom levels.
	state.scrollbarDim = outerBgEl.offsetWidth - outerBgEl.clientWidth;
};

let onWindowResize = function() {
	deriveViewportDependentConstants();
	if ( w.browser.isFirefox ) {
		writeScrollbarDependentRules();
	}
	innerView.onResize();
};

//*******************************************
//*******
//******* ---- On Window Load ----
//*******
//*******************************************

// Some CSS values can't be read and stored reliably until the load event.
// Wait, otherwise scaling doesn't work reliably on the initial canvas.
( function() {

	let splashTimeout;

	let loadBlankCanvasBasedOnViewportDimensions = function() {

		let initialWidth, initialHeight;

		// 80% of the available viewport on desktop. More tightly fitted on mobile.
		if ( w.browser.isBig ) {
			initialWidth = Math.floor( state.innerView.visibleWidth * 0.8 /
		                             state.canvas.scale );
			initialHeight = Math.floor( state.innerView.visibleHeight * 0.8 /
		                              state.canvas.scale );
		} else {
			initialWidth = Math.floor( ( state.innerView.visibleWidth - 30 ) /
		                             state.canvas.scale );
			initialHeight = Math.floor( ( state.innerView.visibleHeight - 30 ) /
		                              state.canvas.scale );
		}
		canvas.setCanvasDim( initialWidth, initialHeight );
		canvas.clearDataArray(); // Data Array based on canvas dim state so must come after.
	};

	let loadInitialCanvas = function() {
		let hash = w.location.hash.slice( 1 ); // Remove "#"
		let link = doc.querySelector( "[href='pat/" + hash + ".json']" );
		let qsObj = ut.deserializeQueryString( hash );

		// Show the red navigator outline;
		navOutlineEl.classList.remove( "navigator__canvas-outline--hidden" );

		// First try parsing as a query string.
		if ( qsObj && qsObj.pattern && qsObj.width && qsObj.height )   {

			// Query string might be malformed or mistyped etc. Fall through to blank canvas.
			try {
				loadPatternJSONToCanvas( qsObj, true ); // Do add margins in queryString.
			} catch ( e ) {
				console.log( "Error parsing query string: ", e );
				loadBlankCanvasBasedOnViewportDimensions();
			}

		// Else if hash is a named pattern for which a pattern link exists, "click" that link.
		} else if ( link ) {
			link.click();
		} else {
			loadBlankCanvasBasedOnViewportDimensions();
		}

		// Add innerView listeners once canvas exists.
		/// Firefox on Android fires mysterious early resize events.
		w.addEventListener( "resize", ut.debounce( onWindowResize, 80 ) );
		outerBgEl.addEventListener( "scroll", ut.throttleRaf( innerView.onScroll ) );

		// Drag-scroll work natively on touch, in order to get silky inertial scrolling.
		// Thus no need to bind a touchstart handler.
		innerViewEl.addEventListener( "mousedown", innerView.onPointerDown );

	};

	let hideSplash = function( e ) {
		if ( e ) { e.preventDefault(); }
		clearTimeout( splashTimeout );
		splashEl.removeEventListener( "touchstart", hideSplash );
		splashEl.removeEventListener( "click", hideSplash );
		splashEl.parentNode.removeChild( splashEl );
		loadInitialCanvas();
	};

	let onPageLoad = function() {

		// Init: Read the rateInput value off of the slider.
		// Preserves slider state across cached page reload.
		player.setSpeed( undefined, playerSpeedInputEl.value );

		// Get scrollbar size and zoom padding dims and set in state.
		// This must come before the innerView calcs.
		deriveViewportDependentConstants();
		writeScrollbarDependentRules();

		// Sets the state.innerView.visibleWidth based on viewport and scrollbar thickness.
		innerView.getVisibleDimensions();

		// Width and visibleWidth states will initially be equal.
		state.innerView.width = state.innerView.visibleWidth;
		state.innerView.height = state.innerView.visibleHeight;

		// Needed for resize handle hover areas to be placed correctly.
		patternPanel.recordComputedStyle();

		if ( browser.cutsMustard ) {
			if ( w.location.hash ) {
				hideSplash(); // Go directly when a hash is being shared.
			} else {
				splashTimeout = w.setTimeout( hideSplash, 2500 );

				// For the impatient, allow clicking past the initial splash screen.
				splashEl.addEventListener( "touchstart", hideSplash );
				splashEl.addEventListener( "click", hideSplash );
			}
		}

		w.removeEventListener( "load", onPageLoad );
	};

	if ( doc.readyState === "complete" ) {
		onPageLoad();
	} else {
		w.addEventListener( "load", onPageLoad );
	}
}() );

//*******************************************
//*******
//******* ---- Expose on the window for Testing ----
//*******
//*******************************************

// Uglify should automatically rip the block below out for 'grunt prod' builds.
// http://philipwalton.com/articles/how-to-unit-test-private-functions-in-javascript/
// https://github.com/petehunt/webpack-howto
// Note that this line will throw a "condition always true" warning
// in webpack dev builds.
if ( __DEV__ ) {
	w.Flingable = function() { return Flingable; };
	w.Resizable = function() { return Resizable; };
	w.ut = function() { return ut; };
	w.Modal = function() { return Modal; };
	w.modalCanvasSize = function() { return modalCanvasSize; };
	w.modalOpenPattern = function() { return modalOpenPattern; };
	w.modalSavePattern = function() { return modalSavePattern; };
	w.modalSharePattern = function() { return modalSharePattern; };
	w.parseRLEPixelString = function() { return parseRLEPixelString; };
	w.parseBMP = function() { return parseBMP; };
	w.patToRleFileString = function() { return patToRleFileString; };
	w.dataArrayToRLE = function() { return dataArrayToRLE; };
	w.saveTextAsFile = function() { return saveTextAsFile; };

	w.state = function() { return state; };
	w.innerView = function() { return innerView; };
	w.canvas = function() { return canvas; };
}
