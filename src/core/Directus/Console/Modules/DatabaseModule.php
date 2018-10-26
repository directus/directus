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
            'install' => 'Install the database schema',
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

    public function cmdInstall($args, $extra)
    {
        $this->runMigration('schema');
    }

    public function cmdUpgrade($args, $extra)
    {
        $project = null;

        foreach ($args as $key => $value) {
            switch ($key) {
                case 'N':
                    $project = $value;
                    break;
            }
        }

        InstallerUtils::updateTables($this->getBasePath(), $project);
    }

    protected function runMigration($name)
    {
        $directusPath = $this->getBasePath();

        $configPath = $directusPath . '/config';
        $apiConfig = require $configPath . '/api.php';
        $configArray = require $configPath . '/migrations.php';
        $configArray['paths']['migrations'] = $directusPath . '/migrations/db/' . $name;
        $configArray['environments']['development'] = [
            'adapter' => ArrayUtils::get($apiConfig, 'database.type'),
            'host' => ArrayUtils::get($apiConfig, 'database.host'),
            'port' => ArrayUtils::get($apiConfig, 'database.port'),
            'name' => ArrayUtils::get($apiConfig, 'database.name'),
            'user' => ArrayUtils::get($apiConfig, 'database.username'),
            'pass' => ArrayUtils::get($apiConfig, 'database.password'),
            'charset' => ArrayUtils::get($apiConfig, 'database.charset', 'utf8')
        ];
        $config = new Config($configArray);

        $manager = new Manager($config, new StringInput(''), new NullOutput());
        $manager->migrate('development');

        // TODO: Flush Output
    }
}
