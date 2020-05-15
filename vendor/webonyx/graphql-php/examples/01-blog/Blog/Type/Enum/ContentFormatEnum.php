<?php
namespace GraphQL\Examples\Blog\Type\Enum;

use GraphQL\Type\Definition\EnumType;

class ContentFormatEnum extends EnumType
{
    const FORMAT_TEXT = 'TEXT';
    const FORMAT_HTML = 'HTML';

    public function __construct()
    {
        $config = [
            'name' => 'ContentFormatEnum',
            'values' => [self::FORMAT_TEXT, self::FORMAT_HTML]
        ];
        parent::__construct($config);
    }
}
