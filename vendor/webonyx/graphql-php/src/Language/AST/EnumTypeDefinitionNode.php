<?php

declare(strict_types=1);

namespace GraphQL\Language\AST;

class EnumTypeDefinitionNode extends Node implements TypeDefinitionNode
{
    /** @var string */
    public $kind = NodeKind::ENUM_TYPE_DEFINITION;

    /** @var NameNode */
    public $name;

    /** @var DirectiveNode[] */
    public $directives;

    /** @var EnumValueDefinitionNode[]|NodeList|null */
    public $values;

    /** @var StringValueNode|null */
    public $description;
}
