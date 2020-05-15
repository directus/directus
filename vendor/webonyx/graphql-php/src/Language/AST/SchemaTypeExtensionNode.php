<?php

declare(strict_types=1);

namespace GraphQL\Language\AST;

class SchemaTypeExtensionNode extends Node implements TypeExtensionNode
{
    /** @var string */
    public $kind = NodeKind::SCHEMA_EXTENSION;

    /** @var DirectiveNode[]|null */
    public $directives;

    /** @var OperationTypeDefinitionNode[]|null */
    public $operationTypes;
}
