<?php

declare(strict_types=1);

namespace GraphQL\Type\Definition;

class ListOfType extends Type implements WrappingType, OutputType, NullableType, InputType
{
    /** @var ObjectType|InterfaceType|UnionType|ScalarType|InputObjectType|EnumType */
    public $ofType;

    /**
     * @param callable|Type $type
     */
    public function __construct($type)
    {
        $this->ofType = Type::assertType($type);
    }

    public function toString() : string
    {
        return '[' . $this->ofType->toString() . ']';
    }

    /**
     * @param bool $recurse
     *
     * @return ObjectType|InterfaceType|UnionType|ScalarType|InputObjectType|EnumType
     */
    public function getWrappedType($recurse = false)
    {
        $type = $this->ofType;

        return $recurse && $type instanceof WrappingType ? $type->getWrappedType($recurse) : $type;
    }
}
