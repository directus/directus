/** Return a random item from a given array */
export const randomArray = <T = unknown>(items: readonly T[]): T => {
	return items.at(Math.random() * items.length) as T;
};
