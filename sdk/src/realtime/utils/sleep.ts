/**
 * Wait for a certain amount of ms
 * @param delay number in MS
 * @returns void
 */
export const sleep = (delay: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, delay));
