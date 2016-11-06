<?php

namespace Directus;

use Directus\Acl\Acl;
use Directus\Application\Application;
use Directus\Auth\Provider as AuthProvider;
use Directus\Database\Connection;
use Directus\Database\SchemaManager;
use Directus\Database\Schemas\Sources\MySQLSchema;
use Directus\Database\Schemas\Sources\SQLiteSchema;
use Directus\Database\TableGateway\BaseTableGateway;
use Directus\Database\TableGateway\DirectusPrivilegesTableGateway;
use Directus\Database\TableGateway\DirectusSettingsTableGateway;
use Directus\Database\TableGateway\DirectusTablesTableGateway;
use Directus\Database\TableGateway\DirectusUsersTableGateway;
use Directus\Database\TableSchema;
use Directus\Embed\EmbedManager;
use Directus\Filesystem\Filesystem;
use Directus\Filesystem\FilesystemFactory;
use Directus\Hook\Emitter;
use Directus\Language\LanguageManager;
use Directus\Session\Session;
use Directus\Session\Storage\NativeSessionStorage;
use Directus\Util\ArrayUtils;
use Directus\View\Twig\DirectusTwigExtension;
use Slim\Extras\Log\DateTimeFileWriter;
use Slim\Extras\Views\Twig;
use Slim\Slim;

/**
 * NOTE: This class depends on the constants defined in config.php
 */
class Bootstrap
{

    public static $singletons = [];

    /**
     * Returns the instance of the specified singleton, instantiating one if it
     * doesn't yet exist.
     * @param  string $key The name of the singleton / singleton factory function
     * @param  mixed $arg An argument to be passed to the singleton factory function
     * @param  bool $newInsnce return new instance rather than singleton instance (useful for long running scripts to get a new Db Conn)
     * @return mixed           The singleton with the specified name
     */
    public static function get($key, $arg = null, $newInstance = false)
    {
        $key = strtolower($key);
        if (!method_exists(__CLASS__, $key)) {
            throw new \InvalidArgumentException('No such factory function on ' . __CLASS__ . ': ' . $key);
        }
        if ($newInstance) {
            return call_user_func(__CLASS__ . '::' . $key, $arg);
        }
        if (!array_key_exists($key, self::$singletons)) {
            self::$singletons[$key] = call_user_func(__CLASS__ . '::' . $key, $arg);
        }
        return self::$singletons[$key];
    }

    /**
     * Does an extension by the given name exist?
     * @param  string $extensionName
     * @return bool
     */
    public static function extensionExists($extensionName)
    {
        $extensions = self::get('extensions');
        return array_key_exists($extensionName, $extensions);
    }

    /**
     * Get all custom endpoints
     * @return array - list of endpoint files loaded
     * @throws \Exception
     */
    public static function getCustomEndpoints()
    {
        self::requireConstants('APPLICATION_PATH', __FUNCTION__);
        $endpointsDirectory = APPLICATION_PATH . '/customs/endpoints';

        if (!file_exists($endpointsDirectory)) {
            return [];
        }

        return find_php_files($endpointsDirectory, true);
    }

    /**
     * Used to interrupt the bootstrapping of a singleton if the constants it
     * requires aren't defined.
     * @param  string|array $constants One or more constant names
     * @param  string $dependentFunctionName The name of the function establishing the dependency.
     * @return  null
     * @throws  Exception If the specified constants are not defined
     */
    private static function requireConstants($constants, $dependentFunctionName)
    {
        if (!is_array($constants)) {
            $constants = [$constants];
        }
        foreach ($constants as $constant) {
            if (!defined($constant)) {
                throw new \Exception(__CLASS__ . '#' . $dependentFunctionName . 'depends on undefined constant ' . $constant);
            }
        }
    }

    /**
     * SINGLETON FACTORY FUNCTIONS
     */

    /**
     * Make Slim app.
     * @return Slim
     */
    private static function app()
    {
        self::requireConstants(['DIRECTUS_ENV', 'APPLICATION_PATH'], __FUNCTION__);
        $loggerSettings = [
            'path' => APPLICATION_PATH . '/api/logs'
        ];

        $app = new Application([
            'templates.path' => APPLICATION_PATH . '/api/views/',
            'mode' => DIRECTUS_ENV,
            'debug' => false,
            'log.enable' => true,
            'log.writer' => new DateTimeFileWriter($loggerSettings),
            'view' => new Twig()
        ]);

        Twig::$twigExtensions = [
            new DirectusTwigExtension()
        ];

        $app->container->singleton('emitter', function () {
            return Bootstrap::get('hookEmitter');
        });

        BaseTableGateway::setHookEmitter($app->container->get('emitter'));

        // @NOTE: Trying to separate the configuration from bootstrap, bit by bit.
        TableSchema::setConfig(static::get('config'));

        return $app;
    }

    private static function config()
    {
        self::requireConstants('BASE_PATH', __FUNCTION__);
        $config = require APPLICATION_PATH . '/api/configuration.php';
        return $config;
    }

    private static function status()
    {
        $config = self::get('config');
        $status = $config['statusMapping'];
        return $status;
    }

    private static function mailer()
    {
        $config = self::get('config');
        if (!array_key_exists('mail', $config)) {
            return null;
        }

        $mailConfig = $config['mail'];
        switch ($mailConfig['transport']) {
            case 'smtp':
                $transport = \Swift_SmtpTransport::newInstance($mailConfig['host'], $mailConfig['port']);
                if (array_key_exists('username', $mailConfig)) {
                    $transport->setUsername($mailConfig['username']);
                }
                if (array_key_exists('password', $mailConfig)) {
                    $transport->setPassword($mailConfig['password']);
                }
                break;
            case 'sendmail':
                $transport = \Swift_SendmailTransport::newInstance($mailConfig['sendmail']);
                break;
            case 'mail':
            default:
                $transport = \Swift_MailTransport::newInstance();
                break;
        }

        $mailer = \Swift_Mailer::newInstance($transport);

        return $mailer;
    }

    /**
     * Yield Slim logger
     * @return \Slim\Extras\Log\DateTimeFileWriter
     */
    private static function log()
    {
        return self::get('app')->getLog();
    }

    private static function zendDbSlave()
    {
        if (!defined('DB_HOST_SLAVE')) {
            return self::zenddb();
        }
        self::requireConstants(['DIRECTUS_ENV', 'DB_HOST_SLAVE', 'DB_NAME', 'DB_USER_SLAVE', 'DB_PASSWORD_SLAVE'], __FUNCTION__);
        $dbConfig = [
            'driver' => 'Pdo_Mysql',
            'host' => DB_HOST_SLAVE,
            'database' => DB_NAME,
            'username' => DB_USER_SLAVE,
            'password' => DB_PASSWORD_SLAVE,
            'charset' => 'utf8',
            \PDO::MYSQL_ATTR_USE_BUFFERED_QUERY => true,
            \PDO::MYSQL_ATTR_INIT_COMMAND => 'SET NAMES utf8'
        ];
        $db = new \Zend\Db\Adapter\Adapter($dbConfig);
        return $db;
    }


    private static function zendDbSlaveCron()
    {
        if (!defined('DB_HOST_SLAVE')) {
            return self::zenddb();
        }
        self::requireConstants(['DIRECTUS_ENV', 'DB_HOST_SLAVE', 'DB_NAME', 'DB_USER_SLAVE_CRON', 'DB_PASSWORD_SLAVE_CRON'], __FUNCTION__);
        $dbConfig = [
            'driver' => 'Pdo_Mysql',
            'host' => DB_HOST_SLAVE,
            'database' => DB_NAME,
            'username' => DB_USER_SLAVE_CRON,
            'password' => DB_PASSWORD_SLAVE_CRON,
            'charset' => 'utf8',
            \PDO::MYSQL_ATTR_USE_BUFFERED_QUERY => true,
            \PDO::MYSQL_ATTR_INIT_COMMAND => 'SET NAMES utf8'
        ];
        $db = new \Zend\Db\Adapter\Adapter($dbConfig);
        return $db;
    }

    /**
     * Construct ZendDb adapter.
     * @param  array $dbConfig
     * @return \Zend\Db\Adapter
     */
    private static function zenddb()
    {
        self::requireConstants(['DIRECTUS_ENV', 'DB_TYPE', 'DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'], __FUNCTION__);
        $dbConfig = [
            'driver' => 'Pdo_' . DB_TYPE,
            'host' => DB_HOST,
            'port' => DB_PORT,
            'database' => DB_NAME,
            'username' => DB_USER,
            'password' => DB_PASSWORD,
            'charset' => 'utf8',
            \PDO::MYSQL_ATTR_USE_BUFFERED_QUERY => true,
            \PDO::MYSQL_ATTR_INIT_COMMAND => 'SET NAMES utf8'
        ];

        try {
            $db = new Connection($dbConfig);
            $db->connect();
        } catch (\Exception $e) {
            echo 'Database connection failed.';
            exit;
        }

        return $db;
    }

    private static function schemaManager()
    {
        return new SchemaManager(static::get('schemaAdapter'));
    }

    private static function schemaAdapter()
    {
        $adapter = self::get('ZendDb');
        $databaseName = $adapter->getPlatform()->getName();

        switch ($databaseName) {
            case 'MySQL':
                return new MySQLSchema($adapter);
            // case 'SQLServer':
            //    return new SQLServerSchema($adapter);
            case 'SQLite':
                return new SQLiteSchema($adapter);
            // case 'PostgreSQL':
            //     return new PostgresSchema($adapter);
        }

        throw new \Exception('Unknown/Unsupported database: ' . $databaseName);
    }

    /**
     * Construct Acl provider
     * @return \Directus\Acl
     */
    private static function acl()
    {
        $acl = new acl();
        $auth = self::get('auth');
        $db = self::get('ZendDb');

        $DirectusTablesTableGateway = new DirectusTablesTableGateway($db, $acl);
        $getTables = function () use ($DirectusTablesTableGateway) {
            return $DirectusTablesTableGateway->select()->toArray();
        };

        // $tableRecords = $DirectusTablesTableGateway->memcache->getOrCache(MemcacheProvider::getKeyDirectusTables(), $getTables, 1800);
        $tableRecords = $getTables();

        $magicOwnerColumnsByTable = [];
        foreach ($tableRecords as $tableRecord) {
            if (!empty($tableRecord['user_create_column'])) {
                $magicOwnerColumnsByTable[$tableRecord['table_name']] = $tableRecord['user_create_column'];
            }
        }
        $acl::$cms_owner_columns_by_table = $magicOwnerColumnsByTable;

        if ($auth->loggedIn()) {
            $currentUser = $auth->getUserInfo();
            $Users = new DirectusUsersTableGateway($db, $acl);
            $cacheFn = function () use ($currentUser, $Users) {
                return $Users->find($currentUser['id']);
            };
            $cacheKey = MemcacheProvider::getKeyDirectusUserFind($currentUser['id']);
            // $currentUser = $Users->memcache->getOrCache($cacheKey, $cacheFn, 10800);
            $currentUser = $cacheFn();
            if ($currentUser) {
                $privilegesTable = new DirectusPrivilegesTableGateway($db, $acl);
                $acl->setGroupPrivileges($privilegesTable->getGroupPrivileges($currentUser['group']));
            }
        }

        return $acl;
    }

    private static function filesystem()
    {
        $config = self::get('config');
        return new Filesystem(FilesystemFactory::createAdapter($config['filesystem']));
    }

    /**
     * Scan for extensions.
     * @return  array
     */
    private static function extensions()
    {
        self::requireConstants('APPLICATION_PATH', __FUNCTION__);
        $extensions = [];
        $extensionsDirectory = APPLICATION_PATH . '/customs/extensions/';

        if (!file_exists($extensionsDirectory)) {
            return $extensions;
        }

        foreach (new \DirectoryIterator($extensionsDirectory) as $file) {
            if ($file->isDot()) {
                continue;
            }
            $extensionName = $file->getFilename();

            // Ignore all extensions prefixed with an underscore
            if ($extensionName[0] == '_') {
                continue;
            }

            if (is_dir($extensionsDirectory . $extensionName)) {
                $extensions[$extensionName] = "extensions/$extensionName/main";
            }
        }
        return $extensions;
    }

    /**
     * Scan for uis.
     * @return  array
     */
    private static function uis()
    {
        self::requireConstants('APPLICATION_PATH', __FUNCTION__);
        $uiBasePath = APPLICATION_PATH . '/customs';
        $uiDirectory = $uiBasePath . '/uis';
        $uis = [];

        if (!file_exists($uiDirectory)) {
            return $uis;
        }

        $filePaths = find_js_files($uiDirectory, true);
        foreach ($filePaths as $path) {
            $uiPath = trim(substr($path, strlen($uiBasePath)), '/');
            $uis[] = substr($uiPath, 0, -3);
        }

        return $uis;
    }


    /**
     * Scan for listviews.
     * @return  array
     */
    private static function listViews()
    {
        self::requireConstants('APPLICATION_PATH', __FUNCTION__);
        $listViews = [];
        $listViewsDirectory = APPLICATION_PATH . '/customs/listviews/';

        if (!file_exists($listViewsDirectory)) {
            return $listViews;
        }

        foreach (new \DirectoryIterator($listViewsDirectory) as $file) {
            if ($file->isDot()) {
                continue;
            }
            $listViewName = $file->getFilename();
            if (is_dir($listViewsDirectory . $listViewName)) {
                $listViews[] = "listviews/$listViewName/ListView";
            }
        }
        return $listViews;
    }

    /**
     * @return \Directus\Language\LanguageManager
     */
    private static function languagesManager()
    {
        $languages = get_locales_filename();

        return new LanguageManager($languages);
    }

    /**
     * @return \Directus\Embed\EmbedManager
     */
    private static function embedManager()
    {
        $embedManager = new EmbedManager();

        $acl = static::get('acl');
        $adapter = static::get('ZendDb');

        // Fetch files settings
        $SettingsTable = new DirectusSettingsTableGateway($adapter, $acl);
        try {
            $settings = $SettingsTable->fetchCollection('files', [
                'thumbnail_size', 'thumbnail_quality', 'thumbnail_crop_enabled'
            ]);
        } catch (\Exception $e) {
            $settings = [];
            $log = static::get('log');
            $log->warn($e);
        }

        $providers = [
            '\Directus\Embed\Provider\VimeoProvider',
            '\Directus\Embed\Provider\YoutubeProvider'
        ];

        $path = implode(DIRECTORY_SEPARATOR, [
            BASE_PATH,
            'customs',
            'embeds',
            '*.php'
        ]);

        foreach (glob($path) as $filename) {
            $providers[] = '\\Directus\\Embed\\Provider\\' . basename($filename, '.php');
        }

        foreach ($providers as $providerClass) {
            $provider = new $providerClass($settings);
            $embedManager->register($provider);
        }

        return $embedManager;
    }

    /**
     * Get Hook Emitter
     *
     * @return Emitter
     */
    private static function hookEmitter()
    {
        $emitter = new Emitter();

        $emitter->addAction('application.error', function ($e) {
            $log = Bootstrap::get('log');
            $log->error($e);
        });

        $emitter->addAction('table.insert.directus_groups', function ($data) {
            $acl = Bootstrap::get('acl');
            $zendDb = Bootstrap::get('zendDb');
            $privilegesTable = new DirectusPrivilegesTableGateway($zendDb, $acl);

            $privilegesTable->insertPrivilege([
                'group_id' => $data['id'],
                'allow_view' => 1,
                'allow_add' => 0,
                'allow_edit' => 1,
                'allow_delete' => 0,
                'allow_alter' => 0,
                'table_name' => 'directus_users',
                'read_field_blacklist' => 'token',
                'write_field_blacklist' => 'group,token'
            ]);
        });

        $emitter->addFilter('table.insert:before', function($payload) {
            $tableName = $payload->tableName;
            $data = $payload->data;
            if ($tableName == 'directus_files') {
                unset($data['data']);
                $data['user'] = AuthProvider::getUserInfo('id');
            }

            $payload->data = $data;
            return $payload;
        });

        // Add file url and thumb url
        $emitter->addFilter('table.select', function($payload) {
            $result = $payload->result;
            $selectState = $payload->selectState;
            if ($selectState['table'] == 'directus_files') {
                    $fileRows = $result->toArray();
                    $files = new \Directus\Files\Files();
                    foreach ($fileRows as &$row) {
                        $config = Bootstrap::get('config');
                        $fileURL = $config['filesystem']['root_url'];
                        $thumbnailURL = $config['filesystem']['root_thumb_url'];
                        $thumbnailFilenameParts = explode('.', $row['name']);
                        $thumbnailExtension = array_pop($thumbnailFilenameParts);

                        $row['url'] = $fileURL . '/' . $row['name'];
                        if (in_array($thumbnailExtension, ['tif', 'tiff', 'psd', 'pdf'])) {
                            $thumbnailExtension = 'jpg';
                        }

                        $thumbnailFilename = $row['id'] . '.' . $thumbnailExtension;
                        $row['thumbnail_url'] = $thumbnailURL . '/' . $thumbnailFilename;

                        // filename-ext-100-100-true.jpg
                        // @TODO: This should be another hook listener
                        $row['thumbnail_url'] = null;
                        $filename = implode('.', $thumbnailFilenameParts);
                        if ($row['type'] == 'embed/vimeo') {
                            $oldThumbnailFilename = $row['name'] . '-vimeo-220-124-true.jpg';
                        } else {
                            $oldThumbnailFilename = $filename . '-' . $thumbnailExtension . '-160-160-true.jpg';
                        }

                        // 314551321-vimeo-220-124-true.jpg
                        // hotfix: there's not thumbnail for this file
                        if ($files->exists('thumbs/' . $oldThumbnailFilename)) {
                            $row['thumbnail_url'] = $thumbnailURL . '/' . $oldThumbnailFilename;
                        }

                        if ($files->exists('thumbs/' . $thumbnailFilename)) {
                            $row['thumbnail_url'] = $thumbnailURL . '/' . $thumbnailFilename;
                        }

                        $embedManager = Bootstrap::get('embedManager');
                        $provider = $embedManager->getByType($row['type']);
                        $row['html'] = null;
                        if ($provider) {
                            $row['html'] = $provider->getCode($row);
                        }
                    }

                    $filesArrayObject = new \ArrayObject($fileRows);
                    $result->initialize($filesArrayObject->getIterator());
                }

            return $payload;
        });

        return $emitter;
    }

    private static function session()
    {
        return new Session(new NativeSessionStorage());
    }

    private static function auth()
    {
        $zendDb = self::get('zendDb');
        $session = self::get('session');
        $config = self::get('config');
        $prefix = ArrayUtils::get($config, 'session.prefix', 'directus_');

        return new AuthProvider($zendDb, $session, $prefix);
    }
}
