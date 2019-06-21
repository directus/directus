<?php

declare(strict_types=1);

namespace GraphQL;

use Exception;
use GraphQL\Executor\Promise\Adapter\SyncPromise;
use SplQueue;
use Throwable;

class Deferred
{
    /** @var SplQueue|null */
    private static $queue;

    /** @var callable */
    private $callback;

    /** @var SyncPromise */
    public $promise;

    public function __construct(callable $callback)
    {
        $this->callback = $callback;
        $this->promise  = new SyncPromise();
        self::getQueue()->enqueue($this);
    }

    public static function getQueue() : SplQueue
    {
        if (self::$queue === null) {
            self::$queue = new SplQueue();
        }

        return self::$queue;
    }

    public static function runQueue() : void
    {
        $queue = self::getQueue();
        while (! $queue->isEmpty()) {
            /** @var self $dequeuedNodeValue */
            $dequeuedNodeValue = $queue->dequeue();
            $dequeuedNodeValue->run();
        }
    }

    public function then($onFulfilled = null, $onRejected = null)
    {
        return $this->promise->then($onFulfilled, $onRejected);
    }

    public function run() : void
    {
        try {
            $cb = $this->callback;
            $this->promise->resolve($cb());
        } catch (Exception $e) {
            $this->promise->reject($e);
        } catch (Throwable $e) {
            $this->promise->reject($e);
        }
    }
}
