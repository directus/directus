<?php

declare(strict_types=1);

namespace GraphQL\Language\AST;

class EnumTypeExtensionNode extends Node implements TypeExtensionNode
{
    /** @var string */
    public $kind = NodeKind::ENUM_TYPE_EXTENSION;

    /** @var NameNode */
    public $name;

    /** @var DirectiveNode[]|null */
    public $directives;

    /** @var EnumValueDefinitionNode[]|null */
    public $values;
}
