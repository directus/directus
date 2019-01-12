<?php

namespace Directus\Console\Modules;

use Directus\Console\Exception\WrongArgumentsException;
use function Directus\find_log_files;
use Directus\Util\ArrayUtils;
use Directus\Util\DateTimeUtils;

class LogModule extends ModuleBase
{
    protected $__module_name = 'log';
    protected $__module_description = 'commands to manage Directus logs';
    protected $commands_help;
    protected $help;

    public function __construct($basePath)
    {
        parent::__construct($basePath);

        $this->help = $this->commands_help = [
            'prune' => 'remove logs older than x days. Default 30 days'
        ];
    }

    public function cmdPrune($args, $extra)
    {
        $days = (int) ArrayUtils::get($extra, 0, 30);

        if ($days <= 0) {
            throw new WrongArgumentsException($this->__module_name . ':prune ' . ' days must be greater than 0');
        }

        $logs = find_log_files($this->getBasePath() . '/logs');

        foreach ($logs as $path) {
            $time = (time() - filemtime($path)) / DateTimeUtils::DAY_IN_SECONDS;
            if ($time > $days) {
                unlink($path);
            }
        }
    }
}
