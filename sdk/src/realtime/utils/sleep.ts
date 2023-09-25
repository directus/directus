/**
 * Wait for a certain amount of ms
 * @param delay number in MS
 * @returns void
 */
export const sleep = (delay: number) => new Promise<void>((resolve) => setTimeout(() => resolve(), delay));
