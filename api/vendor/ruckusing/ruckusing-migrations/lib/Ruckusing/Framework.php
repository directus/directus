<?php

namespace Ruckusing;

use Ruckusing\FrameworkAbstract;
use Ruckusing\Util\Logger as Ruckusing_Util_Logger;
use Ruckusing\RuckusingException as Ruckusing_Exception;
use Ruckusing\Adapter\MySQL\MySQLBase;

/**
 * Ruckusing
 *
 * @category  Ruckusing
 * @package   Ruckusing
 * @author    Cody Caughlan <codycaughlan % gmail . com>
 * @link      https://github.com/ruckus/ruckusing-migrations
 */

/**
 * Ruckusing_FrameworkRunner
 *
 * Primary work-horse class. This class bootstraps the framework by loading
 * all adapters and tasks.
 *
 * @category Ruckusing
 * @package  Ruckusing
 * @author   Cody Caughlan <codycaughlan % gmail . com>
 * @link     https://github.com/ruckus/ruckusing-migrations
 */
class Framework extends FrameworkAbstract
{
    /**
     * Creates an instance of Ruckusing_Adapters_Base
     *
     * @param array $config The current config
     * @param array $argv   the supplied command line arguments
     * @param Ruckusing_Util_Logger An optional custom logger
     *
     * @return Ruckusing_FrameworkRunner
     */
    public function __construct($config, $argv = array(), Ruckusing_Util_Logger $log = null)
    {
        $this->_migrations_dirname = isset($config['migrations_dirname']) ? $config['migrations_dirname'] : '';
        parent::__construct($config, $argv, $log);
    }

    /**
     * Execute the current task
     */
    public function execute($argv = array())
    {
        $return = array(
            'status' => Ruckusing_Exception::TASK_NOT_EXECUTED,
            'message' => ''
        );

        if($argv) {
            //parse arguments
            $this->parse_args($argv);
        }

        if ($this->_task_mgr->has_task($this->_cur_task_name)) {
            try {
                $taskReturn = $this->_task_mgr->execute($this, $this->_cur_task_name, $this->_task_options);
                $return['status'] = $taskReturn['status'];
                $return['message'] = $taskReturn['message'];
                if (array_key_exists('data', $taskReturn)) {
                    $return['data'] = $taskReturn['data'];
                }
            } catch(Ruckusing_Exception $e) {
                $return['status'] = Ruckusing_Exception::TASK_EXECUTION_FAILED;
                $return['message'] = $e->getMessage();
            }
        } else {
            $return['status'] = Ruckusing_Exception::TASK_NOT_FOUND;
            $return['message'] = sprintf("Task not found: %s", $this->_cur_task_name);
        }

        if ($this->logger) {
            $this->logger->close();
        }

        return $return;
    }
}