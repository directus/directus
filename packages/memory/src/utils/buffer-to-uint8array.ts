/**
 * Convert a NodeJS Buffer to a JS Uint8Array
 *
 * @param buffer NodeJS Buffer
 * @returns JS Uint8Array
 */
export const bufferToUint8Array = (buffer: Buffer): Uint8Array<ArrayBufferLike> =>
	new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
