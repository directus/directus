<?php

declare(strict_types=1);

namespace GraphQL\Executor;

use GraphQL\Executor\Promise\Promise;

interface ExecutorImplementation
{
    /**
     * Returns promise of {@link ExecutionResult}. Promise should always resolve, never reject.
     */
    public function doExecute() : Promise;
}
