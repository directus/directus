export interface Limiter {
	/**
	 * Consume a point for the given key
	 *
	 * @param key IP address, URL path, or any other string
	 */
	consume(key: string): Promise<void>;

	/**
	 * Delete the tracked information for a given key
	 *
	 * @param key IP address, URL path, or any other string
	 */
	delete(key: string): Promise<void>;
}
