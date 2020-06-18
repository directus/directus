<?php

namespace Directus\Util\Installation;

use Directus\Application\Application;
use Directus\Config\Context;
use Directus\Config\Schema\Schema;
use Directus\Database\Connection;
use Directus\Database\Exception\ConnectionFailedException;
use Directus\Database\Schema\SchemaManager;
use Directus\Database\Schema\Sources\MySQLSchema;
use Directus\Database\TableGateway\DirectusUsersTableGateway;
use Directus\Exception\Exception;
use Directus\Exception\InvalidConfigPathException;
use Directus\Exception\InvalidPathException;
use function Directus\generate_uuid4;
use function Directus\get_default_timezone;
use Directus\Permissions\Acl;
use Directus\Util\ArrayUtils;
use Directus\Util\StringUtils;
use Directus\Util\DateTimeUtils;
use Phinx\Config\Config;
use Phinx\Migration\Manager;
use Symfony\Component\Console\Input\StringInput;
use Symfony\Component\Console\Output\NullOutput;
use Zend\Db\Sql\Ddl\DropTable;
use Zend\Db\Sql\Sql;
use Zend\Db\Sql\Select;
use Zend\Db\TableGateway\TableGateway;

class InstallerUtils
{
    const MIGRATION_CONFIGURATION_PATH = '/migrations/migrations.php';
    const MIGRATION_UPGRADE_CONFIGURATION_PATH = '/migrations/migrations.upgrades.php';
    /**
     * Add the upgraded migrations into directus_migration on a fresh installation of project.
     * Upgraded migrations may contain the same queries which is in db [Original] migrations.
     * So in every fresh installtion we have boycott the upgrades.
     * This function will add the upgrades migrations into directus_migrations table; so the current upgraded migrations cant be executed.
     *
     * @return boolean
     */
    public static function addUpgradeMigrations($basePath = null, $projectName = null)
    {

        if (
            Context::is_env() ||
            (!is_null($basePath) && !is_null($projectName))
        ) {
            $app = static::createApp($basePath, $projectName);
            $dbConnection = $app->getContainer()->get('database');
        } else {
            $basePath = \Directus\get_app_base_path();
            $dbConnection = Application::getInstance()->fromContainer('database');
        }

        $migrationsTableGateway = new TableGateway(SchemaManager::COLLECTION_MIGRATIONS, $dbConnection);

        $select = new Select($migrationsTableGateway->table);
        $select->columns(['version']);
        $result = $migrationsTableGateway->selectWith($select)->toArray();
        $alreadyStoredMigrations = array_column($result, 'version');

        $ignoreableFiles = ['..', '.', '.DS_Store'];
        $scannedDirectory = array_values(array_diff(scandir($basePath.'/migrations/upgrades'), $ignoreableFiles));
        foreach($scannedDirectory as $fileName){
            $data = [];
            $fileNameObject = explode("_", $fileName, 2);
            $migrationName = explode(".", str_replace(' ', '', ucwords(str_replace('_', ' ', $fileNameObject[1]))), 2);

            $data = [
                'version' => $fileNameObject[0],
                'migration_name' => $migrationName[0],
                'start_time' => DateTimeUtils::nowInUTC()->toString(),
                'end_time' => DateTimeUtils::nowInUTC()->toString()
            ];

            if(!in_array($data['version'],$alreadyStoredMigrations) && !is_null($data['version']) && !is_null($data['migration_name'])){
                $migrationsTableGateway->insert($data);
            }
        }
    }

    /**
     * Undocumented function
     *
     * @param string $basePath
     * @param string $projectName
     * @return \Directus\Application\Application
     */
    public static function createApp($basePath, $projectName)
    {
        if (Context::is_env()) {
            $config = Schema::get()->value(Context::from_env());
        } else {
            $config = require static::createConfigPath($basePath, $projectName);
        }
        return new Application($basePath, $config);
    }

    /**
     * Create a config and configuration file into $path
     *
     * @param string $path
     * @param array $data
     * @param bool $force
     */
    public static function createConfig($path, array $data, $force = false)
    {
        $requiredAttributes = ['db_name', 'db_user'];
        if (!ArrayUtils::contains($data, $requiredAttributes)) {
            throw new \InvalidArgumentException(
                'Creating config files required: ' . implode(', ', $requiredAttributes)
            );
        }

        $data = static::createConfigData($data);

        static::createConfigFile(rtrim($path, '/'), $data, $force);
    }

    public static function createConfigFileContent($data)
    {
        $configStub = file_get_contents(__DIR__ . '/stubs/config.stub');

        $configStub = static::replacePlaceholderValues($configStub, $data);

        // Users are allowed to sent {{project}} to be replaced with the project name
        return static::replacePlaceholderValues($configStub, ArrayUtils::pick($data, 'project'));
    }


    /**
     * Creates a api json file to store the superadmin password
     *
     * @param string $name
     *
     * @throws NotFoundException
     * @throws UnprocessableEntityException
     */
    public static function createJsonFileContent($data)
    {
        $configStub = file_get_contents(__DIR__ . '/stubs/api.stub');

        return static::replacePlaceholderValues($configStub, $data);
    }

    /**
     * Replace placeholder wrapped by {{ }} with $data array
     *
     * @param string $content
     * @param array $data
     *
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
     * Ensure the tables can be created
     *
     * @param string $path
     * @param array $data
     *        The JSON that the user POSTed to the create-project endpoint
     *        Required in here are the database credentials
     * @param bool $force
     */
    public static function ensureCanCreateTables($path, array $data, $force = false)
    {
        static::ensureMigrationFileExists($path);
        static::ensureDatabaseConnectionFromData($data);
        if ($force !== true) {
            static::ensureSystemTablesDoesNotExistsFromData($data);
        }
    }

    /**
     * Create Directus Tables from Migrations
     *
     * @param string $basePath
     * @param string $env
     * @param bool $force
     *
     * @throws \Exception
     */
    public static function createTables($basePath, $env = null, $force = false)
    {
        $config = static::getMigrationConfig($basePath, $env);

        if ($force === true) {
            static::dropTables($basePath, $env);
        }

        static::runMigrationAndSeeder($config);
    }

    public static function cleanDatabase($basePath, $projectName = null)
    {
        static::dropTables($basePath, $projectName);
    }

    /**
     * Update Directus Tables from Migrations
     *
     * @param string $basePath
     * @param string $env
     *
     * @throws \Exception
     */
    public static function updateTables($basePath, $env = null)
    {
        $config = static::getMigrationConfig($basePath, $env, 'upgrades');

        static::runMigrationAndSeeder($config);
    }

    /**
     * Create Directus Tables from Migrations
     *
     * @param Config $config
     *
     * @throws \Exception
     */
    public static function runMigrationAndSeeder(Config $config)
    {
        $manager = new Manager($config, new StringInput(''), new NullOutput());
        $manager->migrate('development');
        if(!empty($config['paths']['seeds'])){
            $manager->seed('development');
        }
    }

    /**
     * Throws an exception if it can make a database connection
     *
     * @param array $data
     *
     * @throws Exception
     */
    public static function ensureDatabaseConnectionFromData(array $data)
    {
        $db = static::createDatabaseConnectionFromData($data);

        try {
            $db->connect();
        } catch (\Exception $e) {
            throw new ConnectionFailedException($e);
        }
    }

    /**
     * Checks whether there's a single Directus collection in the database using the given data
     *
     * @param array $data
     *
     * @return bool
     */
    public static function hasSomeDirectusTablesFromData(array $data)
    {
        $exists = false;

        static::getDirectusTablesFromData($data, function () use (&$exists) {
            $exists = true;

            return false;
        });

        return $exists;
    }

    /**
     * Run the migration files
     *
     * @param $directusPath
     */
    public static function runMigration($directusPath)
    {
        $config = static::getMigrationConfig($directusPath);

        $manager = new Manager($config, new StringInput(''), new NullOutput());
        $manager->migrate('development');
    }

    /**
     * Run the seeder files
     *
     * @param $directusPath
     */
    public static function runSeeder($directusPath)
    {
        $config = static::getMigrationConfig($directusPath);

        $manager = new Manager($config, new StringInput(''), new NullOutput());
        $manager->seed('development');
    }

    /**
     * Add Directus default settings
     *
     * @param string $basePath
     * @param array $data
     * @param string $projectName
     *
     * @throws \Exception
     */
    public static function addDefaultSettings($basePath, array $data, $projectName = null)
    {
        $basePath = rtrim($basePath, '/');
        static::ensureConfigFileExists($basePath, $projectName);
        $app = static::createApp($basePath, $projectName);
        $db = $app->getContainer()->get('database');

        $defaultSettings = static::getDefaultSettings($data);
        $tableGateway = new TableGateway('directus_settings', $db);
        foreach ($defaultSettings as $setting) {
            $tableGateway->insert($setting);
        }
    }

    /**
     * Add Directus default user
     *
     * @param string $basePath
     * @param array $data
     * @param string $projectName
     *
     * @return array
     */
    public static function addDefaultUser($basePath, array $data, $projectName = null)
    {
        $app = static::createApp($basePath, $projectName);
        $db = $app->getContainer()->get('database');
        $auth = $app->getContainer()->get('auth');
        $tableGateway = new TableGateway('directus_users', $db);

        $data = ArrayUtils::defaults([
            'user_email' => 'admin@example.com',
            'user_password' => 'password',
            'user_token' => null,
            'timezone' => get_default_timezone($app),
            'locale' => 'en-US',
        ], $data);

        $hash = $auth->hashPassword($data['user_password']);

        $tableGateway->insert([
            'status' => DirectusUsersTableGateway::STATUS_ACTIVE,
            'first_name' => 'Admin',
            'last_name' => 'User',
            'email' => $data['user_email'],
            'password' => $hash,
            'token' => $data['user_token'],
            'timezone' => $data['timezone'],
            'locale' => $data['locale'],
            'role' => 1
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
     * @param string $name
     * @param string $directusPath
     * @param string $projectName
     *
     * @throws \Exception
     */
    public static function installSchemaFromMigration($name, $directusPath, $projectName = null)
    {
        $directusPath = rtrim($directusPath, '/');
        static::ensureConfigFileExists($directusPath, $projectName);

        // TODO: Install schema templates
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
        $dbConnection = Application::getInstance()->fromContainer('database');

        $dbConnection->execute($sql);
    }

    /**
     * Returns the config name based on its environment
     *
     * @param $projectName
     *
     * @return string
     */
    public static function getConfigName($projectName,$private=false)
    {
        $text = $private ? "private.%s" : "%s";
        return sprintf($text, $projectName);
    }

    /**
     * Throws an exception if it can create a config file
     *
     * @param string $path
     * @param array $data
     * @param bool $force
     */
    public static function ensureCanCreateConfig($path, array $data, $force = false)
    {
        $input = ArrayUtils::omit($data, ['private']);
        $configPath = static::createConfigPathFromData($path, $input);

        static::ensureDirectoryIsWritable($path . '/config');
        if ($force !== true) {
            static::ensureFileDoesNotExists($configPath);
        }
    }

    /**
     * Deletes the given config file
     *
     * @param string $path
     * @param string|null $projectName
     */
    public static function deleteConfigFile($path, $projectName = null)
    {
        $filePath = static::createConfigPath($path, $projectName);

        static::ensureConfigFileExists($path, $projectName);
        static::ensureFileCanBeDeleted($filePath);

        @unlink($filePath);
    }

    /**
     * Creates a config path for the given environment
     *
     * @param string $path
     * @param string $projectName
     *
     * @return string
     */
    public static function createConfigPath($path, $projectName, $private=null)
    {
        if(!is_null($private)){
            $configName = static::getConfigName($projectName,$private);
        }else{
            $publicConfig = static::getConfigName($projectName);
            $privateConfig = static::getConfigName($projectName,true);
            $configName = file_exists($path . '/config/' . $privateConfig . '.php') ? $privateConfig : $publicConfig;
        }

        return $path . '/config/' . $configName . '.php';
    }

    public static function getDefaultPermissions()
    {
        return [
            SchemaManager::COLLECTION_ACTIVITY => [
                'create' => Acl::LEVEL_FULL,
                'read' => Acl::LEVEL_MINE,
                'update' => Acl::LEVEL_NONE,
                'delete' => Acl::LEVEL_NONE,
                'comment' => Acl::COMMENT_LEVEL_UPDATE,
                'explain' => Acl::EXPLAIN_LEVEL_NONE,
            ],
            SchemaManager::COLLECTION_COLLECTION_PRESETS => [
                'create' => Acl::LEVEL_FULL,
                'read' => Acl::LEVEL_FULL,
                'update' => Acl::LEVEL_MINE,
                'delete' => Acl::LEVEL_MINE,
                'comment' => Acl::COMMENT_LEVEL_NONE,
                'explain' => Acl::EXPLAIN_LEVEL_NONE,
            ],
            SchemaManager::COLLECTION_COLLECTIONS => [
                'create' => Acl::LEVEL_NONE,
                'read' => Acl::LEVEL_FULL,
                'update' => Acl::LEVEL_NONE,
                'delete' => Acl::LEVEL_NONE,
                'comment' => Acl::COMMENT_LEVEL_NONE,
                'explain' => Acl::EXPLAIN_LEVEL_NONE,
            ],
            SchemaManager::COLLECTION_FIELDS => [
                'create' => Acl::LEVEL_NONE,
                'read' => Acl::LEVEL_FULL,
                'update' => Acl::LEVEL_NONE,
                'delete' => Acl::LEVEL_NONE,
                'comment' => Acl::COMMENT_LEVEL_NONE,
                'explain' => Acl::EXPLAIN_LEVEL_NONE,
            ],
            SchemaManager::COLLECTION_FILES => [
                'create' => Acl::LEVEL_FULL,
                'read' => Acl::LEVEL_FULL,
                'update' => Acl::LEVEL_FULL,
                'delete' => Acl::LEVEL_FULL,
                'comment' => Acl::COMMENT_LEVEL_NONE,
                'explain' => Acl::EXPLAIN_LEVEL_NONE,
            ],
            SchemaManager::COLLECTION_FOLDERS => [
                'create' => Acl::LEVEL_FULL,
                'read' => Acl::LEVEL_FULL,
                'update' => Acl::LEVEL_FULL,
                'delete' => Acl::LEVEL_FULL,
                'comment' => Acl::COMMENT_LEVEL_NONE,
                'explain' => Acl::EXPLAIN_LEVEL_NONE,
            ],
            SchemaManager::COLLECTION_PERMISSIONS => [
                'create' => Acl::LEVEL_NONE,
                'read' => Acl::LEVEL_MINE,
                'update' => Acl::LEVEL_NONE,
                'delete' => Acl::LEVEL_NONE,
                'comment' => Acl::COMMENT_LEVEL_NONE,
                'explain' => Acl::EXPLAIN_LEVEL_NONE,
            ],
            SchemaManager::COLLECTION_RELATIONS => [
                'create' => Acl::LEVEL_NONE,
                'read' => Acl::LEVEL_FULL,
                'update' => Acl::LEVEL_NONE,
                'delete' => Acl::LEVEL_NONE,
                'comment' => Acl::COMMENT_LEVEL_NONE,
                'explain' => Acl::EXPLAIN_LEVEL_NONE,
            ],
            SchemaManager::COLLECTION_REVISIONS => [
                'create' => Acl::LEVEL_FULL,
                'read' => Acl::LEVEL_FULL,
                'update' => Acl::LEVEL_NONE,
                'delete' => Acl::LEVEL_NONE,
                'comment' => Acl::COMMENT_LEVEL_NONE,
                'explain' => Acl::EXPLAIN_LEVEL_NONE,
            ],
            SchemaManager::COLLECTION_ROLES => [
                'create' => Acl::LEVEL_NONE,
                'read' => Acl::LEVEL_MINE,
                'update' => Acl::LEVEL_NONE,
                'delete' => Acl::LEVEL_NONE,
                'comment' => Acl::COMMENT_LEVEL_NONE,
                'explain' => Acl::EXPLAIN_LEVEL_NONE,
            ],
            SchemaManager::COLLECTION_SETTINGS => [
                'create' => Acl::LEVEL_NONE,
                'read' => Acl::LEVEL_FULL,
                'update' => Acl::LEVEL_NONE,
                'delete' => Acl::LEVEL_NONE,
                'comment' => Acl::COMMENT_LEVEL_NONE,
                'explain' => Acl::EXPLAIN_LEVEL_NONE,
            ],
            SchemaManager::COLLECTION_USERS => [
                [
                    'status' => DirectusUsersTableGateway::STATUS_ACTIVE,
                    'create' => Acl::LEVEL_NONE,
                    'read' => Acl::LEVEL_FULL,
                    'update' => Acl::LEVEL_MINE,
                    'delete' => Acl::LEVEL_MINE,
                    'comment' => Acl::COMMENT_LEVEL_NONE,
                    'explain' => Acl::EXPLAIN_LEVEL_NONE,
                ], [
                    'status' => DirectusUsersTableGateway::STATUS_DELETED,
                    'create' => Acl::LEVEL_NONE,
                    'read' => Acl::LEVEL_NONE,
                    'update' => Acl::LEVEL_NONE,
                    'delete' => Acl::LEVEL_NONE,
                    'comment' => Acl::COMMENT_LEVEL_NONE,
                    'explain' => Acl::EXPLAIN_LEVEL_NONE,
                ], [
                    'status' => DirectusUsersTableGateway::STATUS_DRAFT,
                    'create' => Acl::LEVEL_NONE,
                    'read' => Acl::LEVEL_NONE,
                    'update' => Acl::LEVEL_NONE,
                    'delete' => Acl::LEVEL_NONE,
                    'comment' => Acl::COMMENT_LEVEL_NONE,
                    'explain' => Acl::EXPLAIN_LEVEL_NONE,
                ], [
                    'status' => DirectusUsersTableGateway::STATUS_INVITED,
                    'create' => Acl::LEVEL_NONE,
                    'read' => Acl::LEVEL_NONE,
                    'update' => Acl::LEVEL_NONE,
                    'delete' => Acl::LEVEL_NONE,
                    'comment' => Acl::COMMENT_LEVEL_NONE,
                    'explain' => Acl::EXPLAIN_LEVEL_NONE,
                ], [
                    'status' => DirectusUsersTableGateway::STATUS_SUSPENDED,
                    'create' => Acl::LEVEL_NONE,
                    'read' => Acl::LEVEL_NONE,
                    'update' => Acl::LEVEL_NONE,
                    'delete' => Acl::LEVEL_NONE,
                    'comment' => Acl::COMMENT_LEVEL_NONE,
                    'explain' => Acl::EXPLAIN_LEVEL_NONE,
                ]
            ],

        ];
    }

    /**
     * Check if the api configuration file exists
     *
     * @param string $basePath
     * @param null $projectName
     *
     * @throws \Exception
     */
    public static function ensureConfigFileExists($basePath, $projectName)
    {
        if (Context::is_env()) {
            return;
        }

        $basePath = rtrim($basePath, '/');
        $configName = static::getConfigName($projectName);
        $configPath = static::createConfigPath($basePath, $projectName);

        if (!file_exists($configPath)) {
            throw new InvalidPathException(
                sprintf('Config file for "%s" does not exist at: "%s"', $configName, $basePath)
            );
        }
    }

    /**
     * Creates a config path from data
     *
     * @param string $path
     * @param array $data
     *
     * @return string
     */
    private static function createConfigPathFromData($path, array $data)
    {
        return static::createConfigPath($path, ArrayUtils::get($data, 'project'), ArrayUtils::get($data, 'private'));
    }

    /**
     * Create config file into $path
     *
     * @param string $path
     * @param array $data
     * @param bool $force
     */
    private static function createConfigFile($path, array $data, $force = false)
    {
        static::ensureCanCreateConfig($path, $data, $force);

        $configStub = static::createConfigFileContent($data);
        $configPath = static::createConfigPathFromData($path, $data);

        file_put_contents($configPath, $configStub);
    }

    /**
     * @param string $basePath
     * @param string $projectName
     * @param string|null $migrationName
     *
     * @return Config
     */
    private static function getMigrationConfig($basePath, $projectName = null, $migrationName = 'install')
    {
        static::ensureConfigFileExists($basePath, $projectName);
        static::ensureMigrationFileExists($basePath);

        $configPath = static::createConfigPath($basePath, $projectName);
        $migrationPath = $basePath . '/migrations/' . $migrationName;

        if (Context::is_env()) {
            $apiConfig = ArrayUtils::get(Schema::get()->value(Context::from_env()), 'database', []);
        } else {
            $apiConfig = ArrayUtils::get(require $configPath, 'database', []);
        }

        // Rename directus configuration to phinx configuration
        ArrayUtils::rename($apiConfig, 'type', 'adapter');
        ArrayUtils::rename($apiConfig, 'username', 'user');
        ArrayUtils::rename($apiConfig, 'password', 'pass');
        ArrayUtils::rename($apiConfig, 'socket', 'unix_socket');
        $apiConfig['charset'] = ArrayUtils::get($apiConfig, 'database.charset', 'utf8mb4');

        $configArray = $migrationName == "install" ? require $basePath.self::MIGRATION_CONFIGURATION_PATH :require $basePath.self::MIGRATION_UPGRADE_CONFIGURATION_PATH;
        $configArray['paths']['migrations'] = $migrationPath;
        $configArray['environments']['development'] = $apiConfig;

        return new Config($configArray);
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
                'key' => 'project_name',
                'value' => isset($data['project_name']) ? $data['project_name'] : 'Directus'
            ],
            [
                'key' => 'app_url',
                'value' => isset($data['app_url']) ? $data['app_url'] : ''
            ],
        ];
    }

    /**
     * Checks if the migration configuration file exists
     *
     * @param string $basePath
     *
     * @throws InvalidPathException
     */
    private static function ensureMigrationFileExists($basePath)
    {
        $migrationConfigPath = $basePath . self::MIGRATION_CONFIGURATION_PATH;

        if (!file_exists($migrationConfigPath)) {
            throw new InvalidPathException(
                sprintf('Migration configuration file was not found at: %s', $migrationConfigPath)
            );
        }
    }

    /**
     * Throws an exception when the given directory is not writable
     *
     * @param string $path
     *
     * @throws InvalidPathException
     */
    private static function ensureDirectoryIsWritable($path)
    {
        if (!is_writable($path) || !is_dir($path)) {
            throw new InvalidPathException(
                sprintf('Unable to create the config file at "%s"', $path)
            );
        }
    }

    /**
     * Throws an exception when the given file path cannot be deleted
     *
     * @param string $path
     *
     * @throws InvalidPathException
     */
    private static function ensureFileCanBeDeleted($path)
    {
        if (!is_writable($path) || !is_file($path)) {
            throw new InvalidPathException(
                sprintf('Unable to delete the config file at "%s"', $path)
            );
        }
    }

    /**
     * Throws an exception when file exists
     *
     * @param string $path
     *
     * @throws InvalidConfigPathException
     */
    private static function ensureFileDoesNotExists($path)
    {
        if (file_exists($path) && is_file($path)) {
            throw new InvalidConfigPathException($path);
        }
    }

    /**
     * Checks if there is not a single system table in the database
     *
     * @param array $data
     *
     * @throws Exception
     */
    private static function ensureSystemTablesDoesNotExistsFromData(array $data)
    {
        static::getDirectusTablesFromData($data, function (Connection $db, $name) {
            throw new Exception(
                sprintf('The "%s" database already contains Directus system tables.', $db->getCurrentSchema())
            );
        });
    }

    /**
     * Loop through all Directus tables using the given connection data
     *
     * @param array $data
     * @param \Closure $callback
     */
    private static function getDirectusTablesFromData(array $data, \Closure $callback)
    {
        $db = static::createDatabaseConnectionFromData($data);
        $schemaManager = static::createSchemaManagerFromData($data, $db);

        foreach (SchemaManager::getSystemCollections() as $table) {
            if ($schemaManager->collectionExists($table)) {
                if ($callback($db, $table) === false) {
                    break;
                }
            }
        }
    }

    /**
     * Creates a database connection from data
     *
     * @param array $data
     *
     * @return Connection
     */
    private static function createDatabaseConnectionFromData(array $data)
    {
        $data = static::createConfigData($data);
        $charset = ArrayUtils::get($data, 'db_charset', 'utf8mb4');

        $dbConfig = [
            'driver' => 'Pdo_' . ArrayUtils::get($data, 'db_type'),
            'host' => ArrayUtils::get($data, 'db_host'),
            'port' => ArrayUtils::get($data, 'db_port'),
            'database' => ArrayUtils::get($data, 'db_name'),
            'username' => ArrayUtils::get($data, 'db_user'),
            'password' => ArrayUtils::get($data, 'db_password'),
            'charset' => $charset,
            \PDO::MYSQL_ATTR_USE_BUFFERED_QUERY => true,
            \PDO::MYSQL_ATTR_INIT_COMMAND => sprintf('SET NAMES "%s"', $charset)
        ];

        if (ArrayUtils::get($data, 'db_socket')) {
            ArrayUtils::remove($dbConfig, 'host');
            $dbConfig['unix_socket'] = $data['db_socket'];
        }

        return new Connection($dbConfig);
    }

    /**
     * Creates a Schema Manager adapter
     *
     * @param array $data
     * @param Connection|null $db
     *
     * @return SchemaManager
     */
    private static function createSchemaManagerFromData(array $data, Connection $db = null)
    {
        if ($db === null) {
            $db = static::createDatabaseConnectionFromData($data);
        }

        // TODO: Implement a factory to support multiple adapters
        return new SchemaManager(new MySQLSchema($db));
    }

    /**
     * Drop all system tables
     *
     * @param string $basePath
     * @param string $projectName
     */
    private static function dropTables($basePath, $projectName)
    {
        $app = static::createApp($basePath, $projectName);
        /** @var Connection $db */
        $db = $app->getContainer()->get('database');
        /** @var SchemaManager $schemaManager */
        $schemaManager = $app->getContainer()->get('schema_manager');

        foreach (SchemaManager::getSystemCollections() as $table) {
            if (!$schemaManager->collectionExists($table)) {
                continue;
            }

            $dropTable = new DropTable($table);

            $sql = new Sql($db);
            $query = $sql->buildSqlString($dropTable);

            $db->query(
                $query
            )->execute();
        }
    }

    /**
     * Add the default attributes to config data
     *
     * @param array $data
     *
     * @return array
     */
    private static function createConfigData(array $data)
    {
        $corsEnabled = ArrayUtils::get($data, 'cors_enabled', true);
        $authSecret = ArrayUtils::get($data, 'auth_secret', StringUtils::randomString(32, false));
        $authPublic = ArrayUtils::get($data, 'auth_public', generate_uuid4());
        $ttl = ArrayUtils::get($data, 'ttl', 20);

        return ArrayUtils::defaults([
            'project' => '_',
            'db_type' => 'mysql',
            'db_host' => 'localhost',
            'db_port' => 3306,
            'db_password' => null,
            'db_socket' => '',
            'mail_from' => 'admin@example.com',
            'timezone' => get_default_timezone(),
            'logs_path' => __DIR__ . '/../../../../../logs',
            'cache' => [
                'enabled' => false,
                'response_ttl' => 3600,
            ],
            'storage' => [
                'adapter' => 'local',
                'root' => 'public/uploads/{{project}}/originals',
                'root_url' => '/uploads/{{project}}/originals',
                'thumb_root' => 'public/uploads/{{project}}/generated',
            ],
            'mail' => [
                'transport' => 'sendmail',
            ],
            'cookie' => [
                'same_site' => 'Lax',
                'secure' => false,
            ],
            'cors' => [
                'enabled' => $corsEnabled,
                'origin' => ['*'],
                'methods' => [
                    'GET',
                    'POST',
                    'PUT',
                    'PATCH',
                    'DELETE',
                    'HEAD',
                ],
                'headers' => [],
                'exposed_headers' => [],
                'max_age' => 600,
                'credentials' => true,
            ],
            'rate_limit' => [
                'enabled' => false,
                'limit' => 100,
                'interval' => 60,
                'adapter' => 'redis',
                'host' => '127.0.0.1',
                'port' => 6379,
                'timeout' => 10,
            ],
            'auth' => [
                'secret' => $authSecret,
                'public' => $authPublic,
                'ttl' => $ttl
            ]
        ], $data);
    }
}
