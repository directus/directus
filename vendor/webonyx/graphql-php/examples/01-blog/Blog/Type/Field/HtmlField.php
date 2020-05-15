<?php
namespace GraphQL\Examples\Blog\Type\Field;

use GraphQL\Examples\Blog\Type\Enum\ContentFormatEnum;
use GraphQL\Examples\Blog\Types;

class HtmlField
{
    public static function build($name, $objectKey = null)
    {
        $objectKey = $objectKey ?: $name;

        // Demonstrates how to organize re-usable fields
        // Usual example: when the same field with same args shows up in different types
        // (for example when it is a part of some interface)
        return [
            'name' => $name,
            'type' => Types::string(),
            'args' => [
                'format' => [
                    'type' => Types::contentFormatEnum(),
                    'defaultValue' => ContentFormatEnum::FORMAT_HTML
                ],
                'maxLength' => Types::int()
            ],
            'resolve' => function($object, $args) use ($objectKey) {
                $html = $object->{$objectKey};
                $text = strip_tags($html);

                if (!empty($args['maxLength'])) {
                    $safeText = mb_substr($text, 0, $args['maxLength']);
                } else {
                    $safeText = $text;
                }

                switch ($args['format']) {
                    case ContentFormatEnum::FORMAT_HTML:
                        if ($safeText !== $text) {
                            // Text was truncated, so just show what's safe:
                            return nl2br($safeText);
                        } else {
                            return $html;
                        }

                    case ContentFormatEnum::FORMAT_TEXT:
                    default:
                        return $safeText;
                }
            }
        ];
    }
}
