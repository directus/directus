<?php

declare(strict_types=1);

namespace GraphQL\Language\AST;

class ObjectFieldNode extends Node
{
    /** @var string */
    public $kind = NodeKind::OBJECT_FIELD;

    /** @var NameNode */
    public $name;

    /** @var ValueNode */
    public $value;
}
