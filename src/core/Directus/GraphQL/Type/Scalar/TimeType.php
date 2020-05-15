<?php
namespace Directus\GraphQL\Type\Scalar;

use GraphQL\Type\Definition\ScalarType;

class TimeType extends ScalarType
{

    public $name = 'Time';

    public $description = 'Time scalar type.';

    public function serialize($value)
    {
        return $value;
    }

    public function parseValue($value)
    {
        return $value;
    }

    public function parseLiteral($valueNode, array $variables = null)
    {
        return $valueNode->value;
    }
}
