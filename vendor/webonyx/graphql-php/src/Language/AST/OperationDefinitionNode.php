<?php

declare(strict_types=1);

namespace GraphQL\Language\AST;

class OperationDefinitionNode extends Node implements ExecutableDefinitionNode, HasSelectionSet
{
    /** @var string */
    public $kind = NodeKind::OPERATION_DEFINITION;

    /** @var NameNode */
    public $name;

    /** @var string (oneOf 'query', 'mutation')) */
    public $operation;

    /** @var VariableDefinitionNode[] */
    public $variableDefinitions;

    /** @var DirectiveNode[] */
    public $directives;

    /** @var SelectionSetNode */
    public $selectionSet;
}
