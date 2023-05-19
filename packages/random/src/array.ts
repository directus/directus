/**
 * Return a random item from a given array
 *
 * @param items - Array of any type of things
 */
export const randomArray = <T = unknown>(items: readonly T[]): T => {
	return items.at(Math.random() * items.length) as T;
};
