define( [ "Modal" ], function( Modal ) {

	// To be added & customized for each unique modal objects:
	// this.titleText   html to insert in body of modal
	// this.innerMarkup   html to insert in body of modal
	// this.modalInternalBinding   listeners other than ok/cancel
	// this.modalInternalUnbinding  remove listeners other than ok/cancel
	// this.modalValidate  optional check on click of OK. returns a Boolean.
	// this.modalSubmit   function to run "ok" click if valid.

	let modalCanvasSize = Object.create( Modal );

	modalCanvasSize.titleText = "Canvas Size";

	modalCanvasSize.innerMarkup = function() {
		return `<div class="modal__configure">
			<div class="modal__section">
				<div class="modal__section-title">Current Size</div>
				<div class="modal__prop modal__prop--text-only">
					<span class="modal__prop-name modal__prop-name--text-only">Width:</span>
				</div
				><div class="modal__value modal__value--text-only">
					<span class="modal__value-name modal__value-name--text-only"
						data-modal-canvas-size-current-width >
						${this.currentCanvasWidth}</span>
				</div>
				<div class="modal__prop modal__prop--text-only">
					<span class="modal__prop-name modal__prop-name--text-only">Height:</span>
				</div
				><div class="modal__value modal__value--text-only">
					<span class="modal__value-name modal__value-name--text-only"
						data-modal-canvas-size-current-height
							>${this.currentCanvasHeight}</span>
				</div>
			</div>
			<div class="modal__section">
				<div class="modal__section-title">New Size</div>
				<div class="modal__prop">
					<span class="modal__prop-name">Width:</span>
				</div
				><div class="modal__value">
					<input id="canvas-size-width" class="modal__numeric-input" type=number min="0"
						step="1" required value=${this.currentCanvasWidth}
						data-modal-canvas-size-new-width>
				</div>
				<div class="modal__prop">
					<span class=modal__prop-name>Height:</span>
				</div
				><div class="modal__value">
					<input class="modal__numeric-input" type="number" min="0" step="1" required
						value=${this.currentCanvasHeight}  data-modal-canvas-size-new-height>
				</div>
				<div class="modal__prop">
					<span class=modal__prop-name>Anchor:</span>
				</div
				><div class="modal__value modal__canvas-direction-button-container"
					data-canvas-direction-container>
					<svg class="modal__canvas-resize-arrows" xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 68 68" >
						<polygon fill="#231F20"
							points="4,4 4,13.15 7.87,9.3 15.66,16.95 17.14,15.54 9.41,
								7.71 13.05,4"/>
						<polygon fill="#231F20"
							points="40,8 34,2 28,8 33,8 33,19 35,19 35,8"/>
						<polygon fill="#231F20"
							points="64,4 55,4 58.85,7.85 51.2,15.62 52.61,17.1 60.37,9.37 64,13"/>
						<polygon fill="#231F20"
							points="8,27.5 2,33.5 8,39.5 8,35 19,35 19,33 8,33"/>
						<circle id="circle_4_" fill="#231F20" cx="34" cy="34" r="3"/>
						<polygon fill="#231F20"
							points="60,39.5 66,33.5 60,27.5 60,33 49,33 49,35 60,35"/>
						<polygon fill="#231F20"
							points="4,64 13.2,64 9.35,60.2 17,52.45 15.59,50.99 7.73,58.72 4,55.1"/>
						<polygon fill="#231F20"
							points="28,60 34,66 40,60 35,60 35,49 33,49 33,60"/>
						<polygon fill="#231F20"
							points="64,64 64,54.95 60.22,58.8 52.49,51.15 51.03,52.56 58.77,
							60.34 55.15,64"/>
					</svg>
					<button type=button class="modal__canvas-direction-button" tabindex=-1
						data-canvas-resize-direction="left   top"    ></button
					><button type=button class="modal__canvas-direction-button" tabindex=-1
						data-canvas-resize-direction="center top"    ></button
					><button type=button class="modal__canvas-direction-button" tabindex=-1
						data-canvas-resize-direction="right  top"    ></button
					><button type=button class="modal__canvas-direction-button" tabindex=-1
						data-canvas-resize-direction="left   middle" ></button
					><button type=button class="modal__canvas-direction-button" tabindex=-1
						data-canvas-resize-direction="center middle" ></button
					><button type=button class="modal__canvas-direction-button" tabindex=-1
						data-canvas-resize-direction="right  middle" ></button
					><button type=button class="modal__canvas-direction-button" tabindex=-1
						data-canvas-resize-direction="left   bottom" ></button
					><button type=button class="modal__canvas-direction-button" tabindex=-1
						data-canvas-resize-direction="center bottom" ></button
					><button type=button class="modal__canvas-direction-button" tabindex=-1
						data-canvas-resize-direction="right  bottom" ></button
				></div
			></div
		></div
		><div class=modal__confirm>
			<button type=button class="modal__button modal-ok" data-modal-ok>OK</button>
			<button type=button class="modal__button modal-cancel" data-modal-cancel>Cancel</button>
		</div>
		<div class="modal__error-text"></div>`;
	};

	modalCanvasSize.modalInternalBinding = function() {
		let doc = document; // Shortening only :/
		this.resizeIconPositionX = "center";
		this.resizeIconPositionY = "middle";

		this.onResizeDirectionButtonClick = this.onResizeDirectionButtonClick.bind( this );

		this.resizeDirectionContainer = doc.querySelector( "[data-canvas-direction-container]" );
		this.resizeDirectionContainer.addEventListener( "click",
		                                                this.onResizeDirectionButtonClick );

		// Focus the first input box and select (highlight) its contents.
		// FF doesn"t support select() method.
		// Webkit throws InvalidStateError on setSelectionRange on an input type=number element.
		// https://code.google.com/p/chromium/issues/detail?id=346270
		let firstInput = doc.getElementById( "canvas-size-width" );
		try {
			firstInput.focus();
			firstInput.setSelectionRange( 0, 9999 );
		} catch ( e ) {
			firstInput.select();
		}
	};

	modalCanvasSize.modalInternalUnbinding = function() {
		let that = this;
		this.resizeDirectionContainer.removeEventListener( "click",
		                                                  that.onResizeDirectionButtonClick );
	};

	// Returns true if user input is valid.
	modalCanvasSize.modalValidate = function() {
		let newWidthEl = document.querySelector( "[data-modal-canvas-size-new-width]" );
		let newHeightEl = document.querySelector( "[data-modal-canvas-size-new-height]" );
		let newWidth = parseInt( newWidthEl.value );
		let newHeight = parseInt( newHeightEl.value );
		let errorText;

		this.errorEl = document.querySelector( ".modal__error-text" );

		if ( typeof newWidth !== "number" || typeof newHeight !== "number" ||
		     Number.isNaN( newWidth ) || Number.isNaN( newHeight ) ) {
			errorText = "Oops! Please enter a numeric input value.";
		} else if ( newWidth < 3 || newHeight < 3 ) {
			errorText = "Oops! Canvases must be at least three pixels or larger on each dimension.";
		} else if ( newWidth >= 5000 || newHeight >= 5000 ) {
			errorText = "Whoa Nellie! Please keep it under 5000 pixels on each dimension.";
		}
		if ( errorText ) {
			this.showError( errorText );
			return false;
		} else {
			this.newWidth = newWidth;
			this.newHeight = newHeight;
			return true;
		}
	};

	modalCanvasSize.onResizeDirectionButtonClick = function( e ) {
		e.preventDefault();
		e.stopImmediatePropagation();

		// Target should be one of the child buttons, split on spaces.
		let positions = e.target.getAttribute( "data-canvas-resize-direction" );
		positions = positions.split( /\s+/ );

		// Set the new icon positions.
		// Markup is strictly horizontal value first, then vertical value.
		this.resizeIconPositionX = positions[ 0 ];
		this.resizeIconPositionY = positions[ 1 ];

		// Remove all old positioning classes. This could surely be improved?
		this.resizeDirectionContainer.classList.remove( "resize-icon-top",
		                                                "resize-icon-middle",
		                                                "resize-icon-bottom",
		                                                "resize-icon-left",
		                                                "resize-icon-center",
		                                                "resize-icon-right" );

		// And add the new appropriate classes.
		this.resizeDirectionContainer.classList.add( "resize-icon-" + this.resizeIconPositionX );
		this.resizeDirectionContainer.classList.add( "resize-icon-" + this.resizeIconPositionY );
	};

	return modalCanvasSize;
} );
