<?php

declare(strict_types=1);

namespace GraphQL\Language\AST;

class InputValueDefinitionNode extends Node
{
    /** @var string */
    public $kind = NodeKind::INPUT_VALUE_DEFINITION;

    /** @var NameNode */
    public $name;

    /** @var TypeNode */
    public $type;

    /** @var ValueNode */
    public $defaultValue;

    /** @var DirectiveNode[] */
    public $directives;

    /** @var StringValueNode|null */
    public $description;
}
