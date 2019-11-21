<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\Component\Console\Command;

use Symfony\Component\Console\Exception\LogicException;
use Symfony\Component\Lock\Lock;
use Symfony\Component\Lock\LockFactory;
use Symfony\Component\Lock\Store\FlockStore;
use Symfony\Component\Lock\Store\SemaphoreStore;

/**
 * Basic lock feature for commands.
 *
 * @author Geoffrey Brier <geoffrey.brier@gmail.com>
 */
trait LockableTrait
{
    /** @var Lock */
    private $lock;

    /**
     * Locks a command.
     */
    private function lock(string $name = null, bool $blocking = false): bool
    {
        if (!class_exists(SemaphoreStore::class)) {
            throw new LogicException('To enable the locking feature you must install the symfony/lock component.');
        }

        if (null !== $this->lock) {
            throw new LogicException('A lock is already in place.');
        }

        if (SemaphoreStore::isSupported()) {
            $store = new SemaphoreStore();
        } else {
            $store = new FlockStore();
        }

        $this->lock = (new LockFactory($store))->createLock($name ?: $this->getName());
        if (!$this->lock->acquire($blocking)) {
            $this->lock = null;

            return false;
        }

        return true;
    }

    /**
     * Releases the command lock if there is one.
     */
    private function release()
    {
        if ($this->lock) {
            $this->lock->release();
            $this->lock = null;
        }
    }
}
