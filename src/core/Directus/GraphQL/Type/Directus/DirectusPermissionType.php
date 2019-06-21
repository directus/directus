<?php
namespace Directus\GraphQL\Type\Directus;

use Directus\Application\Application;
use Directus\GraphQL\Types;
use GraphQL\Type\Definition\ObjectType;
use GraphQL\Type\Definition\ResolveInfo;

class DirectusPermissionType extends ObjectType
{
    private $container;
    public function __construct()
    {
        $this->container = Application::getInstance()->getContainer();
        $config = [
            'name' => 'DirectusPermissionItem',
            'fields' =>  function () {
                return [
                    'id' => Types::id(),
                    'collection' => Types::string(), //TODO:: change to m2o relation with DirectusCollectionType.
                    'role' => Types::int(), //TODO:: Change to m2o relation with DirectusRoleType.
                    'status' => Types::string(),
                    'create' => Types::string(),
                    'read' => Types::string(),
                    'update' => Types::string(),
                    'delete' => Types::string(),
                    'comment' => Types::string(),
                    'explain' => Types::string(),
                    'status_blacklist' => Types::listOf(Types::string()),
                    'read_field_blacklist' => Types::listOf(Types::string()),
                    'write_field_blacklist' => Types::listOf(Types::string())
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
