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
 * Task_DB_Status.
 * Prints out a list of migrations that have and haven't been applied
 *
 * @category Ruckusing
 * @package  Task
 * @subpackage Db
 * @author   Cody Caughlan <codycaughlan % gmail . com>
 * @link      https://github.com/ruckus/ruckusing-migrations
 */
class Task_Db_Status extends Ruckusing_Task_Base implements Ruckusing_Task_Interface
{
    /**
     * Current Adapter
     *
     * @var Ruckusing_Adapter_Base
     */
    private $_adapter = null;

    /**
     * Creates an instance of Task_DB_Status
     *
     * @param Ruckusing_Adapter_Base $adapter The current adapter being used
     *
     * @return Task_DB_Status
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
        $output .= "[db:status]: \n";
        $util = new Ruckusing_Util_Migrator($this->_adapter);
        $migrations = $util->get_executed_migrations();
        $files = $util->get_migration_files($this->get_framework()->migrations_directories(), 'up');
        $applied = array();
        $not_applied = array();
        foreach ($files as $file) {
            if (in_array($file['version'], $migrations)) {
                $applied[] = $file['class'] . ' [ ' . $file['version'] . ' ]';
            } else {
                $not_applied[] = $file['class'] . ' [ ' . $file['version'] . ' ]';
            }
        }
        if (count($applied) > 0) {
            $output .= $this->_displayMigrations($applied, 'APPLIED');
        }
        if (count($not_applied) > 0) {
            $output .= $this->_displayMigrations($not_applied, 'NOT APPLIED');
        }

        $output .= "\n\nFinished: " . date('Y-m-d g:ia T') . "\n\n";

        return $output;
    }

    /**
     * display migrations results
     *
     * @param array  $migrations The migrations
     * @param string $title      The title of section
     *
     * @return string
     */
    private function _displayMigrations($migrations, $title)
    {
        $output = "\n\n===================== {$title} =======================\n";
        foreach ($migrations as $a) {
            $output .= "\t" . $a . "\n";
        }

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

\tTask: db:status

\tWith this task you'll get an overview of the already executed migrations and
\twhich will be executed when running db:migrate.

\tThis task does not take arguments.

USAGE;

        return $output;
    }
}
