import { randomAlpha } from './alpha.js';
import { randomInteger } from './integer.js';

/**
 * A wrapper to generate a random identifier.
 *
 * @returns A random identifier with 3 to 25 characters.
 */
export const randomIdentifier = () => {
	return randomAlpha(randomInteger(3, 25));
};
