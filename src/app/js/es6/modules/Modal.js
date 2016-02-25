//Modal
define( function() {

	// Opening modal changes keymaster "scope"
	let key = require( "keymaster" );

	// To be customized per unique modal object:
	// this.innerMarkup   html to insert
	// this.modalInternalBinding   listeners other than ok/cancel
	// this.modalInternalUnbinding  remove listeners other than ok/cancel
	// this.modalValidate  optional check on click of OK. returns a Boolean.
	// this.modalSubmit   function to run 'ok' click if valid.

	return {

		modalWrapperElement: document.querySelector( ".modal-wrapper" ),

		modalTitleEl: document.querySelector( ".modal__title" ),

		modalContentsEl: document.querySelector( ".modal__contents" ),

		init: function( buttonElementToBind ) {
			this.modalOpenButtonElement = buttonElementToBind;

			// Create bound local reference for all the prototype handler methods  :/
			this.modalOpen = this.modalOpen.bind( this );
			this.modalClose = this.modalClose.bind( this );
			this.modalOnOk = this.modalOnOk.bind( this );
			this.modalOnCancel = this.modalOnCancel.bind( this );

			// Assume for now it's always a button that triggers opening the modal.
			this.modalOpenButtonElement.addEventListener( "touchstart", this.modalOpen );
			this.modalOpenButtonElement.addEventListener( "click", this.modalOpen );
		},

		modalOpen: function( e ) {

			if ( e.type === "touchstart" ) { e.preventDefault(); } /* Suppress ghost click. */

			// The custom pre-open fn unique to a particular modal.
			if ( typeof this.modalBeforeOpen === "function" ) {
				this.modalBeforeOpen();
			}

			// Generic to all Modals but set inside the closure.
			if ( typeof this.modalSetOpenState === "function" ) {
				this.modalSetOpenState( true );
			}

			// Turn off all Keymaster shortcuts applicable in the main view, so that, for example,
			// tabbing works between form fields in a modal.
			// In the "modal" scope, "enter" clicks the OK button.
			key.setScope( "modal" );

			// Show the modal.
			this.modalWrapperElement.classList.remove( "modal-wrapper--hide" );

			// Insert the DOM elements
			this.modalTitleEl.innerHTML = this.titleText;
			this.modalContentsEl.innerHTML = this.innerMarkup();

			this.modalOkButton = document.querySelector( "[data-modal-ok]" );
			this.modalCancelButton = document.querySelector( "[data-modal-cancel]" );

			this.modalOkButton.addEventListener( "touchstart", this.modalOnOk );
			this.modalOkButton.addEventListener( "click", this.modalOnOk );

			// Not all modals have a cancel button.
			if ( this.modalCancelButton ) {
				this.modalCancelButton.addEventListener( "touchstart", this.modalOnCancel );
				this.modalCancelButton.addEventListener( "click", this.modalOnCancel );
			}

			// The custom post-open fn unique to a particular modal.
			if ( this.modalInternalBinding ) {
				this.modalInternalBinding();
			}
		},

		showError: function( errorText ) {
			this.errorEl.innerHTML = errorText;
		},

		modalOnOk: function( e ) {

			if ( e.type === "touchstart" ) { e.preventDefault(); } /* Suppress ghost click. */

			// Revalidate on click of OK.
			// Assume valid because not all modals use validation.
			if ( typeof this.modalValidate === "function" ) {
				if ( !this.modalValidate() ) {
					return;
				}
			}

			// Some "info" modals (like share) don't do anything on submit.
			if ( typeof this.modalSubmit === "function" ) {
				this.modalSubmit();
			}
			this.modalClose();
		},

		modalOnCancel: function( e ) {
			if ( e.type === "touchstart" ) { e.preventDefault(); } /* Suppress ghost click. */
			this.modalClose();
		},

		modalClose: function() {
			if ( this.modalInternalUnbinding ) {
				this.modalInternalBinding();
			}

			// Unbind confirmation buttons
			this.modalOkButton.removeEventListener( "touchstart", this.modalOnOk );
			this.modalOkButton.removeEventListener( "click", this.modalOnOk );

			if ( this.modalCancelButton ) {
				this.modalCancelButton.removeEventListener( "touchstart", this.modalOnCancel );
				this.modalCancelButton.removeEventListener( "click", this.modalOnCancel );
			}
			this.modalWrapperElement.classList.add( "modal-wrapper--hide" );

			key.setScope( "main" );

			// Generic to all Modals but set inside the closure.
			if ( typeof this.modalSetOpenState === "function" ) {
				this.modalSetOpenState( false );
			}

			// The custom post-open fn unique to a particular modal.
			if ( typeof this.modalAfterClose === "function" ) {
				this.modalAfterClose();
			}
		}
	};

} );
