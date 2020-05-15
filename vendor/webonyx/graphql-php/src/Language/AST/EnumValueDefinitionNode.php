<?php

declare(strict_types=1);

namespace GraphQL\Language\AST;

class EnumValueDefinitionNode extends Node
{
    /** @var string */
    public $kind = NodeKind::ENUM_VALUE_DEFINITION;

    /** @var NameNode */
    public $name;

    /** @var DirectiveNode[] */
    public $directives;

    /** @var StringValueNode|null */
    public $description;
}
