<?php
namespace Directus\GraphQL\Type;

use GraphQL\Type\Definition\InterfaceType;
use Directus\GraphQL\Types;

class NodeType extends InterfaceType
{
    public function __construct()
    {
        $config = [
            'name' => 'Node',
            'fields' => [
                'id' => Types::id()
            ],
            'resolveType' => [$this, 'resolveNodeType']
        ];
        parent::__construct($config);
    }
    public function resolveNodeType($object)
    {
      return Types::DirectusFile();
    }
}