<?php
namespace GraphQL\Examples\Blog\Type;

use GraphQL\Examples\Blog\AppContext;
use GraphQL\Examples\Blog\Data\Image;
use GraphQL\Examples\Blog\Types;
use GraphQL\Type\Definition\EnumType;
use GraphQL\Type\Definition\ObjectType;

class ImageType extends ObjectType
{
    public function __construct()
    {
        $config = [
            'name' => 'ImageType',
            'fields' => [
                'id' => Types::id(),
                'type' => new EnumType([
                    'name' => 'ImageTypeEnum',
                    'values' => [
                        'USERPIC' => Image::TYPE_USERPIC
                    ]
                ]),
                'size' => Types::imageSizeEnum(),
                'width' => Types::int(),
                'height' => Types::int(),
                'url' => [
                    'type' => Types::url(),
                    'resolve' => [$this, 'resolveUrl']
                ],

                // Just for the sake of example
                'fieldWithError' => [
                    'type' => Types::string(),
                    'resolve' => function() {
                        throw new \Exception("Field with exception");
                    }
                ],
                'nonNullFieldWithError' => [
                    'type' => Types::nonNull(Types::string()),
                    'resolve' => function() {
                        throw new \Exception("Non-null field with exception");
                    }
                ]
            ]
        ];

        parent::__construct($config);
    }

    public function resolveUrl(Image $value, $args, AppContext $context)
    {
        switch ($value->type) {
            case Image::TYPE_USERPIC:
                $path = "/images/user/{$value->id}-{$value->size}.jpg";
                break;
            default:
                throw new \UnexpectedValueException("Unexpected image type: " . $value->type);
        }
        return $context->rootUrl . $path;
    }
}
