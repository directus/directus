<?php

declare(strict_types=1);

namespace GraphQL\Executor\Promise\Adapter;

use Exception;
use GraphQL\Executor\ExecutionResult;
use GraphQL\Utils\Utils;
use SplQueue;
use Throwable;
use function is_object;
use function method_exists;

/**
 * Simplistic (yet full-featured) implementation of Promises A+ spec for regular PHP `sync` mode
 * (using queue to defer promises execution)
 */
class SyncPromise
{
    const PENDING   = 'pending';
    const FULFILLED = 'fulfilled';
    const REJECTED  = 'rejected';

    /** @var SplQueue */
    public static $queue;

    /** @var string */
    public $state = self::PENDING;

    /** @var ExecutionResult|Throwable */
    public $result;

    /**
     * Promises created in `then` method of this promise and awaiting for resolution of this promise
     *
     * @var mixed[][]
     */
    private $waiting = [];

    public static function runQueue()
    {
        $q = self::$queue;
        while ($q && ! $q->isEmpty()) {
            $task = $q->dequeue();
            $task();
        }
    }

    public function resolve($value)
    {
        switch ($this->state) {
            case self::PENDING:
                if ($value === $this) {
                    throw new Exception('Cannot resolve promise with self');
                }
                if (is_object($value) && method_exists($value, 'then')) {
                    $value->then(
                        function ($resolvedValue) {
                            $this->resolve($resolvedValue);
                        },
                        function ($reason) {
                            $this->reject($reason);
                        }
                    );

                    return $this;
                }

                $this->state  = self::FULFILLED;
                $this->result = $value;
                $this->enqueueWaitingPromises();
                break;
            case self::FULFILLED:
                if ($this->result !== $value) {
                    throw new Exception('Cannot change value of fulfilled promise');
                }
                break;
            case self::REJECTED:
                throw new Exception('Cannot resolve rejected promise');
        }

        return $this;
    }

    public function reject($reason)
    {
        if (! $reason instanceof Exception && ! $reason instanceof Throwable) {
            throw new Exception('SyncPromise::reject() has to be called with an instance of \Throwable');
        }

        switch ($this->state) {
            case self::PENDING:
                $this->state  = self::REJECTED;
                $this->result = $reason;
                $this->enqueueWaitingPromises();
                break;
            case self::REJECTED:
                if ($reason !== $this->result) {
                    throw new Exception('Cannot change rejection reason');
                }
                break;
            case self::FULFILLED:
                throw new Exception('Cannot reject fulfilled promise');
        }

        return $this;
    }

    private function enqueueWaitingPromises()
    {
        Utils::invariant(
            $this->state !== self::PENDING,
            'Cannot enqueue derived promises when parent is still pending'
        );

        foreach ($this->waiting as $descriptor) {
            self::getQueue()->enqueue(function () use ($descriptor) {
                /** @var $promise self */
                [$promise, $onFulfilled, $onRejected] = $descriptor;

                if ($this->state === self::FULFILLED) {
                    try {
                        $promise->resolve($onFulfilled === null ? $this->result : $onFulfilled($this->result));
                    } catch (Exception $e) {
                        $promise->reject($e);
                    } catch (Throwable $e) {
                        $promise->reject($e);
                    }
                } elseif ($this->state === self::REJECTED) {
                    try {
                        if ($onRejected === null) {
                            $promise->reject($this->result);
                        } else {
                            $promise->resolve($onRejected($this->result));
                        }
                    } catch (Exception $e) {
                        $promise->reject($e);
                    } catch (Throwable $e) {
                        $promise->reject($e);
                    }
                }
            });
        }
        $this->waiting = [];
    }

    public static function getQueue()
    {
        return self::$queue ?: self::$queue = new SplQueue();
    }

    public function then(?callable $onFulfilled = null, ?callable $onRejected = null)
    {
        if ($this->state === self::REJECTED && ! $onRejected) {
            return $this;
        }
        if ($this->state === self::FULFILLED && ! $onFulfilled) {
            return $this;
        }
        $tmp             = new self();
        $this->waiting[] = [$tmp, $onFulfilled, $onRejected];

        if ($this->state !== self::PENDING) {
            $this->enqueueWaitingPromises();
        }

        return $tmp;
    }
}
