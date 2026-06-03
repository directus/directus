const encoder = new TextEncoder();

/**
 * Convert a String to a JS Uint8Array
 */
export const stringToUint8Array = (val: string): Uint8Array => encoder.encode(val);
