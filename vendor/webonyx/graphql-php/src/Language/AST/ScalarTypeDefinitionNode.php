<?php

declare(strict_types=1);

namespace GraphQL\Language\AST;

class ScalarTypeDefinitionNode extends Node implements TypeDefinitionNode
{
    /** @var string */
    public $kind = NodeKind::SCALAR_TYPE_DEFINITION;

    /** @var NameNode */
    public $name;

    /** @var DirectiveNode[] */
    public $directives;

    /** @var StringValueNode|null */
    public $description;
}
