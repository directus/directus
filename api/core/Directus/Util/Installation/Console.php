<?php

namespace Directus\Util\Installation;

use Directus\Bootstrap;
use Zend\Db\TableGateway\TableGateway;

class Console
{
    private $command = '';
    private $options = [];
    private $directusPath = '';

    public function __construct($directusPath = '', $argv = [])
    {
        if (!$argv) {
            $argv = $_SERVER['argv'] ?: [];
        }

        // get rid of the command name
        array_shift($argv);

        $this->directusPath = $directusPath;

        $this->command = array_shift($argv);
        $this->options = $this->parseOptions($argv);
    }

    public function run()
    {
        switch ($this->command) {
            case 'config':
                echo __t('creating_config_files') . '...';
                $this->createConfig();
                echo __t('done') . PHP_EOL;
                break;
            case 'database':
                echo __t('creating_database') . '...';
                $this->createDatabase();
                echo __t('done') . PHP_EOL;
                break;
            case 'install':
                echo __t('installing_settings') . '...';
                $this->install();
                echo __t('done') . PHP_EOL;
                break;
            // this is a quick solution to recover your password
            // a new improved console application is being under development
            case 'user:update_password':
                echo __t('Updating user') . '...';
                $this->updatePassword();
                echo __t('done') . PHP_EOL;
                break;
        }
    }

    private function createConfig()
    {
        // add default information
        // prevent issue with the new installation
        $data = [
            'db_type' => 'mysql',
            'host' => 'localhost',
            'db_port' => 3306,
            'directus_path' => '/',
        ];

        $options = $this->options;
        foreach ($options as $key => $value) {
            switch ($key) {
                case 'h':
                case 'host':
                    $data['db_host'] = $value;
                    unset($options[$key]);
                    break;
                case 'n':
                case 'name':
                    $data['db_name'] = $value;
                    unset($options[$key]);
                    break;
                case 'u':
                case 'user':
                    $data['db_user'] = $value;
                    unset($options[$key]);
                    break;
                case 'p':
                case 'pass':
                    $data['db_password'] = $value;
                    unset($options[$key]);
                    break;
                case 'd':
                case 'dir':
                    $data['directus_path'] = $value;
                    unset($options[$key]);
                    break;
            }
        }

        InstallerUtils::createConfig($data, $this->directusPath . '/api');

        $this->clear();
    }

    private function createDatabase()
    {
        InstallerUtils::createTables($this->directusPath);

        $this->clear();
    }

    private function install()
    {
        $data = [];
        $options = $this->options;
        foreach ($options as $key => $value) {
            switch ($key) {
                case 'e':
                    $data['directus_email'] = $value;
                    unset($options[$key]);
                    break;
                case 'p':
                    $data['directus_password'] = $value;
                    unset($options[$key]);
                    break;
                case 't':
                    $data['directus_name'] = $value;
                    unset($options[$key]);
                    break;
            }
        }

        if (!isset($data['directus_password']) || !isset($data['directus_email'])) {
            echo PHP_EOL . __t('missing_email_or_password') . PHP_EOL;
            exit;
        }

        InstallerUtils::addDefaultSettings($data, $this->directusPath);
        InstallerUtils::addDefaultUser($data);

        $this->clear();
    }

    private function updatePassword()
    {
        $data = [];
        $options = $this->options;
        foreach ($options as $key => $value) {
            switch ($key) {
                case 'uid':
                case 'u':
                    $data['id'] = $value;
                    unset($options[$key]);
                    break;
                case 'upass':
                case 'p':
                    $data['password'] = $value;
                    unset($options[$key]);
                    break;
            }
        }

        if (!isset($data['password']) || !isset($data['id'])) {
            echo PHP_EOL . __t('Missing User ID or Password') . PHP_EOL;
            exit;
        }

        $zendDb = Bootstrap::get('zendDb');
        $userTableGateway = new TableGateway('directus_users', $zendDb);

        $result = $userTableGateway->update([
            // @TODO: Provider doesn't has static methods anymore
            'password' => \Directus\Authentication\Provider::hashPassword($data['password']),
            'access_token' => sha1($data['id'] . \Directus\Util\StringUtils::randomString())
        ], ['id' => $data['id']]);

        $message = 'Error trying to update the password.';
        if ($result) {
            $message = 'Password updated successfully';
        }

        echo PHP_EOL . __t($message) . PHP_EOL;
    }

    private function clear()
    {
        $this->command = '';
        $this->options = [];
    }

    private function parseOptions($argv)
    {
        $options = [];

        foreach ($argv as $arg) {
            if (preg_match("/^(-{1,2})([A-Za-z0-9-_]+)(=)?(.+)*$/", $arg, $argMatch)) {
                $value = '';
                if (count($argMatch) == 5) {
                    $value = $argMatch[4];
                }
                $key = $argMatch[2];

                $options[$key] = $value;
            }
        }

        return $options;
    }
}
