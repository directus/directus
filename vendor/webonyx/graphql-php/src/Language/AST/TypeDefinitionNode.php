<?php

declare(strict_types=1);

namespace GraphQL\Language\AST;

/**
 * export type TypeDefinitionNode = ScalarTypeDefinitionNode
 * | ObjectTypeDefinitionNode
 * | InterfaceTypeDefinitionNode
 * | UnionTypeDefinitionNode
 * | EnumTypeDefinitionNode
 * | InputObjectTypeDefinitionNode
 */
interface TypeDefinitionNode extends TypeSystemDefinitionNode
{
}
