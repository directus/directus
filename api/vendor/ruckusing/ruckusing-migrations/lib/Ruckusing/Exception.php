<?php

/**
 * Ruckusing
 *
 * @category  Ruckusing
 * @package   Ruckusing
 * @author    Cody Caughlan <codycaughlan % gmail . com>
 * @author   Salimane Adjao Moustapha <me@salimane.com>
 * @link      https://github.com/ruckus/ruckusing-migrations
 */

/**
 * Ruckusing_Exception
 *
 * @category Ruckusing
 * @package  Ruckusing
 * @author   Cody Caughlan <codycaughlan % gmail . com>
 * @author   Salimane Adjao Moustapha <me@salimane.com>
 * @link     https://github.com/ruckus/ruckusing-migrations
 */
class Ruckusing_Exception extends Exception
{
    const MISSING_SCHEMA_INFO_TABLE = 100;
    const INVALID_INDEX_NAME = 101;
    const MISSING_TABLE = 102;
    const INVALID_ADAPTER = 103;
    const INVALID_ARGUMENT = 104;
    const INVALID_TABLE_DEFINITION = 105;
    const INVALID_TASK = 106;
    const INVALID_LOG = 107;
    const INVALID_CONFIG = 108;
    const INVALID_TARGET_MIGRATION = 109;
    const INVALID_MIGRATION_DIR = 110;
    const INVALID_FRAMEWORK = 111;
    const QUERY_ERROR = 112;
    const INVALID_MIGRATION_METHOD = 113;
    const MIGRATION_FAILED = 114;
    const MIGRATION_NOT_SUPPORTED = 115;
    const INVALID_DB_DIR = 116;

    /**
     * Redefine the exception so message isn't optional
     *
     * @param string    $message
     * @param int       $code[optional]
     * @param Exception $previous[optional]
     *
     * @return Ruckusing_Exception
     */
    public function __construct($message, $code = 0, Exception $previous = null)
    {
        // make sure everything is assigned properly
        if (version_compare(PHP_VERSION, '5.3.0', '>=')) {
            parent::__construct($message, $code, $previous);
        } else {
            parent::__construct($message, $code);
        }
    }

    /**
     * custom string representation of object
     *
     * @return string
     */
    public function __toString()
    {
        return "\n" . basename($this->file) . "({$this->line}) : {$this->message}\n";
    }

    /**
     * Custom error handler
     *
     * @param integer $code
     * @param string  $message
     * @param string  $file
     * @param integer $line
     */
    public static function errorHandler($code, $message, $file, $line)
    {
        file_put_contents('php://stderr', "\n" . basename($file) . "({$line}) : {$message}\n\n");
        if ($code != E_WARNING && $code != E_NOTICE) {
            exit(1);
        }
    }

    /**
     * Custom exception handler
     *
     * @param Exception $exception
     */
    public static function exceptionHandler($exception)
    {
        file_put_contents('php://stderr', "\n" . basename($exception->getFile()) . "({$exception->getLine()}) : {$exception->getMessage()}\n\n");
        exit(1);
    }

}
