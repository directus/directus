<?php

declare(strict_types=1);

namespace GraphQL\Experimental\Executor;

use Generator;

/**
 * @internal
 */
class Strand
{
    /** @var Generator */
    public $current;

    /** @var Generator[] */
    public $stack;

    /** @var int */
    public $depth;

    /** @var bool|null */
    public $success;

    /** @var mixed */
    public $value;

    public function __construct(Generator $coroutine)
    {
        $this->current = $coroutine;
        $this->stack   = [];
        $this->depth   = 0;
    }
}
