import { parseJSON } from '@directus/utils';
import { stringToUint8Array } from './string-to-uint8array.js';
import { uint8ArrayToString } from './uint8array-to-string.js';

/**
 * Serialize a given JavaScript value to it's Uint8Array equivalent
 *
 * @param val - JS value to serialize
 * @returns Uint8Array of serialized value
 */
export const serialize = (val: unknown) => {
	const valueString = JSON.stringify(val);
	return stringToUint8Array(valueString);
};

/**
 * Deserialize a given Uint8Array into a JavaScript value
 *
 * @param val - Binary array to deserialize
 * @returns JavaScript value
 */
export const deserialize = <T = unknown>(val: Uint8Array) => {
	const valueString = uint8ArrayToString(val);
	return <T>parseJSON(valueString);
};
