const encoder = new TextEncoder();

/**
 * Convert a String to a JS Uint8Array
 */
export const stringToUint8Array = (val: string) => encoder.encode(val);
