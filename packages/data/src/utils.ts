import { randomAlpha, randomInteger } from '@directus/random';

/**
 * Small wrapper to generate a random identifiers based on @directus/random.
 *
 * @returns A random identifier with 3 to 25 characters.
 */
export const getRandomIdentifier = () => {
	return randomAlpha(randomInteger(3, 25));
};
