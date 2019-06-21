<?php

declare(strict_types=1);

namespace GraphQL\Type\Definition;

use GraphQL\Utils\Utils;

class NonNull extends Type implements WrappingType, OutputType, InputType
{
    /** @var NullableType */
    private $ofType;

    /**
     * @param NullableType $type
     */
    public function __construct($type)
    {
        $this->ofType = self::assertNullableType($type);
    }

    /**
     * @param mixed $type
     *
     * @return NullableType
     */
    public static function assertNullableType($type)
    {
        Utils::invariant(
            Type::isType($type) && ! $type instanceof self,
            'Expected ' . Utils::printSafe($type) . ' to be a GraphQL nullable type.'
        );

        return $type;
    }

    /**
     * @param mixed $type
     *
     * @return self
     */
    public static function assertNullType($type)
    {
        Utils::invariant(
            $type instanceof self,
            'Expected ' . Utils::printSafe($type) . ' to be a GraphQL Non-Null type.'
        );

        return $type;
    }

    /**
     * @return string
     */
    public function toString()
    {
        return $this->getWrappedType()->toString() . '!';
    }

    /**
     * @param bool $recurse
     *
     * @return Type
     */
    public function getWrappedType($recurse = false)
    {
        $type = $this->ofType;

        return $recurse && $type instanceof WrappingType ? $type->getWrappedType($recurse) : $type;
    }
}
