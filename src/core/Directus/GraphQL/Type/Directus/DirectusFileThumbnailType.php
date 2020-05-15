<?php
namespace Directus\GraphQL\Type\Directus;

use GraphQL\Type\Definition\ObjectType;
use Directus\GraphQL\Types;
use GraphQL\Type\Definition\ResolveInfo;

class DirectusFileThumbnailType extends ObjectType
{
    public function __construct()
    {
        $config = [
            'name' => 'DirectusFileThumbnailItem',
            'fields' => [
                'url' => Types::string(),
                'relative_url' => Types::string(),
                'dimension' => Types::string(),
                'width' => Types::int(),
                'height' => Types::int(),
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
