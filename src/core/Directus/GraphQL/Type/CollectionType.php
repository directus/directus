<?php
namespace Directus\GraphQL\Type;

use GraphQL\Type\Definition\ObjectType;
use Directus\GraphQL\Types;
use GraphQL\Type\Definition\ResolveInfo;
use Directus\Util\StringUtils;

class CollectionType extends ObjectType
{
    public function __construct($type)
    {
        $config = [
            'name' => StringUtils::toPascalCase(substr_replace($type, "", -4)), //Remove the 'item' word from type.
            'fields' => [
                'data' => Types::listOf($type),
                'meta' => Types::meta()
            ],
            'interfaces' => [
                Types::node()
            ],
            'resolveField' => function ($value, $args, $context, ResolveInfo $info) {
                $method = 'resolve' . ucfirst($info->fieldName);
                if (method_exists($this, $method)) {
                    return $this->{$method}($value, $args, $context, $info);
                } else {
                    return $value[$info->fieldName];
                }
            }
        ];
        parent::__construct($config);
    }
}
