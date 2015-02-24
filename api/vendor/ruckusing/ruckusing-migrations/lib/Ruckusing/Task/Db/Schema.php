<?php

/**
 * Ruckusing
 *
 * @category  Ruckusing
 * @package   Task
 * @subpackage Db
 * @author    Cody Caughlan <codycaughlan % gmail . com>
 * @link      https://github.com/ruckus/ruckusing-migrations
 */

/**
 * Task_DB_Schema
 * generic task which dumps the schema of the DB
 * as a text file.
 *
 * @category Ruckusing
 * @package  Task
 * @subpackage Db
 * @author   Cody Caughlan <codycaughlan % gmail . com>
 * @link      https://github.com/ruckus/ruckusing-migrations
 */
class Task_Db_Schema extends Ruckusing_Task_Base implements Ruckusing_Task_Interface
{
    /**
     * Current Adapter
     *
     * @var Ruckusing_Adapter_Base
     */
    private $_adapter = null;

    /**
     * Return executed string
     *
     * @var string
     */
    private $_return = '';

    /**
     * Creates an instance of Task_DB_Schema
     *
     * @param Ruckusing_Adapter_Base $adapter The current adapter being used
     *
     * @return Task_DB_Schema
     */
    public function __construct($adapter)
    {
        parent::__construct($adapter);
        $this->_adapter = $adapter;
    }

    /**
     * Primary task entry point
     *
     * @param array $args The current supplied options.
     */
    public function execute($args)
    {
        $this->_return .= "Started: " . date('Y-m-d g:ia T') . "\n\n";
        $this->_return .= "[db:schema]: \n";

        //write to disk
        $schema_file = $this->db_dir() . '/schema.txt';
        $schema = $this->_adapter->schema($schema_file);
        $this->_return .= "\tSchema written to: $schema_file\n\n";
        $this->_return .= "\n\nFinished: " . date('Y-m-d g:ia T') . "\n\n";

        return $this->_return;
    }

    /**
     * Get the db dir, check and create the db dir if it doesn't exists
     *
     * @return string
     */
    private function db_dir()
    {
        // create the db directory if it doesnt exist
        $db_directory = $this->get_framework()->db_directory();
        if (!is_dir($db_directory)) {
            $this->_return .= sprintf("\n\tDB Schema directory (%s doesn't exist, attempting to create.\n", $db_directory);
            if (mkdir($db_directory, 0755, true) === FALSE) {
                $this->_return .= sprintf("\n\tUnable to create migrations directory at %s, check permissions?\n", $db_directory);
            } else {
                $this->_return .= sprintf("\n\tCreated OK\n\n");
            }
        }

        //check to make sure our destination directory is writable
        if (!is_writable($db_directory)) {
            throw new Ruckusing_Exception(
                    "ERROR: DB Schema directory '"
                    . $db_directory
                    . "' is not writable by the current user. Check permissions and try again.\n",
                    Ruckusing_Exception::INVALID_DB_DIR
            );
        }

        return $db_directory;
    }

    /**
     * Return the usage of the task
     *
     * @return string
     */
    public function help()
    {
        $output =<<<USAGE

\tTask: db:schema

\tIt can be beneficial to get a dump of the DB in raw SQL format which represents
\tthe current version.

\tNote: This dump only contains the actual schema (e.g. the DML needed to
\treconstruct the DB), but not any actual data.

\tIn MySQL terms, this task would not be the same as running the mysqldump command
\t(which by defaults does include any data in the tables).

USAGE;

        return $output;
    }

}
