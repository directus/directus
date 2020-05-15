<?php

declare(strict_types=1);

namespace GraphQL\Experimental\Executor;

use GraphQL\Language\AST\ValueNode;
use GraphQL\Type\Definition\InputType;

/**
 * @internal
 */
interface Runtime
{
    public function evaluate(ValueNode $valueNode, InputType $type);

    public function addError($error);
}
