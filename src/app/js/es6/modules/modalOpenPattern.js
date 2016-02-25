define( [ "Modal", "parseRLEFile", "parseBMP" ], function( Modal, parseRLEFile, parseBMP ) {

	// To be added & customized for each unique modal object:
	// this.titleText   html to insert in body of modal
	// this.innerMarkup   html to insert in body of modal
	// this.modalInternalBinding   listeners other than ok/cancel
	// this.modalInternalUnbinding  remove listeners other than ok/cancel
	// this.modalValidate  optional check on click of OK. returns a Boolean.
	// this.modalSubmit   function to run 'ok' click if valid.

	let modalOpenPattern = Object.create( Modal );

	modalOpenPattern.titleText = "Open Pattern";

	modalOpenPattern.innerMarkup = function() {
		return "<div class='modal__open modal__configure'>" +
			"<div class='modal__open__instructions'>Choose a JSON, RLE, or 1-bit" +
			" Windows BMP file pattern from your file system." +
			"</div>" +
		"</div" +
		"><div class=modal__confirm>" +
			"<button type=button class='modal__button modal-ok'" +
				" data-modal-ok>OK</button>" +
			"<button type=button class='modal__button modal-cancel' " +
					"data-modal-cancel>Cancel</button>" +
		"</div>" +
		"<div class='modal__open__error-text modal__error-text'></div>" +
		"<div class=modal__input-file-wrapper>" +
			"<input class=modal__file-input type=file>" +
		"</div>";
	};

	modalOpenPattern.modalInternalBinding = function() {
		let fileInputEl = document.querySelector( ".modal__file-input" );
		let errorEl = document.querySelector( ".modal__error-text" );

		this.modalValidateFileInputChoice = this.modalValidateFileInputChoice.bind( this );
		this.modalValidateFileInputContents = this.modalValidateFileInputContents.bind( this );

		this.fileInputEl = fileInputEl;
		this.errorEl = errorEl ;

		// Don't wait until "OK" click to validate the input.
		this.fileInputEl.addEventListener( "change", this.modalValidateFileInputChoice );
	};

	modalOpenPattern.modalInternalUnbinding = function() {
		this.fileInputEl.removeEventListener( "change", this.modalValidateFileInputChoice );
	};

	modalOpenPattern.parsedPattern = null;
	modalOpenPattern.isValid = false; // Nothing initially selected.

	modalOpenPattern.validateBMP = function( file ) {
		let bm = parseBMP( file );
		let errorText = "";

		if ( bm.iHeader.bitsPerPixel > 1 ) {
			errorText = "The BMP file can't be read because it has a bit depth of " +
			            "greater than one.";
		} else if ( bm.iHeader.compressionMethod > 0 ) {
			errorText = "Lifey currently only supports uncompressed BMP files.";
		}
		if ( errorText ) {
			this.parsedPattern = null;
		} else {
			this.parsedPattern = bm;
		}
		return errorText;
	};

	modalOpenPattern.readFile = function( file ) {
		let fReader = new FileReader();
		let that = this;
		let ext = this.fileExtension;

		fReader.onload = function( e ) {
			that.modalValidateFileInputContents( e.target.result );
		};

		// Read the file differently based on the extension.
		// This kicks off the onload event above.
		if ( ext === "JSON" || ext === "RLE" ) {
			fReader.readAsText( file );
		} else if ( ext === "BMP" ) {

			// BMP is binary, read as an Array Buffer.
			fReader.readAsArrayBuffer( file );
		}
	};

	// Validity can be set by the file(s) being selected, or the file being (mis)read
	// or parsed. This gets checked on click of "ok" button.
	modalOpenPattern.modalValidate = function() {
		return this.isValid;
	};

	modalOpenPattern.modalValidateFileInputContents = function( file ) {
		let ext = this.fileExtension;
		let errorText = "";

		if ( ext === "JSON" ) {
			try {
				this.parsedPattern = JSON.parse( file );
			} catch ( e ) {
				errorText = "The file text is not valid JSON." +
					" Please check the file for a possible syntax error.";
			}

		} else if ( ext === "RLE" ) {
			this.parsedPattern = parseRLEFile( file );

		} else if ( ext === "BMP" ) {
			errorText = this.validateBMP( file );
		}

		this.showError( errorText );
		this.isValid = !errorText;
	};

	modalOpenPattern.modalValidateFileInputChoice = function() {
		let fileList = this.fileInputEl.files;
		let file = fileList[ 0 ];
		let errorText = ""; // Always added, must be a string.
		let fileName = file.name;
		let fileExtension = fileName.split( "." ).pop().toUpperCase();
		this.fileExtension = fileExtension;

		if ( !file || fileList.length === 0 ) {
			errorText = "No file selected.";
		} else if ( fileList.length > 1 ) {
			errorText = "Multiple files selected. Please choose a single file.";
		} else if ( fileExtension !== "JSON" &&
		            fileExtension !== "BMP" &&
		            fileExtension !== "RLE" ) {
			errorText = "The file name should end with a dot, followed by either “json”," +
			            " “rle”, or “bmp”.";
		}

		if ( errorText ) {
			this.parsedPattern = null;
		} else {
			this.readFile( file );  // Kicks off a second round of validation.
		}

		// Always "show" the error even if it's an empty string, so that a file input
		// correction erases any previous error messages.
		this.showError( errorText );
		this.isValid = !errorText;
	};

	return modalOpenPattern;
} );

