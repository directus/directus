<?php

declare(strict_types=1);

namespace GraphQL\Language\AST;

class NullValueNode extends Node implements ValueNode
{
    /** @var string */
    public $kind = NodeKind::NULL;
}
