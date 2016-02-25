// Adapted and improved from
// http://thiscouldbebetter.neocities.org/texteditor.html

// If this presents problems in the future consider migrating up to:
// https://github.com/eligrey/FileSaver.js

define( [ "Utility" ], function( ut ) {
	let objURL;

	function destroyClickedElement( event ) {
		event.target.removeEventListener( "click", destroyClickedElement );
		document.body.removeChild( event.target );
	}

	return function( textStr, fileName ) {

		// Any old reference ought to be released.
		// https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL
		if ( objURL ) {
			window.URL.revokeObjectURL( objURL );
		}
		let textFileAsBlob = new Blob( [ textStr ], { type: "text/plain" } );
		let downloadLink = document.createElement( "a" );
		downloadLink.download = fileName;
		objURL = window.URL.createObjectURL( textFileAsBlob );
		downloadLink.href = objURL;

		// Chrome allows the link to be clicked without actually adding it to the DOM.
		// Firefox requires the link to be added to the DOM before it can be clicked.
		if ( !( navigator && navigator.vendor && navigator.vendor === "Google Inc." ) ) {
			downloadLink.addEventListener( "click", destroyClickedElement );
			downloadLink.style.display = "none";
			document.body.appendChild( downloadLink );
		}

		downloadLink.click();
	};
} );

