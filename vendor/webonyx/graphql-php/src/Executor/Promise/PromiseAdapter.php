<?php

declare(strict_types=1);

namespace GraphQL\Executor\Promise;

use Throwable;

/**
 * Provides a means for integration of async PHP platforms ([related docs](data-fetching.md#async-php))
 */
interface PromiseAdapter
{
    /**
     * Return true if the value is a promise or a deferred of the underlying platform
     *
     * @param mixed $value
     *
     * @return bool
     *
     * @api
     */
    public function isThenable($value);

    /**
     * Converts thenable of the underlying platform into GraphQL\Executor\Promise\Promise instance
     *
     * @param object $thenable
     *
     * @return Promise
     *
     * @api
     */
    public function convertThenable($thenable);

    /**
     * Accepts our Promise wrapper, extracts adopted promise out of it and executes actual `then` logic described
     * in Promises/A+ specs. Then returns new wrapped instance of GraphQL\Executor\Promise\Promise.
     *
     * @return Promise
     *
     * @api
     */
    public function then(Promise $promise, ?callable $onFulfilled = null, ?callable $onRejected = null);

    /**
     * Creates a Promise
     *
     * Expected resolver signature:
     *     function(callable $resolve, callable $reject)
     *
     * @return Promise
     *
     * @api
     */
    public function create(callable $resolver);

    /**
     * Creates a fulfilled Promise for a value if the value is not a promise.
     *
     * @param mixed $value
     *
     * @return Promise
     *
     * @api
     */
    public function createFulfilled($value = null);

    /**
     * Creates a rejected promise for a reason if the reason is not a promise. If
     * the provided reason is a promise, then it is returned as-is.
     *
     * @param Throwable $reason
     *
     * @return Promise
     *
     * @api
     */
    public function createRejected($reason);

    /**
     * Given an array of promises (or values), returns a promise that is fulfilled when all the
     * items in the array are fulfilled.
     *
     * @param Promise[]|mixed[] $promisesOrValues Promises or values.
     *
     * @return Promise
     *
     * @api
     */
    public function all(array $promisesOrValues);
}
