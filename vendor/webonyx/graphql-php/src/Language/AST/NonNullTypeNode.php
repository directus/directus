<?php

declare(strict_types=1);

namespace GraphQL\Language\AST;

class NonNullTypeNode extends Node implements TypeNode
{
    /** @var string */
    public $kind = NodeKind::NON_NULL_TYPE;

    /** @var NameNode | ListTypeNode */
    public $type;
}
