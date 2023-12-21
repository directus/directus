import { parseJSON } from '@directus/utils';

const encoder = new TextEncoder();
const decoder = new TextDecoder();

/**
 * Serialize a given JavaScript value to it's Uint8Array equivalent
 *
 * @param val - JS value to serialize
 * @returns Uint8Array of serialized value
 */
export const serialize = (val: unknown) => {
	const valueString = JSON.stringify(val);
	return encoder.encode(valueString);
};

/**
 * Deserialize a given Uint8Array into a JavaScript value
 *
 * @param val - Binary array to deserialize
 * @returns JavaScript value
 */
export const deserialize = <T = unknown>(val: Uint8Array) => {
	const valueString = decoder.decode(val);
	return <T>parseJSON(valueString);
};
