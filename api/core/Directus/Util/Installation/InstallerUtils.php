<?php

namespace Directus\Util\Installation;

use Directus\Bootstrap;
use Directus\Util\ArrayUtils;
use Directus\Util\StringUtils;
use Ruckusing\Framework as Ruckusing_Framework;
use Zend\Db\TableGateway\TableGateway;

class InstallerUtils
{
    /**
     * Create a config and configuration file into $path
     * @param $data
     * @param $path
     */
    public static function createConfig($data, $path)
    {
        $requiredAttributes = ['db_host', 'db_name', 'db_user', 'db_password', 'directus_path'];
        if (!ArrayUtils::contains($data, $requiredAttributes)) {
            $message = sprintf(__t('creating_config_files_required_x', [
                'attributes' => implode(', ', $requiredAttributes)
            ]));
            throw new \InvalidArgumentException($message);
        }

        static::createConfigFile($data, $path);
        static::createConfigurationFile($data, $path);
    }

    /**
     * Create config file into $path
     * @param $data
     * @param $path
     */
    protected static function createConfigFile($data, $path)
    {
        $configStub = file_get_contents(__DIR__.'/stubs/config.stub');
        $configStub = static::replacePlaceholderValues($configStub, $data);

        $configPath = rtrim($path, '/').'/config.php';
        file_put_contents($configPath, $configStub);
    }

    /**
     * Create configuration file into $path
     * @param $data
     * @param $path
     */
    protected static function createConfigurationFile($data, $path)
    {
        if (!isset($data['default_language'])) {
            $data['default_language'] = 'en';
        }

        $configurationStub = file_get_contents(__DIR__.'/stubs/configuration.stub');
        $configurationStub = static::replacePlaceholderValues($configurationStub, $data);

        $configurationPath = rtrim($path, '/').'/configuration.php';
        file_put_contents($configurationPath, $configurationStub);
    }

    /**
     * Replace placeholder wrapped by {{ }} with $data array
     * @param string $content
     * @param array $data
     * @return string
     */
    public static function replacePlaceholderValues($content, $data)
    {
        if (is_array($data)) {
            $data = ArrayUtils::dot($data);
        }

        $content = StringUtils::replacePlaceholder($content, $data);

        return $content;
    }

    /**
     * Create Directus Tables from Migrations
     * @param string $directusPath
     * @throws \Exception
     */
    public static function createTables($directusPath)
    {
        $directusPath = rtrim($directusPath, '/');
        /**
         * Check if configuration files exists
         * @throws \InvalidArgumentException
         */
        static::checkConfigurationFile($directusPath);

        require_once $directusPath.'/api/config.php';
        $config = require $directusPath.'/api/ruckusing.conf.php';
        $dbConfig = getDatabaseConfig(array(
            'type' => DB_TYPE,
            'host' => DB_HOST,
            'port' => DB_PORT,
            'name' => DB_NAME,
            'user' => DB_USER,
            'pass' => DB_PASSWORD,
            'directory' => 'directus',
            'prefix' => '',
        ));

        $config = array_merge($config, $dbConfig);
        $main = new Ruckusing_Framework($config);

        $main->execute(array('', 'db:setup'));
        $main->execute(array('', 'db:migrate'));
    }

    /**
     * Add Directus default settings
     * @param array $data
     * @param string $directusPath
     * @throws \Exception
     */
    public static function addDefaultSettings($data, $directusPath)
    {
        $directusPath = rtrim($directusPath, '/');
        /**
         * Check if configuration files exists
         * @throws \InvalidArgumentException
         */
        static::checkConfigurationFile($directusPath);

        require_once $directusPath.'/api/config.php';

        $db = Bootstrap::get('ZendDb');

        $defaultSettings = static::getDefaultSettings($data);

        $tableGateway = new TableGateway('directus_settings', $db);
        foreach($defaultSettings as $setting) {
            $tableGateway->insert($setting);
        }
    }

    /**
     * Add Directus default user
     * @param array $data
     */
    public static function addDefaultUser($data)
    {
        $db = Bootstrap::get('ZendDb');
        $tableGateway = new TableGateway('directus_users', $db);

        $hash = password_hash($data['directus_password'], PASSWORD_DEFAULT, ["cost" => 12]);

        $tableGateway->insert([
            'active' => 1,
            'first_name' => 'Admin',
            'last_name' => 'User',
            'email' => $data['directus_email'],
            'password' => $hash,
            'salt' => StringUtils::random(),
            'group' => 1,
            'locale' => $data['default_language']
        ]);
    }

    /**
     * Check if the given name is schema template.
     * @param $name
     * @param $directusPath
     * @return bool
     */
    public static function schemaTemplateExists($name, $directusPath)
    {
        $directusPath = rtrim($directusPath, '/');
        $schemaTemplatePath = $directusPath.'/api/migrations/templates/'.$name;

        if (!file_exists($schemaTemplatePath)) {
            return false;
        }

        $isEmpty = count(array_diff(scandir($schemaTemplatePath), ['..', '.'])) > 0 ? false : true;
        if (is_readable($schemaTemplatePath) && !$isEmpty) {
            return true;
        }

        return false;
    }

    /**
     * Install the given schema template name
     * @param $name
     * @param $directusPath
     * @throws \Exception
     */
    public static function installSchema($name, $directusPath)
    {
        $directusPath = rtrim($directusPath, '/');
        /**
         * Check if configuration files exists
         * @throws \InvalidArgumentException
         */
        static::checkConfigurationFile($directusPath);

        require_once $directusPath.'/api/config.php';

        $config = require $directusPath.'/api/ruckusing.conf.php';
        $dbConfig = getDatabaseConfig(array(
            'type' => DB_TYPE,
            'host' => DB_HOST,
            'port' => DB_PORT,
            'name' => DB_NAME,
            'user' => DB_USER,
            'pass' => DB_PASSWORD,
            'directory' => 'templates/'.$name,
            'prefix' => '',
        ));

        $config = array_merge($config, $dbConfig);
        $main = new Ruckusing_Framework($config);

        $main->execute(array('', 'db:migrate'));
    }

    /**
     * Get Directus default settings
     * @param $data
     * @return array
     */
    private static function getDefaultSettings($data)
    {
        return [
            [
                'collection' => 'global',
                'name' => 'cms_user_auto_sign_out',
                'value' => '60'
            ],
            [
                'collection' => 'global',
                'name' => 'project',
                'value' => $data['directus_name']
            ],
            [
                'collection' => 'global',
                'name' => 'project_url',
                'value' => 'http://examplesite.dev/'
            ],
            [
                'collection' => 'global',
                'name' => 'rows_per_page',
                'value' => '200'
            ],
            [
                'collection' => 'files',
                'name' => 'thumbnail_quality',
                'value' => '100'
            ],
            [
                'collection' => 'files',
                'name' => 'thumbnail_size',
                'value' => '200'
            ],
            [
                'collection' => 'global',
                'name' => 'cms_thumbnail_url',
                'value' => ''
            ],
            [
                'collection' => 'files',
                'name' => 'file_naming',
                'value' => 'file_id'
            ],
            [
                'collection' => 'files',
                'name' => 'thumbnail_crop_enabled',
                'value' => '1'
            ],
            [
                'collection' => 'files',
                'name' => 'youtube_api_key',
                'value' => ''
            ]
        ];
    }

    /**
     * Check if config and configuration file exists
     * @param $directusPath
     * @throws \Exception
     */
    private static function checkConfigurationFile($directusPath)
    {
        $directusPath = rtrim($directusPath, '/');
        if (!file_exists($directusPath.'/api/config.php')) {
            throw new \Exception('Config file does not exists, run [directus config]');
        }

        if (!file_exists($directusPath.'/api/ruckusing.conf.php')) {
            throw new \Exception('Migration configuration file does not exists');
        }
    }
}
