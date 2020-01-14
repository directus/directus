<?php

namespace Directus\Database\Schema;

final class DataTypes
{
    const TYPE_ALIAS                = 'alias';
    const TYPE_ARRAY                = 'array';
    const TYPE_BOOLEAN              = 'boolean';
    const TYPE_BINARY               = 'binary';
    const TYPE_DATETIME             = 'datetime';
    const TYPE_DATE                 = 'date';
    const TYPE_TIME                 = 'time';
    const TYPE_FILE                 = 'file';
    const TYPE_HASH                 = 'hash';
    const TYPE_GROUP                = 'group';
    const TYPE_INTEGER              = 'integer';
    const TYPE_DECIMAL              = 'decimal';
    const TYPE_JSON                 = 'json';
    const TYPE_LANG                 = 'lang';
    const TYPE_M2O                  = 'm2o';
    const TYPE_O2M                  = 'o2m';
    const TYPE_SLUG                 = 'slug';
    const TYPE_SORT                 = 'sort';
    const TYPE_STATUS               = 'status';
    const TYPE_STRING               = 'string';
    const TYPE_TRANSLATION          = 'translation';
    const TYPE_UUID                 = 'uuid';
    const TYPE_DATETIME_CREATED     = 'datetime_created';
    const TYPE_DATETIME_UPDATED     = 'datetime_updated';
    const TYPE_OWNER                = 'owner';
    const TYPE_USER_UPDATED         = 'user_updated';
    const TYPE_USER                 = 'user';

    /**
     * Returns a list all data types
     *
     * @return array
     */
    public static function getAllTypes()
    {
        return [
            static::TYPE_ALIAS,
            static::TYPE_ARRAY,
            static::TYPE_BINARY,
            static::TYPE_BOOLEAN,
            static::TYPE_DATETIME,
            static::TYPE_DATE,
            static::TYPE_TIME,
            static::TYPE_FILE,
            static::TYPE_HASH,
            static::TYPE_GROUP,
            static::TYPE_INTEGER,
            static::TYPE_DECIMAL,
            static::TYPE_JSON,
            static::TYPE_LANG,
            static::TYPE_M2O,
            static::TYPE_O2M,
            static::TYPE_SLUG,
            static::TYPE_SORT,
            static::TYPE_STATUS,
            static::TYPE_STRING,
            static::TYPE_TRANSLATION,
            static::TYPE_UUID,
            static::TYPE_DATETIME_CREATED,
            static::TYPE_DATETIME_UPDATED,
            static::TYPE_OWNER,
            static::TYPE_USER_UPDATED,
            static::TYPE_USER,
        ];
    }

    /**
     * Checks whether or not the given type is a array type
     *
     * @param string $type
     *
     * @return bool
     */
    public static function isArray($type)
    {
        return strtolower($type) === static::TYPE_ARRAY;
    }

    /**
     * Checks whether or not the given type is a boolean type
     *
     * @param string $type
     *
     * @return bool
     */
    public static function isBoolean($type)
    {
        return strtolower($type) === static::TYPE_BOOLEAN;
    }

    /**
     * Checks whether or not the given type is a json type
     *
     * @param string $type
     *
     * @return bool
     */
    public static function isJson($type)
    {
        return strtolower($type) === static::TYPE_JSON;
    }

    /**
     * Checks whether or not the given type is a string type
     *
     * @param string $type
     *
     * @return bool
     */
    public static function isStringType($type)
    {
        return strtolower($type) === static::TYPE_STRING;
    }

    /**
     * Checks whether or not the given type is a slug type
     *
     * @param string $type
     *
     * @return bool
     */
    public static function isSlugType($type)
    {
        return strtolower($type) === static::TYPE_SLUG;
    }

    /**
     * Checks whether or not the given type is a hash type
     *
     * @param string $type
     *
     * @return bool
     */
    public static function isHashType($type)
    {
        return strtolower($type) === static::TYPE_HASH;
    }

    /**
     * Returns a list of Date/Time data types
     *
     * @return array
     */
    public static function getDateTimeTypes()
    {
        return array_merge(static::getSystemDateTimeTypes(), [
            static::TYPE_DATETIME,
        ]);
    }

    /**
     * Checks whether or not the given type is a datetime type
     *
     * @param string $type
     *
     * @return bool
     */
    public static function isDateTimeType($type)
    {
        return in_array(strtolower($type), static::getDateTimeTypes());
    }

    /**
     * Checks whether or not the given type is a date type
     *
     * @param string $type
     *
     * @return bool
     */
    public static function isDateType($type)
    {
        return strtolower($type) === static::TYPE_DATE;
    }

    /**
     * Checks whether or not the given type is a time type
     *
     * @param string $type
     *
     * @return bool
     */
    public static function isTimeType($type)
    {
        return strtolower($type) === static::TYPE_TIME;
    }

    /**
     * Checks whether or not the given type is a numeric type
     *
     * @param string $type
     *
     * @return bool
     */
    public static function isNumericType($type)
    {
        return in_array(strtolower($type), static::getNumericTypes());
    }

    /**
     * Checks whether or not the given type is a integer type
     *
     * @param string $type
     *
     * @return bool
     */
    public static function isInteger($type)
    {
        return strtolower($type) === static::TYPE_INTEGER;
    }

    /**
     * Checks whether or not the given type is a decimal type
     *
     * @param string $type
     *
     * @return bool
     */
    public static function isDecimal($type)
    {
        return strtolower($type) === static::TYPE_DECIMAL;
    }

    /**
     * Returns all numeric types
     *
     * @return array
     */
    public static function getNumericTypes()
    {
        return [
            static::TYPE_INTEGER,
            static::TYPE_DECIMAL,
        ];
    }

    /**
     * Returns all the alias data types
     *
     * @return array
     */
    public static function getAliasTypes()
    {
        return [
            static::TYPE_ALIAS,
            static::TYPE_O2M,
            static::TYPE_GROUP,
            static::TYPE_TRANSLATION
        ];
    }

    /**
     * Checks whether the given type is an alias type
     *
     * @param string $type
     *
     * @return bool
     */
    public static function isAliasType($type)
    {
        return in_array(strtolower($type), static::getAliasTypes());
    }

    /**
     * Returns all the o2m data types
     *
     * @return array
     */
    public static function getO2MTypes()
    {
        return [
            static::TYPE_O2M,
            static::TYPE_TRANSLATION
        ];
    }

    /**
     * Checks whether the given type is an o2m type
     *
     * @param string $type
     *
     * @return bool
     */
    public static function isO2MType($type)
    {
        return in_array(strtolower($type), static::getO2MTypes());
    }

    /**
     * Returns all the files type
     *
     * @return array
     */
    public static function getFilesType()
    {
        return [
            static::TYPE_FILE
        ];
    }

    /**
     * Checks whether or not the given type is file type
     *
     * @param string $type
     *
     * @return bool
     */
    public static function isFilesType($type)
    {
        return in_array(strtolower($type), static::getFilesType());
    }

    /**
     * Returns all the system datetime types
     *
     * @return array
     */
    public static function getSystemDateTimeTypes()
    {
        return [
            static::TYPE_DATETIME_CREATED,
            static::TYPE_DATETIME_UPDATED
        ];
    }
    /**
     * Returns all the system user types
     *
     * @return array
     */
    public static function getSystemUserType()
    {
        return [
            static::TYPE_OWNER,
            static::TYPE_USER_UPDATED
        ];
    }

    /**
     * Checks whether or not the given type is system datetime type
     *
     * @param string $type
     *
     * @return bool
     */
    public static function isSystemDateTimeType($type)
    {
        return in_array(strtolower($type), static::getSystemDateTimeTypes());
    }

    /**
     * Checks whether or not the given type is system user type
     *
     * @param string $type
     *
     * @return bool
     */
    public static function isSystemUserType($type)
    {
        return in_array(strtolower($type), static::getSystemUserType());
    }

    /**
     * Checks whether or not the given type is status type
     *
     * @param string $type
     *
     * @return bool
     */
    public static function isStatusType($type)
    {
        return strtolower($type) === static::TYPE_STATUS;
    }

    /**
     * Returns all the unique data types
     *
     * Only one of these types can exists per collection
     *
     * @return array
     */
    public static function getUniqueTypes()
    {
        return array_merge([
            static::TYPE_OWNER,
            static::TYPE_USER_UPDATED,
            static::TYPE_STATUS,
            static::TYPE_SORT,
            static::TYPE_LANG,
        ], static::getSystemDateTimeTypes());
    }

    /**
     * @param string $type
     *
     * @return bool
     */
    public static function isUniqueType($type)
    {
        return in_array(strtolower($type), static::getUniqueTypes());
    }

    /**
     * Checks whether the given type is translations type
     *
     * @param string $type
     *
     * @return bool
     */
    public static function isTranslationsType($type)
    {
        return static::equals(static::TYPE_TRANSLATION, $type);
    }

    /**
     * Checks whether the given type is lang type
     *
     * @param string $type
     *
     * @return bool
     */
    public static function isLangType($type)
    {
        return static::equals(static::TYPE_LANG, $type);
    }

    /**
     * Returns all users type
     *
     * @return array
     */
    public static function getUsersType()
    {
        return [
            static::TYPE_OWNER,
            static::TYPE_USER_UPDATED,
            static::TYPE_USER,
        ];
    }

    /**
     * Checks whether or not the given type is user type
     *
     * @param string $type
     *
     * @return bool
     */
    public static function isUsersType($type)
    {
        return in_array(strtolower($type), static::getUsersType());
    }

    /**
     * Checks whether or not a given type exists
     *
     * @param string $type
     *
     * @return bool
     */
    public static function exists($type)
    {
        return in_array(strtolower($type), static::getAllTypes());
    }

    /**
     * Compare if two types are equal
     *
     * @param string $typeA
     * @param string $typeB
     *
     * @return bool
     */
    public static function equals($typeA, $typeB)
    {
        return strtolower($typeA) === strtolower($typeB);
    }
}
