<?php

namespace Doctrine\Instantiator\Exception;

use Exception;
use ReflectionClass;
use UnexpectedValueException as BaseUnexpectedValueException;
use function sprintf;

/**
 * Exception for given parameters causing invalid/unexpected state on instantiation
 */
class UnexpectedValueException extends BaseUnexpectedValueException implements ExceptionInterface
{
    public static function fromSerializationTriggeredException(
        ReflectionClass $reflectionClass,
        Exception $exception
    ) : self {
        return new self(
            sprintf(
                'An exception was raised while trying to instantiate an instance of "%s" via un-serialization',
                $reflectionClass->getName()
            ),
            0,
            $exception
        );
    }

    public static function fromUncleanUnSerialization(
        ReflectionClass $reflectionClass,
        string $errorString,
        int $errorCode,
        string $errorFile,
        int $errorLine
    ) : self {
        return new self(
            sprintf(
                'Could not produce an instance of "%s" via un-serialization, since an error was triggered '
                . 'in file "%s" at line "%d"',
                $reflectionClass->getName(),
                $errorFile,
                $errorLine
            ),
            0,
            new Exception($errorString, $errorCode)
        );
    }
}
