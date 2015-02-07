<?php

/**
 * Ruckusing
 *
 * @category  Ruckusing
 * @package   Ruckusing_Util
 * @author    Cody Caughlan <codycaughlan % gmail . com>
 * @link      https://github.com/ruckus/ruckusing-migrations
 */

/**
 * Ruckusing_Util_Naming
 * This utility class maps class names between their task names, back and forth.
 *
 * This framework relies on conventions which allow us to make certain
 * assumptions.
 *
 * Example valid task names are "db:version" which maps to a PHP class called DB_Version.
 *
 * Namely, underscores are converted to colons, the first part of the task name is upper-cased
 * and the first character of the second part is capitalized.
 *
 * Using this convention one can easily go back and forth between task names and PHP Class names.
 *
 * @category Ruckusing
 * @package  Ruckusing_Util
 * @author   Cody Caughlan <codycaughlan % gmail . com>
 * @link      https://github.com/ruckus/ruckusing-migrations
 */
class Ruckusing_Util_Naming
{
    /**
     * prefix of class name
     *
     * @var string
     */
    const CLASS_NS_PREFIX = 'Task_';

    /**
     * Get the corresponding task from a class name
     *
     * @param string $klass the class name
     *
     * @return string
     */
    public static function task_from_class_name($klass)
    {
        if (! preg_match('/'.self::CLASS_NS_PREFIX.'/', $klass)) {
            throw new Ruckusing_Exception(
                    'The class name must start with ' . self::CLASS_NS_PREFIX,
                    Ruckusing_Exception::INVALID_ARGUMENT
            );
        }
        //strip namespace
        $klass = str_replace(self::CLASS_NS_PREFIX, '', $klass);
        $klass = strtolower($klass);
        $klass = str_replace("_", ":", $klass);

        return $klass;
    }

    /**
     * Convert a task to its corresponding class name
     *
     * @param string $task the task name
     *
     * @return string
     */
    public static function task_to_class_name($task)
    {
        if (false === stripos($task, ':')) {
            throw new Ruckusing_Exception(
                    'Task name (' . $task . ') must be contains ":"',
                    Ruckusing_Exception::INVALID_ARGUMENT
            );
        }

        $parts = explode(":", $task);

        return self::CLASS_NS_PREFIX . ucfirst($parts[0]) . '_' . ucfirst($parts[1]);
    }

    /**
     * Find class from filename
     *
     * @param string $file_name the migration filename
     *
     * @return string
     */
    public static function class_from_file_name($file_name)
    {
        //we could be given either a string or an absolute path
        //deal with it appropriately

        // normalize directory separators first
        $file_name = str_replace(array('/', '\\'), DIRECTORY_SEPARATOR, $file_name);

        $parts = explode(DIRECTORY_SEPARATOR, $file_name);
        $namespace = $parts[count($parts)-2];
        $file_name = substr($parts[count($parts)-1], 0, -4);

        return self::CLASS_NS_PREFIX . ucfirst($namespace) . '_' . ucfirst($file_name);
    }

    /**
     * Find class from migration file
     *
     * @param string $file_name the migration filename
     *
     * @return string
     */
    public static function class_from_migration_file($file_name)
    {
        $className = false;
        if (preg_match('/^(\d+)_(.*)\.php$/', $file_name, $matches)) {
            if ( count($matches) == 3) {
                $className = $matches[2];
            }
        }

        return $className;
    }

    /**
     * Transform to camelcase
     *
     * @param string $str the task name
     *
     * @return string
     */
    public static function camelcase($str)
    {
        $str = preg_replace('/\s+/', '_', $str);
        $parts = explode("_", $str);
        //if there were no spaces in the input string
        //then assume its already camel-cased
        if (count($parts) == 0) {
            return $str;
        }
        $cleaned = "";
        foreach ($parts as $word) {
            $cleaned .= ucfirst($word);
        }

        return $cleaned;
    }

    /**
     * Get an index name
     *
     * @param string $table_name  the table name
     * @param string $column_name the column name
     *
     * @return string
     */
    public static function index_name($table_name, $column_name)
    {
        $name = sprintf("idx_%s", self::underscore($table_name));
        //if the column parameter is an array then the user wants to create a multi-column
        //index
        if (is_array($column_name)) {
            $column_str = join("_and_", $column_name);
        } else {
            $column_str = $column_name;
        }
        $name .= sprintf("_%s", $column_str);

        return $name;
    }

    /**
     * Finds underscore
     *
     * @param string $str the task name
     *
     * @return boolean
     */
    public static function underscore($str)
    {
        $underscored = preg_replace('/\W/', '_', $str);

        return preg_replace('/\_{2,}/', '_', $underscored);
    }

}
