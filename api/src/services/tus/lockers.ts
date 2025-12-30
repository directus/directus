import { waitTimeout } from './utils/wait-timeout.js';
import { useLock } from '../../lock/index.js';
import type { Kv } from '@directus/memory';
import { ERRORS, type Lock, type Locker, type RequestRelease } from '@tus/utils';

/**
 * TusLocker is an implementation of the Locker interface that manages locks in memory or using Redis.
 * This class is designed for exclusive access control over resources, often used in scenarios like upload management.
 *
 * Locking Behavior:
 * - When the `lock` method is invoked for an already locked resource, the `cancelReq` callback is called.
 *   This signals to the current lock holder that another process is requesting the lock, encouraging them to release it as soon as possible.
 * - The lock attempt continues until the specified timeout is reached. If the timeout expires and the lock is still not
 *   available, an error is thrown to indicate lock acquisition failure.
 *
 * Lock Acquisition and Release:
 * - The `lock` method implements a wait mechanism, allowing a lock request to either succeed when the lock becomes available,
 *   or fail after the timeout period.
 * - The `unlock` method releases a lock, making the resource available for other requests.
 */
export class TusLocker implements Locker {
	lockTimeout: number;
	acquireTimeout: number;

	constructor(options?: { acquireLockTimeout: number; lockTimeout: number }) {
		this.acquireTimeout = options?.acquireLockTimeout ?? 1000 * 30;
		this.lockTimeout = options?.lockTimeout ?? 1000 * 60;
	}

	newLock(id: string) {
		return new KvLock(id, this.lockTimeout, this.acquireTimeout);
	}
}

export class KvLock implements Lock {
	private kv: Kv;
	constructor(
		private id: string,
		private lockTimeout: number = 1000 * 60,
		private acquireTimeout: number = 1000 * 30,
	) {
		this.kv = useLock();
	}

	async lock(signal: AbortSignal, cancelReq: RequestRelease) {
		const abortController = new AbortController();

		const abortSignal = AbortSignal.any([signal, abortController.signal]);

		const lock = await Promise.race([
			waitTimeout(this.acquireTimeout, abortSignal),
			this.acquireLock(this.id, cancelReq, abortSignal),
		]);

		abortController.abort();

		if (!lock) {
			throw ERRORS.ERR_LOCK_TIMEOUT;
		}
	}

	protected async acquireLock(id: string, requestRelease: RequestRelease, signal: AbortSignal): Promise<boolean> {
		const lockTime = await this.kv.get(id);

		if (signal.aborted) {
			return typeof lockTime !== 'undefined';
		}

		const now = Date.now();

		if (!lockTime || Number(lockTime) < now - this.lockTimeout) {
			await this.kv.set(id, now);
			return true;
		}

		await requestRelease();

		return await new Promise((resolve, reject) => {
			// Using setImmediate to:
			// 1. Prevent stack overflow by deferring recursive calls to the next event loop iteration.
			// 2. Allow event loop to process other pending events, maintaining server responsiveness.
			// 3. Ensure fairness in lock acquisition by giving other requests a chance to acquire the lock.
			setImmediate(() => {
				this.acquireLock(id, requestRelease, signal).then(resolve).catch(reject);
			});
		});
	}

	async unlock() {
		await this.kv.delete(this.id);
	}
}

let _locker: Locker | undefined = undefined;

export function getTusLocker() {
	if (!_locker) {
		_locker = new TusLocker();
	}

	return _locker;
}
