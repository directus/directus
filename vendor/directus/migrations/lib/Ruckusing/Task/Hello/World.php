<?php

/**
 * Ruckusing
 *
 * @category  Ruckusing
 * @package   Task
 * @subpackage Hello
 * @author    Cody Caughlan <codycaughlan % gmail . com>
 * @link      https://github.com/ruckus/ruckusing-migrations
 */

/**
 * Task_Hello_World
 *
 * @category Ruckusing
 * @package  Task
 * @subpackage Hello
 * @author   Cody Caughlan <codycaughlan % gmail . com>
 * @link      https://github.com/ruckus/ruckusing-migrations
 */
class Task_Hello_World extends Ruckusing_Task_Base implements Ruckusing_Task_Interface
{
    /**
     * Creates an instance of Task_Hello_World
     *
     * @param Ruckusing_Adapter_Base $adapter The current adapter being used
     *
     * @return Task_Hello_World
     */
    public function __construct($adapter)
    {
        parent::__construct($adapter);
    }

    /**
     * Primary task entry point
     *
     * @param array $args The current supplied options.
     */
    public function execute($args)
    {
        return "\nHello, World\n";
    }

    /**
     * Return the usage of the task
     *
     * @return string
     */
    public function help()
    {
        $output =<<<USAGE

\tTask: hello:world

\tHello World.

\tThis task does not take arguments.

USAGE;

        return $output;
    }
}
