<?php

declare(strict_types=1);

namespace GraphQL\Executor\Promise\Adapter;

use GraphQL\Executor\Promise\Promise;
use GraphQL\Executor\Promise\PromiseAdapter;
use GraphQL\Utils\Utils;
use React\Promise\Promise as ReactPromise;
use React\Promise\PromiseInterface as ReactPromiseInterface;
use function React\Promise\all;
use function React\Promise\reject;
use function React\Promise\resolve;

class ReactPromiseAdapter implements PromiseAdapter
{
    /**
     * @inheritdoc
     */
    public function isThenable($value)
    {
        return $value instanceof ReactPromiseInterface;
    }

    /**
     * @inheritdoc
     */
    public function convertThenable($thenable)
    {
        return new Promise($thenable, $this);
    }

    /**
     * @inheritdoc
     */
    public function then(Promise $promise, ?callable $onFulfilled = null, ?callable $onRejected = null)
    {
        /** @var ReactPromiseInterface $adoptedPromise */
        $adoptedPromise = $promise->adoptedPromise;

        return new Promise($adoptedPromise->then($onFulfilled, $onRejected), $this);
    }

    /**
     * @inheritdoc
     */
    public function create(callable $resolver)
    {
        $promise = new ReactPromise($resolver);

        return new Promise($promise, $this);
    }

    /**
     * @inheritdoc
     */
    public function createFulfilled($value = null)
    {
        $promise = resolve($value);

        return new Promise($promise, $this);
    }

    /**
     * @inheritdoc
     */
    public function createRejected($reason)
    {
        $promise = reject($reason);

        return new Promise($promise, $this);
    }

    /**
     * @inheritdoc
     */
    public function all(array $promisesOrValues)
    {
        // TODO: rework with generators when PHP minimum required version is changed to 5.5+
        $promisesOrValues = Utils::map(
            $promisesOrValues,
            static function ($item) {
                return $item instanceof Promise ? $item->adoptedPromise : $item;
            }
        );

        $promise = all($promisesOrValues)->then(static function ($values) use ($promisesOrValues) {
            $orderedResults = [];

            foreach ($promisesOrValues as $key => $value) {
                $orderedResults[$key] = $values[$key];
            }

            return $orderedResults;
        });

        return new Promise($promise, $this);
    }
}
