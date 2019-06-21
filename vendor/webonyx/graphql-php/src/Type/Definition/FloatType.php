<?php

declare(strict_types=1);

namespace GraphQL\Type\Definition;

use Exception;
use GraphQL\Error\Error;
use GraphQL\Language\AST\FloatValueNode;
use GraphQL\Language\AST\IntValueNode;
use GraphQL\Language\AST\Node;
use GraphQL\Utils\Utils;
use function is_numeric;

class FloatType extends ScalarType
{
    /** @var string */
    public $name = Type::FLOAT;

    /** @var string */
    public $description =
        'The `Float` scalar type represents signed double-precision fractional
values as specified by
[IEEE 754](http://en.wikipedia.org/wiki/IEEE_floating_point). ';

    /**
     * @param mixed $value
     *
     * @return float|null
     *
     * @throws Error
     */
    public function serialize($value)
    {
        return $this->coerceFloat($value);
    }

    private function coerceFloat($value)
    {
        if ($value === '') {
            throw new Error(
                'Float cannot represent non numeric value: (empty string)'
            );
        }

        if (! is_numeric($value) && $value !== true && $value !== false) {
            throw new Error(
                'Float cannot represent non numeric value: ' .
                Utils::printSafe($value)
            );
        }

        return (float) $value;
    }

    /**
     * @param mixed $value
     *
     * @return float|null
     *
     * @throws Error
     */
    public function parseValue($value)
    {
        return $this->coerceFloat($value);
    }

    /**
     * @param Node         $valueNode
     * @param mixed[]|null $variables
     *
     * @return float|null
     *
     * @throws Exception
     */
    public function parseLiteral($valueNode, ?array $variables = null)
    {
        if ($valueNode instanceof FloatValueNode || $valueNode instanceof IntValueNode) {
            return (float) $valueNode->value;
        }

        // Intentionally without message, as all information already in wrapped Exception
        throw new Exception();
    }
}
