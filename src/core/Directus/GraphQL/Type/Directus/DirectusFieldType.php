<?php
namespace Directus\GraphQL\Type\Directus;

use Directus\Application\Application;
use Directus\GraphQL\Types;
use GraphQL\Type\Definition\ObjectType;
use GraphQL\Type\Definition\ResolveInfo;

class DirectusFieldType extends ObjectType
{
    private $container;
    public function __construct()
    {
        $this->container = Application::getInstance()->getContainer();
        $config = [
            'name' => 'DirectusFieldItem',
            'fields' =>  function () {
                return [
                    'collection' => Types::directusCollection(),
                    'field' => Types::string(),
                    'type' => Types::string(),
                    'interface' => Types::string(),
                    'options' => Types::json(),
                    'locked' => Types::boolean(),
                    'translation' => Types::json(),
                    'readonly' => Types::boolean(),
                    'required' => Types::boolean(),
                    'sort' => Types::int(),
                    'width' => Types::int(),
                    'validation' => Types::string(),
                    'storage' => Types::int(),
                    'hidden_browse' => Types::int(),
                    'url' => Types::string()
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
