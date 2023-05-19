/**
 * Generate a random int between the given boundaries. The parameters are inclusive; min and max can
 * show up in the output.
 *
 * @example
 * ```js
 * randomIntBetween(1, 10);
 * ```
 */
export const randomIntBetween = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1) + min);
