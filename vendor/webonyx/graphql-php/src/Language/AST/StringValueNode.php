<?php

declare(strict_types=1);

namespace GraphQL\Language\AST;

class StringValueNode extends Node implements ValueNode
{
    /** @var string */
    public $kind = NodeKind::STRING;

    /** @var string */
    public $value;

    /** @var bool|null */
    public $block;
}
