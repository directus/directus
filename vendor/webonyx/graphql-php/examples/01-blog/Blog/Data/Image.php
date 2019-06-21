<?php
namespace GraphQL\Examples\Blog\Data;

use GraphQL\Utils\Utils;

class Image
{
    const TYPE_USERPIC = 'userpic';

    const SIZE_ICON = 'icon';
    const SIZE_SMALL = 'small';
    const SIZE_MEDIUM = 'medium';
    const SIZE_ORIGINAL = 'original';

    public $id;

    public $type;

    public $size;

    public $width;

    public $height;

    public function __construct(array $data)
    {
        Utils::assign($this, $data);
    }
}
