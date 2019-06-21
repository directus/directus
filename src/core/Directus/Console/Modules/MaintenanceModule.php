<?php

namespace Directus\Console\Modules;

use Directus\Console\Exception\WrongArgumentsException;
use function Directus\find_log_files;
use Directus\Util\ArrayUtils;
use Directus\Util\DateTimeUtils;

class MaintenanceModule extends ModuleBase
{
    protected $__module_name = 'maintenance';
    protected $__module_description = 'commands to enable/disable maintenance mode';
    protected $commands_help;
    protected $help;

    public function __construct($basePath)
    {
        parent::__construct($basePath);

        $this->help = $this->commands_help = [
            'on' => 'maintenance:on enable maintenance mode',
            'off' => 'maintenance:off disable maintenance mode',
            'status' => 'maintenance:status tells if maintenance mode is on or off.'
        ];
    }

    public function cmdStatus($args, $extra) {
        $fileFlag = $this->getFileFlag();

        $message = 'maintenance mode is off.';
        if (file_exists($fileFlag)) {
            $message = 'maintenance mode is on.';
        }

        echo PHP_EOL . $message . PHP_EOL;
    }

    public function cmdOn($args, $extra)
    {
        $fileFlag = $this->getFileFlag();

        if (!file_exists($fileFlag)) {
            fopen($fileFlag, "w");
        }

        echo PHP_EOL . 'maintenance mode activated.' . PHP_EOL;
    }

    public function cmdOff($args, $extra) {
        $fileFlag = $this->getFileFlag();

        if (file_exists($fileFlag)) {
            unlink($fileFlag);
        }
        echo PHP_EOL . 'maintenance mode deactivated.' . PHP_EOL;
    }

    public function getFileFlag() {
        return $this->getBasePath() . '/logs/maintenance';
    }
}
