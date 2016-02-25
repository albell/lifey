define( [ "Utility" ], function( ut ) {

	return {

		initResizable: function( elem, opts ) {
			let that = this;
			this.element = elem;

			// Copy options onto the local object
			if ( opts ) {
				for ( let opt in opts ) {

					if ( opts.hasOwnProperty( opt ) ) {
						this[ opt ] = opts[ opt ];
					}
				}
			}

			// Check first, might be inheriting.
			if ( !this.css ) {
				this.css = Object.create( null );
			}

			// Initial properties specific to the object.
			this.isResizing = false;
			this.rzblOnTopEdge = false;
			this.rzblOnRightEdge = false;
			this.rzblOnBottomEdge = false;
			this.rzblOnLeftEdge = false;
			this.rzblDragStartX = 0;
			this.rzblDragStartY = 0;

			this.rzblCalcEdges = this.rzblCalcEdges.bind( this );

			this.recordComputedStyle = this.recordComputedStyle.bind( this );
			this.rzblMouseDown = this.rzblMouseDown.bind( this );
			this.rzblMouseMove = this.rzblMouseMove.bind( this );
			this.rzblMouseUp = this.rzblMouseUp.bind( this );

			// Must wait for load/layout to internally record the resolved values of CSS
			// properties. This must happen after the scrollbar width is calculated.
			let recordComputedStyleOnLoad = function() {
				that.recordComputedStyle();
				window.removeEventListener( "load", recordComputedStyleOnLoad, true );
			};

			if ( document.readyState === "complete" ) {
				recordComputedStyleOnLoad();
			} else {
				window.addEventListener( "load", recordComputedStyleOnLoad, true );
			}

			window.addEventListener( "resize", ut.debounce( this.recordComputedStyle, 80 ), true );
			window.addEventListener( "mousemove", this.rzblMouseMove, true );
			window.addEventListener( "mousedown", this.rzblMouseDown, true );

			return this; // Chainability
		},

		recordComputedStyle: function() {
			let computedStyle = window.getComputedStyle( this.element );
			this.css.boundRect = this.element.getBoundingClientRect();
			this.css.top = ut.stripPixelUnits( computedStyle.top );
			this.css.right = ut.stripPixelUnits( computedStyle.right );
			this.css.bottom = ut.stripPixelUnits( computedStyle.bottom );
			this.css.left = ut.stripPixelUnits( computedStyle.left );
		},

		// Default settings live on the prototype.
		rzblTop: true,
		rzblRight: true,
		rzblBottom: true,
		rzblLeft: true,
		rzblHorizontalCssProp: "left",
		rzblVerticalCssProp: "top",
		rzblMinHeight: 100,
		rzblMinWidth: 100,
		rzblTolerance: 4,

		// Meaure cursor's proximity to the edges of the box.
		// Returns one of the following: "top" "right" "left" "bottom" or false
		rzblCalcEdges: function( e ) {
			if ( !this.css.boundRect ) {
				return; // Layout hasn't happened yet, get out.
			}
			let boundTop = this.css.boundRect.top;
			let boundRight = this.css.boundRect.right;
			let boundBottom = this.css.boundRect.bottom;
			let boundLeft = this.css.boundRect.left;
			let clientX = e.clientX;
			let clientY = e.clientY;
			let tol = this.rzblTolerance;
			let hoveredEdge = false;

			let withinElementX = ( boundLeft <= clientX ) &&
			                     ( clientX <= boundRight );
			let withinElementY = ( boundTop <= clientY ) &&
			                     ( clientY <= boundBottom );

			let nearTopLine = Math.abs( clientY - boundTop ) <= tol;
			let nearRightLine = Math.abs( clientX - boundRight ) <= tol;
			let nearBottomLine = Math.abs( clientY - boundBottom ) <= tol;
			let nearLeftLine = Math.abs( clientX - boundLeft ) <= tol;

			if ( nearTopLine && withinElementX && this.rzblTop ) {
				hoveredEdge = "top";
			} else if ( nearRightLine && withinElementY && this.rzblRight ) {
				hoveredEdge = "right";
			} else if ( nearBottomLine && withinElementX && this.rzblBottom ) {
				hoveredEdge = "bottom";
			} else if ( nearLeftLine && withinElementY && this.rzblLeft ) {
				hoveredEdge = "left";
			}

			// Will be false when mouse leaves edge zone.
			// Assign at the top so canvas drawing can check.
			// Don't yet assign to the local object.
			// this.rzblHoveredEdge = isHoveringEdge;
			if ( typeof this.rzblIsHovering === "function" ) {
				this.rzblIsHovering( hoveredEdge );
			}
			if ( hoveredEdge ) {
				e.stopPropagation();
			}
			return hoveredEdge;
		},

		rzblApplyCursorClass: function() {
			const bodyEl = document.body;
			const outerBgEl = document.querySelector( ".outer-background" );
			const panelEl = this.element;

			if ( this.rzblHoveredEdge === "top" || this.rzblHoveredEdge === "bottom" ) {
				if ( this.cursor !== "ns" ) {
					this.cursor = "ns";
					bodyEl.classList.add( "ns-resize-cursor" );
					outerBgEl.classList.add( "ns-resize-cursor" );
					panelEl.classList.add( "ns-resize-cursor" );
				}

			} else if ( this.rzblHoveredEdge === "right" || this.rzblHoveredEdge === "left" ) {
				if ( this.cursor !== "ew" ) {
					this.cursor = "ew";
					bodyEl.classList.add( "ew-resize-cursor" );
					outerBgEl.classList.add( "ew-resize-cursor" );
					panelEl.classList.add( "ew-resize-cursor" );
				}

			} else if ( !this.isResizing ) {
				if ( this.cursor ) {
					this.cursor = "";
					bodyEl.classList.remove( "ns-resize-cursor", "ew-resize-cursor" );
					outerBgEl.classList.remove( "ns-resize-cursor", "ew-resize-cursor" );
					panelEl.classList.remove( "ns-resize-cursor", "ew-resize-cursor" );
				}
			}
		},

		rzblMouseDown: function( e ) {
			let abort = false;
			if ( this.rzblAbortResize ) {
				abort = this.rzblAbortResize();
			}

			if ( !this.rzblHoveredEdge || abort ) {
				return;
			}

			e.stopPropagation();

			this.rzblEdgeClicked = this.rzblHoveredEdge; // E.g. "left"

			// Allows the resize animation to loop, also checked by canvas paint/erase.
			// A single property for all panels?
			this.isResizing = true;
			if ( this.reportResizing ) {
				this.reportResizing( true );
			}

			this.recordComputedStyle();

			this.rzblDragStartX = e.clientX;
			this.rzblDragStartY = e.clientY;
			this.rzblMoveX = 0;
			this.rzblMoveY = 0;

			// These values can be either right or left, top or bottom CSS.
			this.flingItemBeginX = this.css[ this.rzblHorizontalCssProp ];
			this.flingItemBeginY = this.css[ this.rzblVerticalCssProp ];

			// Start a rAF animation loop
			this.rzblAnimate();

			window.addEventListener( "mouseup", this.rzblMouseUp, true );
		},

		rzblMouseMove: function( e ) {
			let currentHoveredEdge = this.rzblHoveredEdge;
			let newHoveredEdge = this.rzblCalcEdges( e );

			if ( this.isResizing ) {

				// Set the "move" properties, which will get
				// picked up in the animation loop.
				if ( this.rzblEdgeClicked === "top" || this.rzblEdgeClicked === "bottom" ) {
					this.rzblMoveY = e.pageY - this.rzblDragStartY;
				} else if ( this.rzblEdgeClicked === "right" || this.rzblEdgeClicked === "left" ) {
					this.rzblMoveX = e.pageX - this.rzblDragStartX;
				}

			} else {

				// Modify the cursors on hover/hoverend, but only if we're not already
				// resizing.
				this.rzblHoveredEdge = newHoveredEdge;

				// If already painting near the panel edge, don't apply the resize cursor class.
				if ( this.rzblAbortResize && this.rzblAbortResize() ) {
					return;
				}

				// Don't touch the DOM if there hasn't been a change.
				if ( newHoveredEdge !== currentHoveredEdge ) {
					this.rzblApplyCursorClass();
				}
			}
		},

		rzblMouseUp: function( e ) {

			// Breaks the resize animation loop, also checked by canvas paint/erase
			this.isResizing = false;
			if ( this.reportResizing ) {
				this.reportResizing( false );
			}

			// Flushing these seems to reduce glitching
			this.rzblEdgeClicked = undefined;

			// Mouseups can always propagate.
			window.removeEventListener( "mouseup", this.rzblMouseUp, true );
		},

		rzblAnimate: function() {
			let that = this;
			if ( !this.isResizing ) {

				// Animation is over. Update the box after resize complete
				this.css.boundRect = this.element.getBoundingClientRect();
				return; // Get out when mouseup breaks the animation loop.
			}
			this.rzblRender();
		  requestAnimationFrame( function() {
				that.rzblAnimate();
			} );
		},

	// ========= RENDER =========================
	//
	//  Drag       |  CSS       |  Render
	//  From       |  pos prop  |  Outcome
	// ------------------------------------------
	//  left       |  left      | + left
	//             |            | - width
	// ------------------------------------------
	//  left       |  right     | - width
	//             |            |
	// ------------------------------------------
	//  right      |  right     | - right
	//             |            | + width
	// ------------------------------------------
	//  right      |  left      | + width
	//             |            |
	// ------------------------------------------
	//  top        |  top       | + top
	//             |            | - height
	// ------------------------------------------
	//  top        |  bottom    | - height
	//             |            |
	// ------------------------------------------
	//  bottom     |  bottom    | - bottom
	//             |            | + height
	// ------------------------------------------
	//  bottom     |  top       | + height
	//             |            |
	// ------------------------------------------

		rzblRender: function() {
			if ( this.rzblEdgeClicked === "left" ) {
				if ( this.rzblHorizontalCssProp === "left" ) {
					this.css.left = this.flingItemBeginX + this.rzblMoveX;
					this.element.style.left = this.css.left + "px";
				}
				this.element.style.width = this.css.boundRect.width - this.rzblMoveX + "px";

			} else if ( this.rzblEdgeClicked === "right" ) {
				if ( this.rzblHorizontalCssProp === "right" ) {
					this.css.right = this.flingItemBeginX - this.rzblMoveX;
					this.element.style.right = this.css.right + "px";
				}
				this.element.style.width = this.css.boundRect.width + this.rzblMoveX + "px";

			} else if ( this.rzblEdgeClicked === "top" ) {
				if ( this.rzblVerticalCssProp === "top" ) {
					this.css.top = this.flingItemBeginY + this.rzblMoveY;
					this.element.style.top = this.css.top + "px";
				}
				this.element.style.height = this.css.boundRect.height - this.rzblMoveY + "px";

			} else if ( this.rzblEdgeClicked === "bottom" ) {
				if ( this.rzblVerticalCssProp === "bottom" ) {
					this.css.bottom = this.css.bottom - this.rzblMoveY;
					this.element.style.bottom = this.css.bottom + "px";
				}
				this.element.style.height = this.css.boundRect.height + this.rzblMoveY + "px";
			}
		}
	};
} );
