<?php
namespace Directus\GraphQL\Type;

use GraphQL\Type\Definition\ObjectType;
use Directus\GraphQL\Types;
use GraphQL\Type\Definition\ResolveInfo;

class MetaType extends ObjectType
{
    public function __construct()
    {
        $config = [
            'name' => 'Metadata',
            'fields' => [
                'collection' => Types::string(),
                'type' => Types::string(),
                'result_count' => Types::int(),
                'total_count' => Types::int(),
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
