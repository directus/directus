<?php

namespace Directus\Console\Modules;

use Ruckusing\Framework as Ruckusing_Framework;

class DatabaseModule extends ModuleBase
{
    protected $__module_name = 'db';
    protected $__module_description = 'command to create or upgrade the database schema';
    protected $commands_help;
    protected $help;

    public function __construct()
    {
        $commands = [
            'install' => __t('Install the database schema'),
            'upgrade' => __t('Upgrade the database schema')
        ];
        $this->help = $this->commands_help = $commands;
    }

    public function cmdHelp($args, $extra)
    {
        echo PHP_EOL . __t('Database Command ') . $this->__module_name . ':' . $extra[0] . __t(' help') . PHP_EOL . PHP_EOL;
        echo "\t" . $this->commands_help[$extra[0]] . PHP_EOL;
        echo PHP_EOL . PHP_EOL;
    }

    public function cmdInstall($args, $extra)
    {
        $this->runMigration('schema');
    }

    public function cmdUpgrade($args, $extra)
    {
        $this->runMigration('upgrades');
    }

    protected function runMigration($migrationDirectory)
    {
        $directusPath = BASE_PATH;
        require_once $directusPath . '/api/config.php';
        $config = require $directusPath . '/api/ruckusing.conf.php';
        $dbConfig = getDatabaseConfig([
            'type' => DB_TYPE,
            'host' => DB_HOST,
            'port' => DB_PORT,
            'name' => DB_NAME,
            'user' => DB_USER,
            'pass' => DB_PASSWORD,
            'directory' => $migrationDirectory,
            'prefix' => '',
        ]);

        $config = array_merge($config, $dbConfig);
        $main = new Ruckusing_Framework($config);

        $output = $main->execute(['', 'db:setup']);
        echo 'db:setup - ' . $output['message'] . PHP_EOL;

        $output = $main->execute(['', 'db:migrate']);
        echo 'db:migrate - ' . $output['message'] . PHP_EOL;
    }
}
