<?php

declare(strict_types=1);

namespace GraphQL\Language\AST;

class ObjectTypeExtensionNode extends Node implements TypeExtensionNode
{
    /** @var string */
    public $kind = NodeKind::OBJECT_TYPE_EXTENSION;

    /** @var NameNode */
    public $name;

    /** @var NamedTypeNode[] */
    public $interfaces = [];

    /** @var DirectiveNode[] */
    public $directives;

    /** @var FieldDefinitionNode[] */
    public $fields;
}
