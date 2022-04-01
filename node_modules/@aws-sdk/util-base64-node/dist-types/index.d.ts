/**
 * Converts a base-64 encoded string to a Uint8Array of bytes using Node.JS's
 * `buffer` module.
 *
 * @param input The base-64 encoded string
 */
export declare function fromBase64(input: string): Uint8Array;
/**
 * Converts a Uint8Array of binary data to a base-64 encoded string using
 * Node.JS's `buffer` module.
 *
 * @param input The binary data to encode
 */
export declare function toBase64(input: Uint8Array): string;
