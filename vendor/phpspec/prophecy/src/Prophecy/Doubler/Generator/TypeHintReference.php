<?php

namespace Prophecy\Doubler\Generator;

/**
 * Tells whether a keyword refers to a class or to a built-in type for the
 * current version of php
 */
final class TypeHintReference
{
    public function isBuiltInParamTypeHint($type)
    {
        switch ($type) {
            case 'self':
            case 'array':
                return true;

            case 'callable':
                return PHP_VERSION_ID >= 50400;

            case 'bool':
            case 'float':
            case 'int':
            case 'string':
                return PHP_VERSION_ID >= 70000;

            case 'iterable':
                return PHP_VERSION_ID >= 70100;

            case 'object':
                return PHP_VERSION_ID >= 70200;

            default:
                return false;
        }
    }

    public function isBuiltInReturnTypeHint($type)
    {
        if ($type === 'void') {
            return PHP_VERSION_ID >= 70100;
        }

        return $this->isBuiltInParamTypeHint($type);
    }
}
