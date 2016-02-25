// Flingable
define( function() {

return {

	initFlingable: function( elem, opts ) {
		this.element = elem;
		this.background = document.querySelector( ".outer-background" );
		this.flingCoast = false; // Default
		if ( opts ) {
			this.flingCoast = !!opts.coast;
			if ( opts.flingFriction ) {
				this.flingFriction = opts.flingFriction;
			}
			if ( opts.flingHandleEl ) {
				this.flingHandleEl = opts.flingHandleEl;
			}
			if ( opts.flingContainer ) {
				this.flingContainer = Object.create( null );
				this.flingContainer.element = opts.flingContainer;
				this.flingContainer.css = Object.create( null );
			}
		}

		// Initial properties specific to the instance.
		if ( !this.css ) {
			this.css = Object.create( null );
		}
		this.isFlingDragging = false;
		this.isFlingMoving = false;
		this.flingDragPositionX = 0;
		this.flingDragPositionY = 0;

		this.flingPositionX = 0;
		this.flingPositionY = 0;
		this.flingVelocityX = 0;
		this.flingVelocityY = 0;
		this.flingAccelX = 0;
		this.flingAccelY = 0;

		// Create bound local reference for all the prototype handler methods  :/
		this.flingMouseDown = this.flingMouseDown.bind( this );
		this.flingMouseMove = this.flingMouseMove.bind( this );
		this.flingMouseUp = this.flingMouseUp.bind( this );

		var elemToListenOn = this.element;
		if ( this.flingHandleEl ) {
			elemToListenOn = this.flingHandleEl;
		}

		elemToListenOn.addEventListener( "mousedown", this.flingMouseDown );

		return this; // Make chainable.
	},

	// On the prototype, figure out if unprefixed 2D Transforms are supported.
	// If not, check for prefix support.
	transformProp: ( function( w ) {
		var htmlElStyle = w.getComputedStyle( document.documentElement );
		var prefixArr = [ "webkit", "ms" ];
		var prefixProp;
		if ( "transform" in htmlElStyle ) {
			return "transform";
		}
		for ( var i = 0; i < 2; i += 1 ) {
			prefixProp = prefixArr[ i ] + "Transform";
			if ( prefixProp in htmlElStyle ) {
				return "-" + prefixArr[ i ] + "-transform";
			}
		}
	}( window ) ),

	flingMouseDown: function( event ) {
		event.preventDefault();

		// Don't fling if this is a resize.
		if ( this.rzblHoveringEdge ) {
			return;
		}

		this.element.classList.add( "panel--is-flinging" );
		this.background.classList.add( "panel--is-flinging" );

		// Container may have changed dimensions since init, e.g. viewport resize.
		this.measureContainers();

		// Get drag start positions.
		this.flingPageStartX = event.pageX;
		this.flingPageStartY = event.pageY;

		// The flingDragPosition may reflect the last mouseup position,
		// not the final resting place, and thus needs to be updated.
		this.flingItemBeginX = this.flingDragPositionX = this.flingPositionX;
		this.flingItemBeginY = this.flingDragPositionY = this.flingPositionY;

		this.isFlingDragging = this.isFlingMoving = true;

		// Start a rAF animation loop
		this.flingAnimate();

		// Catch all mouse activity, even outside the browser viewport.
		window.addEventListener( "mousemove", this.flingMouseMove );
		window.addEventListener( "mouseup", this.flingMouseUp );
	},

	flingMouseMove: function( event ) {

		// Mousemove updates the flingDragPosition, which is one event ahead of the
		// flingPosition. The difference between the two is what generates the
		// velocity calculations around line 263. The velocity, adjusted for drag,
		// is then applied to the flingPosition, which is what is rendered out.
		var moveX = event.pageX - this.flingPageStartX;
		var moveY = event.pageY - this.flingPageStartY;

		this.flingDragPositionX = this.flingItemBeginX + moveX;
		this.flingDragPositionY = this.flingItemBeginY + moveY;
	},

	flingMouseUp: function() {
		this.isFlingDragging = false;

		if ( !this.flingCoast ) {
			this.isFlingMoving = false; // Stop the animation.
			this.flingVelocityX = this.flingVelocityY = 0;
		}

		this.element.classList.remove( "panel--is-flinging" );
		this.background.classList.remove( "panel--is-flinging" );

		window.removeEventListener( "mousemove", this.flingMouseMove );
		window.removeEventListener( "mouseup", this.flingMouseUp );
	},

	flingAnimate: function() {

		var that = this;
		if ( !this.isFlingMoving || ( !this.isFlingDragging && !this.flingCoast ) ) {

			// Animation is over, update the final boundingRect.
			this.css.boundRect = this.element.getBoundingClientRect();
			return;
		}
		this.applyDragForce();

		// Containment option.
		if ( this.flingContainer ) {
			this.flingPositionX = this.containFling( "x", this.flingPositionX );
			this.flingPositionY = this.containFling( "y", this.flingPositionY );
		}

		this.renderFling();

		requestAnimationFrame( function() {
			that.flingAnimate();
		} );
	},

	renderFling: function() {

		// Round the final translation numbers to three decimal places when it stops.
		this.flingPositionX = Math.round( this.flingPositionX * 1000 ) / 1000;
		this.flingPositionY = Math.round( this.flingPositionY * 1000 ) / 1000;

		var str = "translate(" + this.flingPositionX + "px, " +
		                         this.flingPositionY + "px)";
		if ( this.scale ) {
			str += " scale(" + this.scale + ")";
		}
		this.element.style[ this.transformProp ] = str;

		// Store the properties
		this.css.translateX = this.flingPositionX;
		this.css.translateY = this.flingPositionY;
	},

	flingFriction: 0.93,

	applyDragForce: function() {
		if ( this.isFlingDragging ) {

			// Change the position to drag position by applying force to acceleration
			var flingVelocityX = this.flingDragPositionX - this.flingPositionX;
			var flingForceX = flingVelocityX - this.flingVelocityX;

			var flingVelocityY = this.flingDragPositionY - this.flingPositionY;
			var flingForceY = flingVelocityY - this.flingVelocityY;

			this.flingAccelX += flingForceX;
			this.flingAccelY += flingForceY;
		}

		this.flingVelocityX += this.flingAccelX;
		this.flingVelocityX *= this.flingFriction;
		this.flingPositionX += this.flingVelocityX;

		this.flingVelocityY += this.flingAccelY;
		this.flingVelocityY *= this.flingFriction;
		this.flingPositionY += this.flingVelocityY;

		// If the last update was miniscule, set isMoving to break the rAF loop.
		if ( Math.abs( this.flingVelocityX ) < 0.001 &&
		     Math.abs( this.flingVelocityY ) < 0.001 &&
		    !this.isFlingDragging ) {
			this.isFlingMoving = false;
		}

		this.flingAccelX = 0;
		this.flingAccelY = 0;
	},

	measureContainers: function() {
		this.css.boundRect = this.element.getBoundingClientRect();

		// Note: getBoundingClientRect is with transforms applied.
		// offset positions are without transforms applied.
		this.css.offsetTop = this.element.offsetTop;
		this.css.offsetLeft = this.element.offsetLeft;

		if ( this.flingContainer && this.flingContainer.element ) {
			this.flingContainer.css.boundRect = this.flingContainer.element.getBoundingClientRect();
		}
	},

	// Axis is 'x' or 'y' string, drag is numeric value
	containFling: function( axis, drag ) {
		let span = axis === "x" ? "width" : "height";
		let offsetDirection = axis === "x" ? "Left" : "Top";

		let min = -1 * this.css[ "offset" + offsetDirection ];
		let max = this.flingContainer.css.boundRect[ span ] - this.css.boundRect[ span ] + min;

		return Math.min( max, Math.max( min, drag ) );
	}
};
} );
