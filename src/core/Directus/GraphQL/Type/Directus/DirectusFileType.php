<?php
namespace Directus\GraphQL\Type\Directus;

use Directus\Application\Application;
use Directus\GraphQL\Types;
use GraphQL\Type\Definition\ObjectType;
use GraphQL\Type\Definition\ResolveInfo;

class DirectusFileType extends ObjectType
{
    private $container;
    public function __construct()
    {
        $this->container = Application::getInstance()->getContainer();
        $config = [
            'name' => 'DirectusFileItem',
            'fields' =>  function () {
                /* Create a callable function to support Recurring and circular types like uploaded_by
                *  More info https://webonyx.github.io/graphql-php/type-system/object-types/#recurring-and-circular-types
                */
                return [
                    'id' => Types::id(),
                    'filename_disk' => Types::string(),
                    'title' => Types::string(),
                    'description' => Types::string(),
                    'location' => Types::string(),
                    'tags' => Types::listOf(Types::string()),
                    'width' => Types::int(),
                    'height' => Types::int(),
                    'filesize' => Types::int(),
                    'duration' => Types::string(),
                    'metadata' => Types::string(),
                    'type' => Types::string(),
                    'charset' => Types::string(),
                    'embed' => Types::string(),
                    'storage' => Types::string(),
                    'full_url' => Types::string(),
                    'url' => Types::string(),
                    'thumbnails' => Types::listOf(Types::directusFileThumbnail()),
                    'uploaded_on' => Types::datetime(),
                    'uploaded_by' => Types::directusUser(),
                    'checksum' => Types::string(),
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
