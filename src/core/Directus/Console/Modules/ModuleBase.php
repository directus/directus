<?php

namespace Directus\Console\Modules;

use Directus\Console\Exception\UnsupportedCommandException;
use Directus\Console\Exception\WrongArgumentsException;
use Directus\Util\ArrayUtils;

class ModuleBase implements ModuleInterface
{
    protected $__module_name;
    protected $__module_description;

    protected $options = [];
    protected $commands_help;
    protected $help;
    protected $basePath = '';

    public function __construct($basePath)
    {
        $this->basePath = $basePath;
    }

    /**
     * @return string
     */
    public function getBasePath()
    {
        return $this->basePath;
    }

    public function getModuleName()
    {
        return $this->__module_name;
    }

    public function getInfo()
    {
        return $this->__module_name . ': ' . $this->__module_description;
    }

    public function getCommands()
    {
        return $this->commands_help;
    }

    public function getCommandHelp($command)
    {
        if (!array_key_exists($command, $this->help)) {
            throw new UnsupportedCommandException($this->__module_name . ':' . $command . ' command does not exist!');
        }
        return $this->help[$command];
    }

    public function runCommand($command, $args, $extra)
    {
        $cmd_name = 'cmd' . ucwords($command);
        if (!method_exists($this, $cmd_name)) {
            throw new UnsupportedCommandException($this->__module_name . ':' . $command . ' command does not exist!');
        }
        $this->$cmd_name($args, $extra);
    }

    public function cmdHelp($args, $extra)
    {
        if (count($extra) == 0) {
            throw new WrongArgumentsException($this->__module_name . ':help ' . 'missing command to show help for!');
        }

        echo PHP_EOL . 'Directus Command ' . $this->__module_name . ':' . $extra[0] . ' help' . PHP_EOL . PHP_EOL;
        echo "\t" . $this->commands_help[$extra[0]] . PHP_EOL;
        if(trim($this->getCommandHelp($extra[0]))) {
            echo "\t" . 'Options: ' . PHP_EOL . $this->getCommandHelp($extra[0]);
        }
        echo PHP_EOL . PHP_EOL;
    }

    /**
     * @inheritdoc
     */
    public function getOptions($command)
    {
        return ArrayUtils::get($this->options, $command, []);
    }
}
