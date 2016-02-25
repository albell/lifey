define( [ "Modal" ], function( Modal ) {

	// To be added & customized for each unique modal object:
	// this.titleText   html to insert in body of modal.
	// this.innerMarkup   html to insert in body of modal.
	// this.modalInternalBinding   (optional) listeners other than ok/cancel.
	// this.modalInternalUnbinding  (optional) remove listeners other than ok/cancel.
	// this.modalValidate  (optional) check on click of OK. returns a Boolean.
	// this.modalSubmit   function to run "ok" click if valid.

	let modalSharePattern = Object.create( Modal );

	modalSharePattern.titleText = "Share Pattern";

	modalSharePattern.innerMarkup = function() {
		return "" +
		"<div class='modal__configure modal__share__configure'>" +
			"<div class='modal__section-title--share'>" +
					"<span class=pattern-fits-in-url></span>" +
			"</div>" +
		"</div>" +
		"<div class=modal__confirm>" +
			"<button type=button class='modal__button modal-ok' data-modal-ok>OK</button>" +
		"</div>" +
		"<div class=modal__shareable-url data-modal-shareable-url></div";
	};

	return modalSharePattern;
} );
