define( [ "Utility", "gator" ], function( ut, Gator ) {

	// Every button should have an :after pseudo-element tooltip prebuilt in CSS.
	( function() {
		let inspectingTooltips = false;
		let waitingPeriod;
		let allowanceInterval;
		let elementStack = [];

		Gator( document.body ).on( "mouseover", ".panel__button", function( e ) {

			// Technically unnecessary but DOM call seems to suppress glitching.
			if ( this.classList.contains( "panel__button--show-tooltip" ) ) {
				return;
			}

			let button = this;

			// Once tooltips are shown, allow the user to scan quickly between tooltips
			// without delay
			let delay = 1000;
			if ( inspectingTooltips ) {
				delay = 0;
			}

			// Throttle multiple mouseover events.
			clearTimeout( waitingPeriod );

			// Still inspecting, don't set false yet
			clearTimeout( allowanceInterval );

			waitingPeriod = setTimeout( function() { addTooltip( button ); }, delay );
			button.addEventListener( "mouseleave", abortTooltip );
		} );

		let addTooltip = function( buttonElem ) {
			inspectingTooltips = true;
			waitingPeriod = null;

			// Tooltips need to float above any adjacent panels, so
			// move the current panel to the stop of the stack.
			var parentPanel = ut.getClosest( buttonElem, ".panel" );
			shufflePanelStack( parentPanel );

			buttonElem.classList.add( "panel__button--show-tooltip" );
		};

		let abortTooltip = function() {

			// In case the mouse darts in and out, before the tooltip is ever shown.
			clearTimeout( waitingPeriod );
			this.classList.remove( "panel__button--show-tooltip" );
			this.removeEventListener( "mouseleave", abortTooltip );
			allowanceInterval =	setTimeout( function() { inspectingTooltips = false; }, 200 );
		};

		//
		// Panel Stacking on click
		//
		// Grouped with Tooltips because tooltip show sometimes needs to lift hovered button's
		// panel in the stacking order.
		let getLayerNumber = function( elem ) {
			for ( let i = 0; i < elementStack.length; i += 1 ) {
				if ( elem === elementStack[ i ] ) {
					return i;
				}
			}
		};

		let applyZindexClasses = function() {
			let elem;
			let len = elementStack.length;
			if ( !len ) { return; }

			for ( var i = 0; i < len; i += 1 ) {
				elem = elementStack[ i ];

				if ( elem ) { // Some mobile-only buttons float free & don't live in a panel.

					// Remove all the old class names.
					for ( var j = 0; j < len; j += 1 ) {
						elem.classList.remove( "z-index" + ( j + 1 ) );
					}

					// And apply the new.
					elem.classList.add( "z-index" + ( i + 1 ) );
				}
			}
		};

		let shufflePanelStack = function( panelToGoOnTop ) {

			// If click is on the topmost layer get out.
			if ( panelToGoOnTop === elementStack[ elementStack.length - 1 ] ) {
				return;
			}

			var currentLayerNumber = getLayerNumber( panelToGoOnTop );

			if ( typeof currentLayerNumber === "number" ) {

				// Remove from current position.
				elementStack.splice( currentLayerNumber, 1 );
			}

			// Always apply classes to any panel that has been clicked
			elementStack.push( panelToGoOnTop );
			applyZindexClasses();
		};

		Gator( document.body ).on( "mousedown", ".panel", function() {
			shufflePanelStack( this );
		} );
	}() );

} );
