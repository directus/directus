<?php

namespace Directus\Console\Modules;

use Directus\Console\Common\Exception\PasswordChangeException;
use Directus\Console\Common\Exception\UserUpdateException;
use Directus\Console\Common\Setting;
use Directus\Console\Common\User;
use Directus\Console\Exception\CommandFailedException;
use Directus\Util\ArrayUtils;
use Directus\Util\Installation\InstallerUtils;

class InstallModule extends ModuleBase
{
    protected $__module_name = 'install';
    protected $__module_description = 'commands to install and configure Directus';

    protected $commands_help;

    protected $help;

    public function __construct($basePath)
    {
        parent::__construct($basePath);

        $this->help = [
            'config' => ''
                . PHP_EOL . "\t\t-h " . 'Hostname or IP address of the MySQL DB to be used. Default: localhost'
                . PHP_EOL . "\t\t-n " . 'Name of the database to use for Directus. Default: directus'
                . PHP_EOL . "\t\t-u " . 'Username for DB connection. Default: directus'
                . PHP_EOL . "\t\t-p " . 'Password for the DB connection user. Default: directus'
                . PHP_EOL . "\t\t-t " . 'Database Server Type. Default: mysql'
                . PHP_EOL . "\t\t-P " . 'Database Server Port. Default: 3306'
                . PHP_EOL . "\t\t-c " . 'CORS Enabled. Default: false'
                . PHP_EOL . "\t\t-r " . 'Directus root URI. Default: /',
            'database' => '',
            'install' => ''
                . PHP_EOL . "\t\t-e " . 'Administrator e-mail address, used for administration login. Default: admin@directus.com'
                . PHP_EOL . "\t\t-p " . 'Initial administrator password. Default: directus'
                . PHP_EOL . "\t\t-t " . 'Name for this Directus installation. Default: Directus'
                . PHP_EOL . "\t\t-T " . 'Administrator secret token. Default: Random'
                . PHP_EOL . "\t\t-d " . 'Installation path of Directus. Default: ' . $this->getBasePath()
        ];

        $this->commands_help = [
            'config' => 'Configure Directus: ' . PHP_EOL . PHP_EOL . "\t\t"
                . $this->__module_name . ':config -h db_host -n db_name -u db_user -p db_pass -d directus_path' . PHP_EOL,
            'database' => 'Populate the Database Schema: ' . PHP_EOL . PHP_EOL . "\t\t"
                . $this->__module_name . ':database -d directus_path' . PHP_EOL,
            'install' => 'Install Initial Configurations: ' . PHP_EOL . PHP_EOL . "\t\t"
                . $this->__module_name . ':install -e admin_email -p admin_password -t site_name' . PHP_EOL,
        ];

        $this->options = [
            'config' => [
                'f' => 'boolean',
            ],
            'database' => [
                'f' => 'boolean',
            ]
        ];
    }

    public function cmdConfig($args, $extra)
    {
        $data = [];

        $directusPath = $this->getBasePath();
        $force = false;

        foreach ($args as $key => $value) {
            switch ($key) {
                case 't':
                    $data['db_type'] = $value;
                    break;
                case 'P':
                    $data['db_port'] = $value;
                    break;
                case 'h':
                    $data['db_host'] = $value;
                    break;
                case 'n':
                    $data['db_name'] = $value;
                    break;
                case 'u':
                    $data['db_user'] = $value;
                    break;
                case 'p':
                    $data['db_password'] = $value;
                    break;
                case 'e':
                    $data['directus_email'] = $value;
                    break;
                case 'c':
                    $data['cors_enabled'] = (bool) $value;
                    break;
                case 'N': // project Name
                    $data['project'] = (string) $value;
                    break;
                case 's':
                    $data['db_socket'] = $value;
                    break;
                case 'timezone':
                    $data['timezone'] = $value;
                    break;
                case 'f':
                    $force = $value;
                    break;
            }
        }

        $apiPath = rtrim($directusPath, '/') . '/config';
        if (!file_exists($apiPath)) {
            throw new \Exception(sprintf('Path "%s" does not exist', $apiPath));
        }

        InstallerUtils::createConfig($directusPath, $data, $force);
    }

    public function cmdDatabase($args, $extra)
    {
        $directus_path = $this->getBasePath() . DIRECTORY_SEPARATOR;
        $projectName = null;
        $force = false;

        foreach ($args as $key => $value) {
            switch ($key) {
                case 'd':
                    $directus_path = $value;
                    break;
                case 'N':
                    $projectName = $value;
                    break;
                case 'f':
                    $force = $value;
                    break;
            }
        }

        InstallerUtils::createTables($directus_path, $projectName, $force);
    }

    public function cmdSeeder($args, $extra)
    {
        $directus_path = $this->getBasePath() . DIRECTORY_SEPARATOR;

        InstallerUtils::runSeeder($directus_path);
    }

    public function cmdInstall($args, $extra)
    {
        $data = [];
        $projectName = null;
        $directus_path = $this->getBasePath() . DIRECTORY_SEPARATOR;

        foreach ($args as $key => $value) {
            switch ($key) {
                case 'e':
                    $data['user_email'] = $value;
                    break;
                case 'p':
                    $data['user_password'] = $value;
                    break;
                case 't':
                    $data['project_name'] = $value;
                    break;
                case 'a':
                    $data['app_url'] = $value;
                    break;
                case 'T':
                    $data['user_token'] = $value;
                    break;
                case 'N':
                    $projectName = $value;
                    break;
                case 'timezone':
                    $data['timezone'] = $value;
                    break;
                case 'locale':
                    $data['locale'] = $value;
                    break;
            }
        }

        try {
            $setting = new Setting($directus_path, $projectName);

            if (!$setting->isConfigured()) {
                InstallerUtils::addDefaultSettings($directus_path, $data, $projectName);
                InstallerUtils::addDefaultUser($directus_path, $data, $projectName);
            } else {
                if (ArrayUtils::has($data, 'project_name')) {
                    $setting->setSetting('project_name', $data['project_name']);
                }

                if (ArrayUtils::has($data, 'app_url')) {
                    $setting->setSetting('app_url', $data['app_url']);
                }

                // NOTE: Do we really want to change the email when re-run install command?
                $user = new User($directus_path, $projectName);
                try {
                    $hasEmail = ArrayUtils::has($data, 'user_email');
                    if ($hasEmail && !$user->userExists($data['user_email'])) {
                        InstallerUtils::addDefaultUser($directus_path, $data, $projectName);
                    } else {
                        //TODO: Verify this method is required or not! 
                        if ($hasEmail) {
                            $user->changeEmail(1, $data['user_email']);
                        }

                        if ($hasEmail && ArrayUtils::has($data, 'user_password')) {
                            $user->changePassword($data['user_email'], $data['user_password']);
                        }
                    }
                } catch (UserUpdateException $ex) {
                    throw new CommandFailedException('Error changing admin e-mail' . ': ' . $ex->getMessage());
                } catch (PasswordChangeException $ex) {
                    throw new CommandFailedException('Error changing user password' . ': ' . $ex->getMessage());
                }
            }
        } catch (\PDOException $e) {
            echo PHP_EOL . "PDO Excetion!!" . PHP_EOL;
            echo PHP_EOL . PHP_EOL . 'Module ' . $this->__module_name . ' error: ' . $e->getMessage() . PHP_EOL . PHP_EOL;
        }
    }
}
