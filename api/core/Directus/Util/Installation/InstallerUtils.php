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

    public static function createConfigFileContent($data)
    {
        $configStub = file_get_contents(__DIR__ . '/stubs/config.stub');
        $data = ArrayUtils::pick($data, [
            'db_type',
            'db_host',
            'db_port',
            'db_name',
            'db_user',
            'db_password',
            'directus_path'
        ]);

        return static::replacePlaceholderValues($configStub, $data);
    }

    /**
     * Create config file into $path
     * @param $data
     * @param $path
     */
    protected static function createConfigFile($data, $path)
    {
        $data = ArrayUtils::defaults([
            'directus_path' => '/'
        ], $data);

        $configStub = static::createConfigFileContent($data);

        $configPath = rtrim($path, '/') . '/config.php';
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

        $data = ArrayUtils::defaults([
            'directus_email' => 'root@localhost',
            'default_language' => 'en',
            'feedback_token' => sha1(gmdate('U') . StringUtils::randomString(32)),
            'feedback_login' => true
        ], $data);

        $configurationStub = file_get_contents(__DIR__ . '/stubs/configuration.stub');
        $configurationStub = static::replacePlaceholderValues($configurationStub, $data);

        $configurationPath = rtrim($path, '/') . '/configuration.php';
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

        require_once $directusPath . '/api/config.php';
        $config = require $directusPath . '/api/ruckusing.conf.php';
        $dbConfig = getDatabaseConfig([
            'type' => DB_TYPE,
            'host' => DB_HOST,
            'port' => DB_PORT,
            'name' => DB_NAME,
            'user' => DB_USER,
            'pass' => DB_PASSWORD,
            'directory' => 'schema',
            'prefix' => '',
        ]);

        $config = array_merge($config, $dbConfig);
        $main = new Ruckusing_Framework($config);

        $main->execute(['', 'db:setup']);
        $main->execute(['', 'db:migrate']);
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

        require_once $directusPath . '/api/config.php';

        $db = Bootstrap::get('ZendDb');

        $defaultSettings = static::getDefaultSettings($data);

        $tableGateway = new TableGateway('directus_settings', $db);
        foreach ($defaultSettings as $setting) {
            $tableGateway->insert($setting);
        }
    }

    /**
     * Add Directus default user
     *
     * @param array $data
     * @return array
     */
    public static function addDefaultUser($data)
    {
        $db = Bootstrap::get('ZendDb');
        $tableGateway = new TableGateway('directus_users', $db);

        $hash = password_hash($data['directus_password'], PASSWORD_DEFAULT, ['cost' => 12]);

        $data['user_salt'] = StringUtils::randomString();
        $data['user_token'] = StringUtils::randomString(32);
        $data['avatar'] = get_gravatar($data['directus_email']);

        $tableGateway->insert([
            'status' => 1,
            'first_name' => 'Admin',
            'last_name' => 'User',
            'email' => $data['directus_email'],
            'password' => $hash,
            'salt' => $data['user_salt'],
            'avatar' => $data['avatar'],
            'group' => 1,
            'token' => $data['user_token'],
            'language' => ArrayUtils::get($data, 'default_language', 'en')
        ]);

        return $data;
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
        $schemaTemplatePath = $directusPath . '/api/migrations/templates/' . $name;

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
     *
     * @param $name
     * @param $directusPath
     *
     * @throws \Exception
     */
    public static function installSchema($name, $directusPath)
    {
        $directusPath = rtrim($directusPath, '/');
        $templatePath = $directusPath . '/api/migrations/templates/' . $name;
        $sqlImportPath = $templatePath . '/import.sql';

        if (file_exists($sqlImportPath)) {
            static::installSchemaFromSQL(file_get_contents($sqlImportPath));
        } else {
            static::installSchemaFromMigration($name, $directusPath);
        }
    }

    /**
     * Executes the template migration
     *
     * @param $name
     * @param $directusPath
     *
     * @throws \Exception
     */
    public static function installSchemaFromMigration($name, $directusPath)
    {
        $directusPath = rtrim($directusPath, '/');

        /**
         * Check if configuration files exists
         * @throws \InvalidArgumentException
         */
        static::checkConfigurationFile($directusPath);

        require_once $directusPath . '/api/config.php';

        $config = require $directusPath . '/api/ruckusing.conf.php';
        $dbConfig = getDatabaseConfig([
            'type' => DB_TYPE,
            'host' => DB_HOST,
            'port' => DB_PORT,
            'name' => DB_NAME,
            'user' => DB_USER,
            'pass' => DB_PASSWORD,
            'directory' => 'templates/' . $name,
            'prefix' => '',
        ]);

        $config = array_merge($config, $dbConfig);
        $main = new Ruckusing_Framework($config);

        $main->execute(['', 'db:migrate']);
    }

    /**
     * Execute a sql query string
     *
     * NOTE: This is not recommended at all
     *       we are doing this because we are trained pro
     *       soon to be deprecated
     *
     * @param $sql
     *
     * @throws \Exception
     */
    public static function installSchemaFromSQL($sql)
    {
        $dbConnection = Bootstrap::get('ZendDb');

        $dbConnection->execute($sql);
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
                'name' => 'project_name',
                'value' => $data['directus_name']
            ],
            [
                'collection' => 'global',
                'name' => 'project_url',
                'value' => get_url()
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
        if (!file_exists($directusPath . '/api/config.php')) {
            throw new \Exception('Config file does not exists, run [directus config]');
        }

        if (!file_exists($directusPath . '/api/ruckusing.conf.php')) {
            throw new \Exception('Migration configuration file does not exists');
        }
    }
}
