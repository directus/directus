<?php
namespace Directus\GraphQL\Type\Directus;

use Directus\Application\Application;
use Directus\GraphQL\Types;
use GraphQL\Type\Definition\ObjectType;
use GraphQL\Type\Definition\ResolveInfo;

class DirectusCollectionPresetType extends ObjectType
{
    private $container;
    public function __construct()
    {
        $this->container = Application::getInstance()->getContainer();
        $config = [
            'name' => 'DirectusCollectionPresetItem',
            'fields' =>  function () {
                return [
                    'id' => Types::id(),
                    'title' => Types::string(),
                    'user' => Types::int(), //TODO:: Change the relation with DirectusUserType
                    'role' => Types::int(), //TODO:: Change the relation with DirectusRoleType.
                    'collection' => Types::string(), //TODO:: change to m2o relation with DirectusCollectionType.
                    'search_query' => Types::string(),
                    'filters' => Types::json(),
                    'view_options' => Types::json(),
                    'view_type' => Types::string(),
                    'view_query' => Types::json(),
                    'translation' => Types::string(),
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
