<?php
namespace GraphQL\Examples\Blog\Data;


use GraphQL\Utils\Utils;

class Comment
{
    public $id;

    public $authorId;

    public $storyId;

    public $parentId;

    public $body;

    public $isAnonymous;

    public function __construct(array $data)
    {
        Utils::assign($this, $data);
    }
}
