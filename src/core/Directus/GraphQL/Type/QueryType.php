<?php
namespace Directus\GraphQL\Type;

use GraphQL\Type\Definition\ObjectType;
use GraphQL\Type\Definition\ResolveInfo;
use Directus\GraphQL\Collection\UserCollectionList;
use Directus\GraphQL\Collection\DirectusCollectionList;

class QueryType extends ObjectType
{
    public function __construct()
    {
        $directusCollectionList = new DirectusCollectionList();
        $userCollectionList = new UserCollectionList();
        $fields = array_merge($directusCollectionList->list, $userCollectionList->list);

        $config = [
            'name' => 'Query',
            'fields' => $fields,
            'resolveField' => function ($val, $args, $context, ResolveInfo $info) {
                return $this->{$info->fieldName}($val, $args, $context, $info);
            }
        ];
        parent::__construct($config);
    }
}
