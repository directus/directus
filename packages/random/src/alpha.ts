import { CHARACTERS_ALPHA } from './constants.js';
import { randomSequence } from './sequence.js';

/**
 * Return random string of alphabetic characters
 *
 * @param length - Length of the string to generate
 */
export const randomAlpha = (length: number) => {
	return randomSequence(length, CHARACTERS_ALPHA);
};
