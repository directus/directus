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
	 * Remove all keys from the cache
	 */
	clear(): Promise<void>;

	/**
	 * Waits until a lock was aquired successfully. If it times out, an error is thrown.
	 */
	aquireLock(key: string): Promise<string>;

	/**
	 * Releases a lock based on the hash that it was locked with.
	 */
	releaseLock(key: string, hash: string): Promise<boolean>;
}
