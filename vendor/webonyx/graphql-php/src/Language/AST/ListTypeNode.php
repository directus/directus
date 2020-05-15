<?php

declare(strict_types=1);

namespace GraphQL\Language\AST;

class ListTypeNode extends Node implements TypeNode
{
    /** @var string */
    public $kind = NodeKind::LIST_TYPE;

    /** @var Node */
    public $type;
}
