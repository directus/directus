export interface Kv {
	/**
	 * Get the stored value by key. Returns undefined if the key doesn't exist in the store
	 *
	 * @param key Key to retrieve from the store
	 * @returns Stored value, or undefined if key doesn't exist
	 */
	get<T = unknown>(key: string): Promise<T | undefined>;

	/**
	 * Save the given value to the store
	 *
	 * @param key Key to save in the store
	 * @param value Value to save to the store. Can be any JavaScript primitive, plain object, or array
	 */
	set<T = unknown>(key: string, value: T): Promise<void>;

	/**
	 * Remove the given key from the store
	 *
	 * @param key Key to remove from the store
	 */
	delete(key: string): Promise<void>;

	/**
	 * Check if a given key exists in the store
	 *
	 * @param key Key to check
	 */
	has(key: string): Promise<boolean>;

	/**
	 * Increment the given stored value by the given amount
	 *
	 * @param key Key to increment in the store
	 * @param [amount=1] Amount to increment. Defaults to 1
	 * @returns Updated value
	 */
	increment(key: string, amount?: number): Promise<number>;

	/**
	 * Save the given value to the store if the given value is larger than the existing value
	 *
	 * @param key Key to save in the store
	 * @param value Number to save to the store if it's bigger than the current value
	 * @returns Whether or not the given value was saved
	 */
	setMax(key: string, value: number): Promise<boolean>;

	aquireLock(key: string): Promise<string | undefined>;

	releaseLock(key: string, hash: string): Promise<boolean>;

	/**
	 * Remove all keys from the kv store
	 */
	clear(): Promise<void>;
}
