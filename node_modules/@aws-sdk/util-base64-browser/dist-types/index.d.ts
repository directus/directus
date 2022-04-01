/**
 * Converts a base-64 encoded string to a Uint8Array of bytes.
 *
 * @param input The base-64 encoded string
 *
 * @see https://tools.ietf.org/html/rfc4648#section-4
 */
export declare function fromBase64(input: string): Uint8Array;
/**
 * Converts a Uint8Array of binary data to a base-64 encoded string.
 *
 * @param input The binary data to encode
 *
 * @see https://tools.ietf.org/html/rfc4648#section-4
 */
export declare function toBase64(input: Uint8Array): string;
