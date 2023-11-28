export interface Cache {
	/**
	 * Get the cached value by key. Returns undefined if the key doesn't exist in the cache
	 *
	 * @param key Key to retrieve from the cache
	 * @returns Cached value, or undefined if key doesn't exist
	 */
	get<T = unknown>(key: string): Promise<T | undefined>;

	/**
	 * Save the given value to the cache
	 *
	 * @param key Key to save in the cache
	 * @param value Value to save to the cache. Can be any JavaScript primitive, plain object, or array
	 */
	set<T = unknown>(key: string, value: T): Promise<void>;

	/**
	 * Remove the given key from the cache
	 *
	 * @param key Key to remove from the cache
	 */
	delete(key: string): Promise<void>;

	/**
	 * Check if a given key exists in the cache
	 *
	 * @param key Key to check
	 */
	has(key: string): Promise<boolean>;

	/**
	 * Increment the given cached value by the given amount
	 *
	 * @param key Key to increment in the cache
	 * @param [amount=1] Amount to increment. Defaults to 1
	 * @returns Updated value
	 */
	increment(key: string, amount: number): Promise<number>;

	/**
	 * Save the given value to the cache if the given value is larger than the existing value
	 *
	 * @param key Key to save in the cache
	 * @param value Number to save to the cache if it's bigger than the current value
	 * @returns Whether or not the given value was saved
	 */
	setMax(key: string, value: number): Promise<boolean>;
}
