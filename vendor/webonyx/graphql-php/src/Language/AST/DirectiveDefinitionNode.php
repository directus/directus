<?php

declare(strict_types=1);

namespace GraphQL\Language\AST;

class DirectiveDefinitionNode extends Node implements TypeSystemDefinitionNode
{
    /** @var string */
    public $kind = NodeKind::DIRECTIVE_DEFINITION;

    /** @var NameNode */
    public $name;

    /** @var ArgumentNode[] */
    public $arguments;

    /** @var NameNode[] */
    public $locations;

    /** @var StringValueNode|null */
    public $description;
}
