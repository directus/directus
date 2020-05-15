<?php

declare(strict_types=1);

namespace GraphQL\Language\AST;

class OperationTypeDefinitionNode extends Node
{
    /** @var string */
    public $kind = NodeKind::OPERATION_TYPE_DEFINITION;

    /**
     * One of 'query' | 'mutation' | 'subscription'
     *
     * @var string
     */
    public $operation;

    /** @var NamedTypeNode */
    public $type;
}
