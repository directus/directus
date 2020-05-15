<?php
namespace Directus\GraphQL\Type\Directus;

use GraphQL\Type\Definition\ObjectType;
use Directus\GraphQL\Types;
use GraphQL\Type\Definition\ResolveInfo;

class DirectusUserType extends ObjectType
{
    public function __construct()
    {
        $config = [
            'name' => 'DirectusUserItem',
            'fields' => function () {
                /* Create a callable function to support Recurring and circular types like avatar
                *  More info https://webonyx.github.io/graphql-php/type-system/object-types/#recurring-and-circular-types
                */
                return [
                    'id' => Types::id(),
                    'status' => Types::string(),
                    'first_name' => Types::string(),
                    'last_name' => Types::string(),
                    'email' => Types::string(),
                    'email_notifications' => Types::boolean(),
                    'company' => Types::string(),
                    'title' => Types::string(),
                    'locale' => Types::string(),
                    'high_contrast_mode' => Types::boolean(),
                    'locale_options' => Types::string(),
                    'timezone' => Types::string(),
                    'last_access_on' => Types::datetime(),
                    'last_page' => Types::string(),
                    'token' => Types::string(),
                    'external_id' => Types::string(),
                    'avatar' => Types::directusFile(),
                    'roles' => Types::listOf(Types::directusRole()),
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

    public function resolveRoles($value)
    {
        $data = [];
        foreach ($value['roles'] as $role) {
            $data[] = $role['role'];
        }
        return  $data;
    }
}
