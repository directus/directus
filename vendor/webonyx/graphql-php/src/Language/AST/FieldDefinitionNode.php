<?php

declare(strict_types=1);

namespace GraphQL\Language\AST;

class FieldDefinitionNode extends Node
{
    /** @var string */
    public $kind = NodeKind::FIELD_DEFINITION;

    /** @var NameNode */
    public $name;

    /** @var InputValueDefinitionNode[]|NodeList */
    public $arguments;

    /** @var TypeNode */
    public $type;

    /** @var DirectiveNode[]|NodeList */
    public $directives;

    /** @var StringValueNode|null */
    public $description;
}
