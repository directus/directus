<?php

declare(strict_types=1);

namespace GraphQL\Language\AST;

/**
 * export type ExecutableDefinitionNode =
 *   | OperationDefinitionNode
 *   | FragmentDefinitionNode;
 */
interface ExecutableDefinitionNode extends DefinitionNode
{
}
