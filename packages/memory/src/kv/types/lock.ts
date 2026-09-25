export interface Lock {
	release(): Promise<void>;
	extend(duration: number): Promise<void>;
}

export interface LockSettings {
	/**
	 * How long the lock survives without being extended, in milliseconds
	 */
	duration?: number;

	/**
	 * How many times to attempt acquiring the lock before giving up
	 */
	retryCount?: number;
}
