import type { Lock, LockSettings } from './lock.js';

export type MaybePromise<T> = Promise<T> | T;

export interface Kv {
	/**
	 * Get the stored value by key. Returns undefined if the key doesn't exist in the store
	 *
	 * @param key Key to retrieve from the store
	 * @returns Stored value, or undefined if key doesn't exist
	 */
	get<T = unknown>(key: string): MaybePromise<T | undefined>;

	/**
	 * Save the given value to the store
	 *
	 * @param key Key to save in the store
	 * @param value Value to save to the store. Can be any JavaScript primitive, plain object, or array
	 */
	set<T = unknown>(key: string, value: T): MaybePromise<void>;

	/**
	 * Remove the given key from the store
	 *
	 * @param key Key to remove from the store
	 */
	delete(key: string): MaybePromise<void>;

	/**
	 * Check if a given key exists in the store
	 *
	 * @param key Key to check
	 */
	has(key: string): MaybePromise<boolean>;

	/**
	 * Increment the given stored value by the given amount
	 *
	 * @param key Key to increment in the store
	 * @param [amount=1] Amount to increment. Defaults to 1
	 * @returns Updated value
	 */
	increment(key: string, amount?: number): MaybePromise<number>;

	/**
	 * Save the given value to the store if the given value is larger than the existing value
	 *
	 * @param key Key to save in the store
	 * @param value Number to save to the store if it's bigger than the current value
	 * @returns Whether or not the given value was saved
	 */
	setMax(key: string, value: number): MaybePromise<boolean>;

	acquireLock(key: string): MaybePromise<Lock>;

	/**
	 * Run the callback while holding the lock, releasing it once the callback settles
	 *
	 * The callback is handed a signal that aborts if the lock is lost before it finishes, which
	 * it is free to ignore, but until then nothing else can be holding the same lock.
	 *
	 * @param key Key to lock on
	 * @param callback Function to run while the lock is held
	 * @param settings Overrides for the lease and for how long to keep contending
	 */
	usingLock<T>(key: string, callback: (signal: AbortSignal) => Promise<T>, settings?: LockSettings): MaybePromise<T>;

	/**
	 * Remove all keys from the kv store
	 */
	clear(): MaybePromise<void>;
}
