<?php

namespace Directus\Console\Modules;

use Directus\Config\Context;
use Directus\Config\SuperAdminToken;
use Directus\Console\Common\Exception\PasswordChangeException;
use Directus\Console\Common\Exception\UserUpdateException;
use Directus\Console\Common\Setting;
use Directus\Console\Common\User;
use Directus\Console\Exception\CommandFailedException;
use Directus\Util\ArrayUtils;
use Directus\Util\Installation\InstallerUtils;
use Directus\Util\StringUtils;

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
                .PHP_EOL."\t\t-k ".'Project key for the created project'
                .PHP_EOL."\t\t-h ".'Hostname or IP address of the MySQL DB to be used. Default: localhost'
                .PHP_EOL."\t\t-n ".'Name of the database to use for Directus. Default: directus'
                .PHP_EOL."\t\t-u ".'Username for DB connection. Default: directus'
                .PHP_EOL."\t\t-p ".'Password for the DB connection user. Default: directus'
                .PHP_EOL."\t\t-t ".'Database Server Type. Default: mysql'
                .PHP_EOL."\t\t-P ".'Database Server Port. Default: 3306'
                .PHP_EOL."\t\t-c ".'CORS Enabled. Default: false'
                .PHP_EOL."\t\t-r ".'Directus root URI. Default: /',
            'database' => '',
            'install' => ''
                .PHP_EOL."\t\t-k ".'Project key for the created project'
                .PHP_EOL."\t\t-e ".'Administrator e-mail address, used for administration login. Default: admin@directus.com'
                .PHP_EOL."\t\t-p ".'Initial administrator password. Default: directus'
                .PHP_EOL."\t\t-t ".'Name for this Directus installation. Default: Directus'
                .PHP_EOL."\t\t-T ".'Administrator secret token. Default: Random'
                .PHP_EOL."\t\t-d ".'Installation path of Directus. Default: '.$this->getBasePath(),
        ];

        $this->commands_help = [
            'config' => 'Configure Directus: '.PHP_EOL.PHP_EOL."\t\t"
                .$this->__module_name.':config -k my-project -h db_host -n db_name -u db_user -p db_pass -d directus_path -a super_admin_token'.PHP_EOL,
            'database' => 'Populate the Database Schema: '.PHP_EOL.PHP_EOL."\t\t"
                .$this->__module_name.':database -d directus_path'.PHP_EOL,
            'install' => 'Install Initial Configurations: '.PHP_EOL.PHP_EOL."\t\t"
                .$this->__module_name.':install -e admin_email -p admin_password -t site_name'.PHP_EOL,
        ];

        $this->options = [
            'config' => [
                'f' => 'boolean',
            ],
            'database' => [
                'f' => 'boolean',
            ],
        ];
    }

    public function cmdConfig($args, $extra)
    {
        $data = [];

        $directusPath = $this->getBasePath();
        $force = false;

        foreach ($args as $key => $value) {
            switch ($key) {
                case 'a':
                    $data['super_admin_token'] = $value;
                    break;
                case 'k':
                    $data['project'] = (string) $value;
                    break;
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

        $apiPath = rtrim($directusPath, '/').'/config';
        if (!file_exists($apiPath)) {
            throw new \Exception(sprintf('Path "%s" does not exist', $apiPath));
        }

        $scannedDirectory = \Directus\scan_folder($this->getBasePath().'/config');
        $projectNames = $scannedDirectory;

        if (!empty($projectName)) {
            SuperAdminToken::assert($data['super_admin_token']);
        }

        $superAdminGenerated = false;
        if (empty($projectNames) && !isset($data['super_admin_token'])) {
            $data['super_admin_token'] = StringUtils::randomString(16, false);
            $superAdminGenerated = true;
        }

        $requiredAttributes = ['db_name', 'db_user', 'super_admin_token'];
        if (!ArrayUtils::contains($data, $requiredAttributes)) {
            throw new \InvalidArgumentException(
                'Creating config files required: '.implode(', ', $requiredAttributes)
            );
        }

        if (empty($projectNames) && !Context::is_env()) {
            $configStub = InstallerUtils::createJsonFileContent($data);
            file_put_contents(SuperAdminToken::path(), $configStub);
        }

        InstallerUtils::createConfig($directusPath, $data, $force);

        if (empty($projectNames) && $superAdminGenerated) {
            echo PHP_EOL."Make sure to copy the generated Super-Admin password below. You won't be able to see it again!".PHP_EOL;
            echo PHP_EOL.$data['super_admin_token'].PHP_EOL;
        }
    }

    public function cmdDatabase($args, $extra)
    {
        $directus_path = $this->getBasePath();
        $projectName = null;
        $force = false;

        foreach ($args as $key => $value) {
            switch ($key) {
                case 'd':
                    $directus_path = $value;
                    break;
                case 'k':
                    $projectName = $value;
                    break;
                case 'f':
                    $force = $value;
                    break;
            }
        }

        if (Context::is_env()) {
            $data = [
                'project' => '_',
                'db_name' => getenv('DIRECTUS_DATABASE_NAME'),
                'db_host' => getenv('DIRECTUS_DATABASE_HOST'),
                'db_port' => getenv('DIRECTUS_DATABASE_PORT'),
                'db_user' => getenv('DIRECTUS_DATABASE_USERNAME'),
                'db_password' => getenv('DIRECTUS_DATABASE_PASSWORD'),
            ];
        } else {
            $app = InstallerUtils::createApp($directus_path, $projectName);
            $config = $app->getConfig();
            $data = [
                'project' => $projectName,
                'db_name' => $config['database']['name'],
                'db_host' => $config['database']['host'],
                'db_port' => $config['database']['port'],
                'db_user' => $config['database']['username'],
                'db_password' => $config['database']['password'],
            ];
        }

        InstallerUtils::ensureCanCreateTables($directus_path, $data, $force);

        InstallerUtils::createTables($directus_path, $projectName, $force);
        InstallerUtils::addUpgradeMigrations($this->getBasePath(), $projectName);
    }

    public function cmdSeeder($args, $extra)
    {
        $directus_path = $this->getBasePath().DIRECTORY_SEPARATOR;

        InstallerUtils::runSeeder($directus_path);
    }

    public function cmdInstall($args, $extra)
    {
        $data = [];
        $projectName = null;
        $directus_path = $this->getBasePath().DIRECTORY_SEPARATOR;

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
                case 'k':
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
                    throw new CommandFailedException('Error changing admin e-mail'.': '.$ex->getMessage());
                } catch (PasswordChangeException $ex) {
                    throw new CommandFailedException('Error changing user password'.': '.$ex->getMessage());
                }
            }
        } catch (\PDOException $e) {
            echo PHP_EOL.'PDO Excetion!!'.PHP_EOL;
            echo PHP_EOL.PHP_EOL.'Module '.$this->__module_name.' error: '.$e->getMessage().PHP_EOL.PHP_EOL;
        }
    }
}
