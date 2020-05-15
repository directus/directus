<?php

namespace Directus\Console;

use Directus\Console\Exception\UnsupportedCommandException;
use Directus\Console\Exception\WrongArgumentsException;
use Directus\Util\ArrayUtils;

class Cli
{
    private $command = '';
    private $help_module = '';
    private $options = [];
    private $arguments = [];
    private $extra = [];
    private $directusPath = '';

    private $cmd_modules = [];

    public function __construct($directusPath = null, $argv = [])
    {
        if (!$argv) {
            $argv = $_SERVER['argv'] ?: [];
        }

        // get rid of the command name
        array_shift($argv);

        $this->directusPath = $directusPath;

        $this->command = array_shift($argv);

        if ($this->command == 'help') {
            $this->help_module = array_shift($argv);
        }

        $this->arguments = $argv;

        $this->loadModules();
    }

    private function loadModules()
    {
        foreach (glob(dirname(__FILE__) . DIRECTORY_SEPARATOR . 'Modules' . DIRECTORY_SEPARATOR . '*Module.php') as $moduleFile) {
            $moduleName = 'Directus\Console\Modules\\' . basename($moduleFile, '.php');
            require($moduleFile);
            $moduleInstance = new $moduleName($this->directusPath);
            $this->cmd_modules[$moduleInstance->getModuleName()] = $moduleInstance;
        }
    }

    public function run()
    {
        switch ($this->command) {
            case 'help':
            case '':
                if ($this->help_module != '') {
                    $this->showModuleHelp();
                } else {
                    $this->showHelp();
                }
                break;
            default:
                $this->cmd();
                break;
        }
    }

    private function cmd()
    {
        list($module, $command) = explode(':', $this->command . ':');

        if (empty($command)) {
            echo PHP_EOL . 'Error: Missing module name or command.' . PHP_EOL . PHP_EOL;
            echo 'Command are executed as follows:' . PHP_EOL;
            echo "\tdirectus <module>:<command> <args|...>" . PHP_EOL . PHP_EOL;
            echo "Example: " . PHP_EOL . "\tdirectus install:help database" . PHP_EOL . PHP_EOL;
            exit(1);
        }

        if (!array_key_exists($module, $this->cmd_modules)) {
            echo PHP_EOL . PHP_EOL . 'Module ' . $module . ': does not exist!' . PHP_EOL . PHP_EOL;
            exit(1);
        }

        try {
            $options = $this->parseOptions($this->arguments, $this->cmd_modules[$module]->getOptions($command));
            $this->cmd_modules[$module]->runCommand($command, $options, $this->extra);
            return;
        } catch (WrongArgumentsException $e) {
            echo PHP_EOL . PHP_EOL . 'Module ' . $module . ' error: ' . $e->getMessage() . PHP_EOL . PHP_EOL;
            exit(1);
        } catch (UnsupportedCommandException $e) {
            echo PHP_EOL . PHP_EOL . 'Module ' . $module . ' error: ' . $e->getMessage() . PHP_EOL . PHP_EOL;
            exit(1);
        } catch (\PDOException $e) {
            $this->handlePdoException($e);
        }
    }

    private function handlePdoException(\PDOException $e)
    {
        $expected = "Duplicate entry 'directus_activity-id' for key 'idx_collection_field'";
        if ((int) $e->errorInfo[0] == 23000 && $e->errorInfo[2] == $expected) {
            echo "The Database for " . $this->directusPath . " had already been deployed.\n";
            echo "You may use option -f to enforce the overwriting of existing data.";
        } else {
            throw ($e);
        }
        exit(1);
    }

    private function showHelp()
    {
        echo PHP_EOL . 'Directus CLI Modules: ' . PHP_EOL . PHP_EOL;
        foreach ($this->cmd_modules as $name => $module) {
            echo "\t" . $module->getInfo() . PHP_EOL;
        }
        echo PHP_EOL . 'For more information on a module use: "directus help <module name>"' . PHP_EOL . PHP_EOL;
    }

    private function showModuleHelp()
    {
        if (!array_key_exists($this->help_module, $this->cmd_modules)) {
            echo PHP_EOL . PHP_EOL . 'Module ' . $this->help_module . ': does not exist!' . PHP_EOL . PHP_EOL;
            return;
        }
        echo PHP_EOL . 'Directus Module ' . ucfirst($this->help_module) . ' Commands' . PHP_EOL . PHP_EOL;
        $module_commands = $this->cmd_modules[$this->help_module]->getCommands();
        foreach ($module_commands as $command => $cmd_help) {
            echo "\t" . $cmd_help . PHP_EOL . PHP_EOL;
        }
        echo PHP_EOL . 'For more information on a command use: "directus <module name>:help command"' . PHP_EOL . PHP_EOL;
    }

    private function parseOptions($argv, array $types = [])
    {
        $options = [];

        $num_args = count($argv);
        $arg_idx = 0;
        while ($num_args > 0) {
            $arg = $argv[$arg_idx];
            if (preg_match("/^(-{1,2})([A-Za-z0-9-_]+)$/", $arg, $argMatch)) {
                $key = $argMatch[2];
                $type = ArrayUtils::get($types, $key, null);

                /**
                 * There is still at least an argument - this could be the
                 * value for this option.
                 */
                if ($num_args >= 2) {
                    if (preg_match("/^(-{1,2})([A-Za-z0-9-_]+)$/", $argv[$arg_idx + 1], $nextMatch)) {
                        /**
                         * Next argument is another option - so this must be a switch.
                         */
                        $value = $type === 'boolean' ? true : '';
                        $arg_idx++;
                        $num_args--;
                    } else {
                        /**
                         * The next argument is the value for this option.
                         */
                        $value = $argv[$arg_idx + 1];
                        $arg_idx += 2;
                        $num_args -= 2;
                    }
                } else {
                    /**
                     * There is no other value, this is just a switch.
                     */
                    $value = $type === 'boolean' ? true : '';
                    $arg_idx++;
                    $num_args--;
                }
                $options[$key] = $value;
            } else {
                $this->extra[] = $arg;
                $arg_idx++;
                $num_args--;
            }
        }

        return $options;
    }
}
