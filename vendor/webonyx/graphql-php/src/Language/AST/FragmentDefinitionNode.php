<?php

declare(strict_types=1);

namespace GraphQL\Language\AST;

class FragmentDefinitionNode extends Node implements ExecutableDefinitionNode, HasSelectionSet
{
    /** @var string */
    public $kind = NodeKind::FRAGMENT_DEFINITION;

    /** @var NameNode */
    public $name;

    /**
     * Note: fragment variable definitions are experimental and may be changed
     * or removed in the future.
     *
     * @var VariableDefinitionNode[]|NodeList
     */
    public $variableDefinitions;

    /** @var NamedTypeNode */
    public $typeCondition;

    /** @var DirectiveNode[]|NodeList */
    public $directives;

    /** @var SelectionSetNode */
    public $selectionSet;
}
