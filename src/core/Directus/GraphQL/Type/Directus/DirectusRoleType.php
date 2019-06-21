<?php
namespace Directus\GraphQL\Type\Directus;

use GraphQL\Type\Definition\ObjectType;
use Directus\GraphQL\Types;
use GraphQL\Type\Definition\ResolveInfo;

class DirectusRoleType extends ObjectType
{
    public function __construct()
    {
        $config = [
            'name' => 'DirectusRoleItem',
            'fields' => function () {
                return [
                    'id' => Types::id(),
                    'external_id' => Types::string(),
                    'name' => Types::string(),
                    'description' => Types::string(),
                    'ip_whitelist' => Types::string(),
                    'nav_blacklist' => Types::boolean(),
                    'users' => Types::listOf(Types::directusUser()),
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


    public function resolveUsers($value)
    {
        $data = [];
        foreach ($value['users'] as $user) {
            $data[] = $user['user'];
        }
        return  $data;
    }
}
