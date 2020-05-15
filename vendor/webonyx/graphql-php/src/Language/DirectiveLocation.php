<?php

declare(strict_types=1);

namespace GraphQL\Language;

/**
 * List of available directive locations
 */
class DirectiveLocation
{
    // Request Definitions
    const QUERY               = 'QUERY';
    const MUTATION            = 'MUTATION';
    const SUBSCRIPTION        = 'SUBSCRIPTION';
    const FIELD               = 'FIELD';
    const FRAGMENT_DEFINITION = 'FRAGMENT_DEFINITION';
    const FRAGMENT_SPREAD     = 'FRAGMENT_SPREAD';
    const INLINE_FRAGMENT     = 'INLINE_FRAGMENT';

    // Type System Definitions
    const SCHEMA                 = 'SCHEMA';
    const SCALAR                 = 'SCALAR';
    const OBJECT                 = 'OBJECT';
    const FIELD_DEFINITION       = 'FIELD_DEFINITION';
    const ARGUMENT_DEFINITION    = 'ARGUMENT_DEFINITION';
    const IFACE                  = 'INTERFACE';
    const UNION                  = 'UNION';
    const ENUM                   = 'ENUM';
    const ENUM_VALUE             = 'ENUM_VALUE';
    const INPUT_OBJECT           = 'INPUT_OBJECT';
    const INPUT_FIELD_DEFINITION = 'INPUT_FIELD_DEFINITION';

    /** @var string[] */
    private static $locations = [
        self::QUERY => self::QUERY,
        self::MUTATION => self::MUTATION,
        self::SUBSCRIPTION => self::SUBSCRIPTION,
        self::FIELD => self::FIELD,
        self::FRAGMENT_DEFINITION => self::FRAGMENT_DEFINITION,
        self::FRAGMENT_SPREAD => self::FRAGMENT_SPREAD,
        self::INLINE_FRAGMENT => self::INLINE_FRAGMENT,
        self::SCHEMA => self::SCHEMA,
        self::SCALAR => self::SCALAR,
        self::OBJECT => self::OBJECT,
        self::FIELD_DEFINITION => self::FIELD_DEFINITION,
        self::ARGUMENT_DEFINITION => self::ARGUMENT_DEFINITION,
        self::IFACE => self::IFACE,
        self::UNION => self::UNION,
        self::ENUM => self::ENUM,
        self::ENUM_VALUE => self::ENUM_VALUE,
        self::INPUT_OBJECT => self::INPUT_OBJECT,
        self::INPUT_FIELD_DEFINITION => self::INPUT_FIELD_DEFINITION,
    ];

    /**
     * @param string $name
     *
     * @return bool
     */
    public static function has($name)
    {
        return isset(self::$locations[$name]);
    }
}
