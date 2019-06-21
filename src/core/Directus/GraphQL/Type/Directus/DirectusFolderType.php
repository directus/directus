<?php
namespace Directus\GraphQL\Type\Directus;

use Directus\Application\Application;
use Directus\GraphQL\Types;
use GraphQL\Type\Definition\ObjectType;
use GraphQL\Type\Definition\ResolveInfo;

class DirectusFolderType extends ObjectType
{
    private $container;
    public function __construct()
    {
        $this->container = Application::getInstance()->getContainer();
        $config = [
            'name' => 'DirectusFolderItem',
            'fields' =>  function () {
                return [
                    'id' => Types::id(),
                    'name' => Types::string(),
                    'parent_folder' => Types::string()
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

    public function resolveFull_url($value)
    {
        return $value['data']['full_url'];
    }

    public function resolveUrl($value)
    {
        return $value['data']['url'];
    }

    public function resolveThumbnails($value)
    {
        return $value['data']['thumbnails'];
    }

    public function resolveUploaded_by($value)
    {
        return $value['uploaded_by'];
    }
}
