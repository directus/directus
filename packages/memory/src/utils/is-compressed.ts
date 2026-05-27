export const isCompressed = (array: Uint8Array): boolean => {
	/**
	 * Gzipped values always have a 10-byte header, an 8-byte footer, and a minimum value of 1 byte
	 */
	if (array.byteLength < 19) {
		return false;
	}

	/**
	 * The Gzip header starts with a 2-byte identifying magic number (1f 8b) followed by 08 for the
	 * deflate compression method
	 */
	return array[0] === 0x1f && array[1] === 0x8b && array[2] === 0x08;
};
