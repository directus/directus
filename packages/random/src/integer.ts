/**
 * Return a random integer between the given range
 *
 * @param min - Minimum
 * @param max - Maximum
 */
export const randomInteger = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1) + min);
