import { CHARACTERS_ALPHA } from './constants.js';
import { randomSequence } from './sequence.js';

export const randomAlpha = (length: number) => {
	return randomSequence(length, CHARACTERS_ALPHA);
};
