define( function() {

	/**
	 * @param {Buffer} buffer (from FileReader)
	 * @returns {Object} with image properties
	 */
	return function( buffer ) {
		let dataV = new DataView( buffer );
		let bm = Object.create( null );

		// Omit for brevity:
		// let decoder = new TextDecoder( "utf-8" );

		bm.fHeader = Object.create( null );

		// Much of this could be omitted for brevity, but it's useful for
		// reference and debugging.

		// Typically "BM" for Windows 3, 95, NT +
		// Ancient unsupported entries include: "BA", "CI", "CP", "IC", "PT".
    // bm.fHeader.type = decoder.decode( new DataView( buffer, 0, 2 ) );

		// The file size in bytes
		// bm.fHeader.byteSize =         dataV.getUint32( 2, true );

		// Reserved, depends on the application
		// bm.fHeader.reserved1 =        dataV.getUint16( 6, true );

		// Reserved, depends on the application
		// bm.fHeader.reserved2 =        dataV.getUint16( 8, true );

		// Offset of the byte where the pixel array starts
		bm.fHeader.offsetToPixArray = dataV.getUint32( 10, true );

		bm.iHeader = Object.create( null );

		// The size of this header, varies with format version #
		// e.g. V2 = 12; V3 = 40; V4 = 108; V5 = 124
		// bm.iHeader.headerSize =        dataV.getUint32( 14, true );

		// The bitmap width in pixels (integer).
		bm.width =                     dataV.getUint32( 18, true );

		// The bitmap height in pixels (integer).
		bm.height =                    dataV.getUint32( 22, true );

		// Number of color planes used (set to 1).
		// bm.iHeader.colorPlanes =       dataV.getUint16( 26, true );

		// Number of bits per pixel. Typically: 1, 4, 8, 16, 24 or 32.
		bm.iHeader.bitsPerPixel =      dataV.getUint16( 28, true );

		// The compression method being used. 0 means uncompressed,
		// which is currently the only value supported in the validator.
		bm.iHeader.compressionMethod = dataV.getUint32( 30, true );

		// Image size of raw bitmap data (not file size).
		// bm.iHeader.imageSize =         dataV.getUint32( 34, true );

		// Irrelevant in this context.
		// bm.iHeader.pixPerMeterX =      dataV.getUint32( 38, true );
		// bm.iHeader.pixPerMeterY =      dataV.getUint32( 42, true );

		// Number of colors in the palette. Should be "0" for 1 bit.
		// bm.iHeader.usedColors =        dataV.getUint32( 46, true );

		// Number of important colors used
		// bm.iHeader.importantColors =   dataV.getUint32( 50, true );

		// Stride is the number of bytes in a row. Stride must be a multiple of 4.
		bm.stride = Math.ceil( bm.iHeader.bitsPerPixel * bm.width / 32 ) * 4;

		// Total number of pixels in the image
		bm.pixels = new Uint8Array( bm.width * bm.height ); // Initially all zeros

		let offset = bm.fHeader.offsetToPixArray;
		let indent, byteAddress, bitAddress, byteVal, bitVal;

		// Outer loop iterates image rows
		for ( let y = 0; y < bm.height; y += 1 ) {
			indent = bm.stride * y;

			// Inner loop iterates image columns
			for ( let x = 0; x < bm.width; x += 1 ) {
				byteAddress = Math.floor( x / 8 );
				bitAddress = x % 8;
				byteVal = dataV.getUint8( offset + indent + byteAddress, true );
				byteVal = byteVal.toString( 2 ); // Convert to base 2

				// Trick to pad left with zeros to 8 digits
				byteVal = ( "00000000" + byteVal ).substring( byteVal.length );
				bitVal = byteVal[ bitAddress ];

				// BMP pixels start at the bottom left, so reverse the row order
				bm.pixels[ ( bm.height - 1 - y ) * bm.width + x ] = bitVal;
			}
		}

		return bm;
	};
} );
