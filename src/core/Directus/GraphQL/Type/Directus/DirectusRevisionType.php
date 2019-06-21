<?php
namespace Directus\GraphQL\Type\Directus;

use Directus\Application\Application;
use Directus\GraphQL\Types;
use GraphQL\Type\Definition\ObjectType;
use GraphQL\Type\Definition\ResolveInfo;

class DirectusRevisionType extends ObjectType
{
    private $container;
    public function __construct()
    {
        $this->container = Application::getInstance()->getContainer();
        $config = [
            'name' => 'DirectusRevisionItem',
            'fields' =>  function () {
                return [
                    'id' => Types::id(),
                    'activity' => Types::directusActivity(),
                    'collection' => Types::string(), //TODO:: change to m2o relation with DirectusCollectionType.
                    'item' => Types::string(),
                    'data' => Types::json(),
                    'delta' => Types::json(),
                    'parent_item' => Types::string(),
                    'parent_collection' => Types::string(),
                    'parent_changed' => Types::boolean()
                ];
            },
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
