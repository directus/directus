<?php

declare(strict_types=1);

namespace GraphQL\Language\AST;

class ScalarTypeExtensionNode extends Node implements TypeExtensionNode
{
    /** @var string */
    public $kind = NodeKind::SCALAR_TYPE_EXTENSION;

    /** @var NameNode */
    public $name;

    /** @var DirectiveNode[]|null */
    public $directives;
}
