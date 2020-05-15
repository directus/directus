<?php

declare(strict_types=1);

namespace GraphQL\Language\AST;

class VariableNode extends Node implements ValueNode
{
    /** @var string */
    public $kind = NodeKind::VARIABLE;

    /** @var NameNode */
    public $name;
}
