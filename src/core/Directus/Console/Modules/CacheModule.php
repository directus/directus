<?php

namespace Directus\Console\Modules;

use Cache\Adapter\Common\AbstractCachePool;
use Directus\Application\Application;
use Directus\Exception\ErrorException;
use Directus\Util\ArrayUtils;
use Directus\Util\Installation\InstallerUtils;
use Phinx\Config\Config;
use Phinx\Migration\Manager;
use Symfony\Component\Console\Input\StringInput;
use Symfony\Component\Console\Output\NullOutput;

class CacheModule extends ModuleBase
{
    protected $__module_name = 'cache';
    protected $__module_description = 'command to clear all objects from cache.';
    protected $commands_help;
    protected $help;

    public function __construct($basePath)
    {
        parent::__construct($basePath);

        $commands = [
            'clear' => 'Clear all objects from cache.'
        ];
        $this->help = $this->commands_help = $commands;
    }

    public function cmdHelp($args, $extra)
    {
        echo PHP_EOL . 'Cache Command ' . $this->__module_name . ':' . $extra[0] . ' help' . PHP_EOL . PHP_EOL;
        echo "\t" . $this->commands_help[$extra[0]] . PHP_EOL;
        echo PHP_EOL . PHP_EOL;
    }

    public function cmdClear($args, $extra)
    {
        $project = null;

        foreach ($args as $key => $value) {
            switch ($key) {
                case 'N':
                    $project = $value;
                    break;
            }
        }

        /** @var Application $app */
        $app = \Directus\create_app_with_project_name($this->getBasePath(), $project);

        /** @var AbstractCachePool $cache */
        $cache = $app->getContainer()->get('cache');
        $cache->clear();

        echo "Successfully cleared cache!\n";
    }
}
