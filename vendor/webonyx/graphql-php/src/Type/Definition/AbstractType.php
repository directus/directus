<?php

declare(strict_types=1);

namespace GraphQL\Type\Definition;

/*
export type GraphQLAbstractType =
GraphQLInterfaceType |
GraphQLUnionType;
*/

interface AbstractType
{
    /**
     * Resolves concrete ObjectType for given object value
     *
     * @param object  $objectValue
     * @param mixed[] $context
     *
     * @return mixed
     */
    public function resolveType($objectValue, $context, ResolveInfo $info);
}
