<?php

declare(strict_types=1);

namespace GraphQL\Language\AST;

class EnumValueNode extends Node implements ValueNode
{
    /** @var string */
    public $kind = NodeKind::ENUM;

    /** @var string */
    public $value;
}
