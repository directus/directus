<?php

namespace Ruckusing;

use Ruckusing\FrameworkAbstract;
use Ruckusing\RuckusingException as Ruckusing_Exception;
use Ruckusing\Util\Logger as Ruckusing_Util_Logger;
use Ruckusing\Adapter\MySQL\MySQLBase;
use Ruckusing\Task\TaskManager as Ruckusing_Task_Manager;

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
class FrameworkRunner extends FrameworkAbstract
{
    /**
     * Execute the current task
     */
    public function execute($argv = array())
    {
        $output = '';

        if($argv) {
            //parse arguments
            $this->parse_args($argv);
        }

        if ($this->_task_mgr->has_task($this->_cur_task_name)) {
            try {
                $taskReturn = $this->_task_mgr->execute($this, $this->_cur_task_name, $this->_task_options);
                $output = $taskReturn['output'];
            } catch(Ruckusing_Exception $e) {
                $output = $e->getMessage();
            }
        } else {
            $output = sprintf("Task not found: %s\n", $this->_cur_task_name);
        }

        if ($this->logger) {
            $this->logger->close();
        }

        return $output;
    }

    public function _execute()
    {
        $output = '';
        if (empty($this->_cur_task_name)) {
            if (isset($_SERVER["argv"][1]) && stripos($_SERVER["argv"][1], '=') === false) {
                $output .= sprintf("\n\tWrong Task format: %s\n", $_SERVER["argv"][1]);
            }
            $output .= $this->help();
        } else {
            if ($this->_task_mgr->has_task($this->_cur_task_name)) {
                if ($this->_showhelp) {
                    $output .= $this->_task_mgr->help($this->_cur_task_name);
                } else {
                    $output .= $this->_task_mgr->execute($this, $this->_cur_task_name, $this->_task_options);

                }
            } else {
                $output .= sprintf("\n\tTask not found: %s\n", $this->_cur_task_name);
                $output .= $this->help();
            }
        }

        if ($this->logger) {
            $this->logger->close();
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
        // TODO: dynamically list all available tasks
        $output =<<<USAGE

\tUsage: php {$_SERVER['argv'][0]} <task> [help] [task parameters] [env=environment]

\thelp: Display this message

\tenv: The env command line parameter can be used to specify a different
\tdatabase to run against, as specific in the configuration file
\t(config/database.inc.php).
\tBy default, env is "development"

\ttask: In a nutshell, task names are pseudo-namespaced. The tasks that come
\twith the framework are namespaced to "db" (e.g. the tasks are "db:migrate",
\t"db:setup", etc).
\tAll tasks available actually :

\t- db:setup : A basic task to initialize your DB for migrations is
\tavailable. One should always run this task when first starting out.

\t- db:generate : A generic task which acts as a Generator for migrations.

\t- db:migrate : The primary purpose of the framework is to run migrations,
\tand the execution of migrations is all handled by just a regular ol' task.

\t- db:version : It is always possible to ask the framework (really the DB)
\twhat version it is currently at.

\t- db:status : With this taks you'll get an overview of the already
\texecuted migrations and which will be executed when running db:migrate

\t- db:schema : It can be beneficial to get a dump of the DB in raw SQL
\tformat which represents the current version.

USAGE;

        return $output;
    }

}
