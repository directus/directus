import { ERRORS, type Lock, type Locker, type RequestRelease } from '@tus/utils'

/**
 * MemoryLocker is an implementation of the Locker interface that manages locks in memory.
 * This class is designed for exclusive access control over resources, often used in scenarios like upload management.
 *
 * Key Features:
 * - Ensures exclusive resource access by using a memory-based map to track locks.
 * - Implements timeout for lock acquisition, mitigating deadlock situations.
 * - Facilitates both immediate and graceful release of locks through different mechanisms.
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

export interface MemoryLockerOptions {
  acquireLockTimeout: number
}

interface LockEntry {
  requestRelease: RequestRelease
}

export class MemoryLocker implements Locker {
  timeout: number
  locks = new Map<string, LockEntry>()

  constructor(options?: MemoryLockerOptions) {
    this.timeout = options?.acquireLockTimeout ?? 1000 * 30
  }

  newLock(id: string) {
    return new MemoryLock(id, this, this.timeout)
  }
}

class MemoryLock implements Lock {
  constructor(
    private id: string,
    private locker: MemoryLocker,
    private timeout: number = 1000 * 30
  ) {}

  async lock(requestRelease: RequestRelease): Promise<void> {
    const abortController = new AbortController()

    const lock = await Promise.race([
      this.waitTimeout(abortController.signal),
      this.acquireLock(this.id, requestRelease, abortController.signal),
    ])

    abortController.abort()

    if (!lock) {
      throw ERRORS.ERR_LOCK_TIMEOUT
    }
  }

  protected async acquireLock(
    id: string,
    requestRelease: RequestRelease,
    signal: AbortSignal
  ): Promise<boolean> {
    if (signal.aborted) {
      return false
    }

    const lock = this.locker.locks.get(id)

    if (!lock) {
      const lock = {
        requestRelease,
      }

      this.locker.locks.set(id, lock)
      return true
    }

    await lock.requestRelease?.()

    return await new Promise((resolve, reject) => {
      // Using setImmediate to:
      // 1. Prevent stack overflow by deferring recursive calls to the next event loop iteration.
      // 2. Allow event loop to process other pending events, maintaining server responsiveness.
      // 3. Ensure fairness in lock acquisition by giving other requests a chance to acquire the lock.
      setImmediate(() => {
        this.acquireLock(id, requestRelease, signal).then(resolve).catch(reject)
      })
    })
  }

  async unlock(): Promise<void> {
    const lock = this.locker.locks.get(this.id)

    if (!lock) {
      throw new Error('Releasing an unlocked lock!')
    }

    this.locker.locks.delete(this.id)
  }

  protected waitTimeout(signal: AbortSignal) {
    return new Promise<boolean>((resolve) => {
      const timeout = setTimeout(() => {
        resolve(false)
      }, this.timeout)

      const abortListener = () => {
        clearTimeout(timeout)
        signal.removeEventListener('abort', abortListener)
        resolve(false)
      }

      signal.addEventListener('abort', abortListener)
    })
  }
}
