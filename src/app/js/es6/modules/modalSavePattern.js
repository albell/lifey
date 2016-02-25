define( [ "Modal" ], function( Modal ) {

	// To be added & customized for each unique modal objects:
	// this.titleText   html to insert in body of modal
	// this.innerMarkup   html to insert in body of modal
	// this.modalInternalBinding   listeners other than ok/cancel
	// this.modalInternalUnbinding  remove listeners other than ok/cancel
	// this.modalValidate  optional check on click of OK. returns a Boolean.
	// this.modalSubmit   function to run 'ok' click if valid.

	let modalSavePattern = Object.create( Modal );

	modalSavePattern.titleText = "Save As";

	modalSavePattern.innerMarkup = function() {
		return "<div class='modal__configure modal__configure--save-as'>" +
			"<div class='modal__save-pattern-option'>Format:</div>" +
			"<div class='modal__save-pattern-option-input-wrapper'>" +
				"<select class=modal__save-pattern-option-input name=fileformat" +
					" data-modal-save-file-format>" +
				  "<option value='json' selected>JavaScript Object Notation (.json)</option>" +
					"<option value='rle'>Run Length Encoded (.rle)</option>" +
				"</select>" +
			"</div>" +

			"<div class=modal__save-pattern-option>Pattern Name:</div>" +
			"<div class=modal__save-pattern-option-input-wrapper>" +
				"<input type=text class=modal__save-pattern-option-input" +
					" data-modal-save-pattern-name>" +
			"</div>" +
			"<div class=modal__save-pattern-option>Author:</div>" +
			"<div class=modal__save-pattern-option-input-wrapper>" +
				"<input type=text class=modal__save-pattern-option-input" +
					" data-modal-save-pattern-author>" +
			"</div>" +
			"<div class=modal__error-text></div>" +
		"</div>" +
		"<div class='modal__confirm modal__confirm--bottom-corner'>" +
			"<button type=button class='modal__button modal-cancel modal-cancel--save-as'" +
				"data-modal-cancel>Cancel</button>" +
			"<button type=button class='modal__button modal-ok modal-ok--save-as'" +
				"data-modal-ok >Save</button>" +
		"</div>";
	};

	return modalSavePattern;
} );
