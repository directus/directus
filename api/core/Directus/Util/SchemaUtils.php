<?php

namespace Directus\Util;

class SchemaUtils
{
    /**
     * Clean identifier name to into a cleaner name
     * @param $name
     * @return string
     */
    public static function cleanIdentifier($name)
    {
        return preg_replace('/[^a-z0-9-_]+/i', '_', strtolower($name));
    }

    /**
     * Clean column name to into a cleaner name
     * @param $name
     * @return mixed
     */
    public static function cleanColumnName($name)
    {
        return preg_replace('/^[0-9]+/i', '', static::cleanIdentifier($name));
    }

    /**
     * Clean table name to into a cleaner name
     * @param $name
     * @return string
     */
    public static function cleanTableName($name)
    {
        return static::cleanIdentifier($name);
    }
}
