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
 * Task_DB_Setup.
 * This is a generic task which initializes a table to hold migration version information.
 * This task is non-destructive and will only create the table if it does not already exist, otherwise
 * no other actions are performed.
 *
 * @category Ruckusing
 * @package  Task
 * @subpackage Db
 * @author   Cody Caughlan <codycaughlan % gmail . com>
 * @link      https://github.com/ruckus/ruckusing-migrations
 */
class Task_Db_Setup extends Ruckusing_Task_Base implements Ruckusing_Task_Interface
{
    /**
     * Current Adapter
     *
     * @var Ruckusing_Adapter_Base
     */
    private $_adapter = null;

    /**
     * Creates an instance of Task_DB_Setup
     *
     * @param Ruckusing_Adapter_Base $adapter The current adapter being used
     *
     * @return Task_DB_Setup
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
        $output = "Started: " . date('Y-m-d g:ia T') . "\n\n";
        $output .= "[db:setup]: \n";
        //it doesnt exist, create it
        if (!$this->_adapter->table_exists(RUCKUSING_TS_SCHEMA_TBL_NAME)) {
            $output .= sprintf("\tCreating table: %s", RUCKUSING_TS_SCHEMA_TBL_NAME);
            $this->_adapter->create_schema_version_table();
            $output .= "\n\tDone.\n";
        } else {
            $output .= sprintf("\tNOTICE: table '%s' already exists. Nothing to do.", RUCKUSING_TS_SCHEMA_TBL_NAME);
        }
        $output .= "\n\nFinished: " . date('Y-m-d g:ia T') . "\n\n";

        return $output;
    }

    /**
     * Return the usage of the task
     *
     * @return string
     */
    public function help()
    {
        $output =<<<USAGE

\tTask: db:setup

\tA basic task to initialize your DB for migrations is available. One should
\talways run this task when first starting out.

\tThis task does not take arguments.

USAGE;

        return $output;
    }
}
