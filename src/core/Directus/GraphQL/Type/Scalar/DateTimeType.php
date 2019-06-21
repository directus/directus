<?php
namespace Directus\GraphQL\Type\Scalar;

use GraphQL\Error\Error;
use GraphQL\Language\AST\StringValueNode;
use GraphQL\Type\Definition\ScalarType;
use GraphQL\Utils\Utils;
use Directus\Util\DateTimeUtils;

class DateTimeType extends ScalarType
{

    public $name = 'Datetime';

    public $description = 'Datetime scalar type.';

    public function serialize($value)
    {
        return $value;
    }

    public function parseValue($value)
    {
        if (DateTimeUtils::isValidDate($value)) {
            throw new Error("Cannot represent following value as datetime: " . Utils::printSafeJson($value));
        }
        return $value;
    }

    public function parseLiteral($valueNode, array $variables = null)
    {
        // Note: throwing GraphQL\Error\Error vs \UnexpectedValueException to benefit from GraphQL
        // error location in query:
        if (!$valueNode instanceof StringValueNode) {
            throw new Error('Query error: Can only parse strings got: ' . $valueNode->kind, [$valueNode]);
        }
        return $valueNode->value;
    }
}
