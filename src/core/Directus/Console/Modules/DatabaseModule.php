<?php

namespace Directus\Console\Modules;

use Directus\Util\ArrayUtils;
use Directus\Util\Installation\InstallerUtils;
use Phinx\Config\Config;
use Phinx\Migration\Manager;
use Symfony\Component\Console\Input\StringInput;
use Symfony\Component\Console\Output\NullOutput;

class DatabaseModule extends ModuleBase
{
    protected $__module_name = 'db';
    protected $__module_description = 'command to create or upgrade the database schema';
    protected $commands_help;
    protected $help;

    public function __construct($basePath)
    {
        parent::__construct($basePath);

        $commands = [
            'upgrade' => 'Upgrade the database schema'
        ];
        $this->help = $this->commands_help = $commands;
    }

    public function cmdHelp($args, $extra)
    {
        echo PHP_EOL . 'Database Command ' . $this->__module_name . ':' . $extra[0] . ' help' . PHP_EOL . PHP_EOL;
        echo "\t" . $this->commands_help[$extra[0]] . PHP_EOL;
        echo PHP_EOL . PHP_EOL;
    }

    public function cmdUpgrade($args, $extra)
    {
        $project = null;

        foreach ($args as $key => $value) {
            switch ($key) {
                case 'N':
                case 'k':
                    $project = $value;
                    break;
            }
        }

        InstallerUtils::updateTables($this->getBasePath(), $project);
    }
}
