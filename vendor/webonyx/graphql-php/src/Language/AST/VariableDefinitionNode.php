<?php

declare(strict_types=1);

namespace GraphQL\Language\AST;

class VariableDefinitionNode extends Node implements DefinitionNode
{
    /** @var string */
    public $kind = NodeKind::VARIABLE_DEFINITION;

    /** @var VariableNode */
    public $variable;

    /** @var TypeNode */
    public $type;

    /** @var ValueNode|null */
    public $defaultValue;
}
