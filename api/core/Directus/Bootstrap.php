<?php

namespace Directus;

use Directus\Acl\Acl;
use Directus\Auth\Provider as AuthProvider;
use Directus\Db\Connection;
use Directus\Db\Schemas\MySQLSchema;
use Directus\Db\Schemas\SQLiteSchema;
use Directus\Db\TableGateway\DirectusPrivilegesTableGateway;
use Directus\Db\TableGateway\DirectusSettingsTableGateway;
use Directus\Db\TableGateway\DirectusTablesTableGateway;
use Directus\Db\TableGateway\DirectusUsersTableGateway;
use Directus\Embed\EmbedManager;
use Directus\Filesystem\Filesystem;
use Directus\Filesystem\FilesystemFactory;
use Directus\Hook\Emitter;
use Directus\Language\LanguageManager;
use Directus\View\Twig\DirectusTwigExtension;
use Slim\Extras\Log\DateTimeFileWriter;
use Slim\Extras\Views\Twig;
use Slim\Slim;

/**
 * NOTE: This class depends on the constants defined in config.php
 */
class Bootstrap
{

    public static $singletons = array();

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
            throw new \InvalidArgumentException("No such factory function on " . __CLASS__ . ": $key");
        }
        if ($newInstance) {
            return call_user_func(__CLASS__ . "::$key", $arg);
        }
        if (!array_key_exists($key, self::$singletons)) {
            self::$singletons[$key] = call_user_func(__CLASS__ . "::$key", $arg);
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
            $constants = array($constants);
        }
        foreach ($constants as $constant) {
            if (!defined($constant)) {
                throw new \Exception(__CLASS__ . "#$dependentFunctionName depends on undefined constant $constant");
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

        $app = new Slim([
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

        return $app;
    }

    private static function config()
    {
        self::requireConstants('BASE_PATH', __FUNCTION__);
        $config = require APPLICATION_PATH . "/api/configuration.php";
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
        self::requireConstants(array('DIRECTUS_ENV', 'DB_HOST_SLAVE', 'DB_NAME', 'DB_USER_SLAVE', 'DB_PASSWORD_SLAVE'), __FUNCTION__);
        $dbConfig = array(
            'driver' => 'Pdo_Mysql',
            'host' => DB_HOST_SLAVE,
            'database' => DB_NAME,
            'username' => DB_USER_SLAVE,
            'password' => DB_PASSWORD_SLAVE,
            'charset' => 'utf8',
            \PDO::MYSQL_ATTR_USE_BUFFERED_QUERY => true,
            \PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8"
        );
        $db = new \Zend\Db\Adapter\Adapter($dbConfig);
        return $db;
    }


    private static function zendDbSlaveCron()
    {
        if (!defined('DB_HOST_SLAVE')) {
            return self::zenddb();
        }
        self::requireConstants(array('DIRECTUS_ENV', 'DB_HOST_SLAVE', 'DB_NAME', 'DB_USER_SLAVE_CRON', 'DB_PASSWORD_SLAVE_CRON'), __FUNCTION__);
        $dbConfig = array(
            'driver' => 'Pdo_Mysql',
            'host' => DB_HOST_SLAVE,
            'database' => DB_NAME,
            'username' => DB_USER_SLAVE_CRON,
            'password' => DB_PASSWORD_SLAVE_CRON,
            'charset' => 'utf8',
            \PDO::MYSQL_ATTR_USE_BUFFERED_QUERY => true,
            \PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8"
        );
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
        self::requireConstants(array('DIRECTUS_ENV', 'DB_TYPE', 'DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'), __FUNCTION__);
        $dbConfig = array(
            'driver' => 'Pdo_' . DB_TYPE,
            'host' => DB_HOST,
            'port' => DB_PORT,
            'database' => DB_NAME,
            'username' => DB_USER,
            'password' => DB_PASSWORD,
            'charset' => 'utf8',
            \PDO::MYSQL_ATTR_USE_BUFFERED_QUERY => true,
            \PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8"
        );

        try {
            $db = new Connection($dbConfig);
            $db->connect();
        } catch (\Exception $e) {
            echo 'Database connection failed.';
            exit;
        }

        return $db;
        //        $dbConfig = array(
        //            'driver'    => 'Pdo_Mysql',
        //            'host'      => DB_HOST,
        //            'database'  => DB_NAME,
        //            'username'  => DB_USER,
        //            'password'  => DB_PASSWORD,
        //            'charset'   => 'utf8',
        ////            'options' => array(
        ////                \PDO::MYSQL_ATTR_USE_BUFFERED_QUERY => true
        ////            ),
        ////            'driver_options' => array(
        ////                \PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8; SET CHARACTER SET utf8;",
        //////                \PDO::MYSQL_ATTR_USE_BUFFERED_QUERY => true
        ////            )
        //        );
        //        $db = new \Zend\Db\Adapter\Adapter($dbConfig);
        //        $connection = $db->getDriver()->getConnection();
        //        try { $connection->connect(); }
        //        catch(\PDOException $e) {
        //            echo "Database connection failed.<br />";
        //            self::get('log')->fatal(print_r($e, true));
        //            if('production' !== DIRECTUS_ENV) {
        //                die(var_dump($e));
        //            }
        //            die;
        //        }
        //        $dbh = $connection->getResource();
        //        $dbh->exec("SET CHARACTER SET utf8");
        //        $dbh->query("SET NAMES utf8");
        ////        $pdo = $db->getDriver()->getConnection()->getResource();
        ////        $pdo->setAttribute(\PDO::MYSQL_ATTR_USE_BUFFERED_QUERY, true);
        //        return $db;
    }

    private static function schema()
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
        $acl = new acl;
        $db = self::get('ZendDb');

        $DirectusTablesTableGateway = new DirectusTablesTableGateway($acl, $db);
        $getTables = function () use ($DirectusTablesTableGateway) {
            return $DirectusTablesTableGateway->select()->toArray();
        };

        $tableRecords = $DirectusTablesTableGateway->memcache->getOrCache(MemcacheProvider::getKeyDirectusTables(), $getTables, 1800);

        $magicOwnerColumnsByTable = array();
        foreach ($tableRecords as $tableRecord) {
            if (!empty($tableRecord['user_create_column'])) {
                $magicOwnerColumnsByTable[$tableRecord['table_name']] = $tableRecord['user_create_column'];
            }
        }
        $acl::$cms_owner_columns_by_table = $magicOwnerColumnsByTable;

        if (AuthProvider::loggedIn()) {
            $currentUser = AuthProvider::getUserInfo();
            $Users = new DirectusUsersTableGateway($acl, $db);
            $cacheFn = function () use ($currentUser, $Users) {
                return $Users->find($currentUser['id']);
            };
            $cacheKey = MemcacheProvider::getKeyDirectusUserFind($currentUser['id']);
            $currentUser = $Users->memcache->getOrCache($cacheKey, $cacheFn, 10800);
            if ($currentUser) {
                $privilegesTable = new DirectusPrivilegesTableGateway($acl, $db);
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
     * Construct CodeBird Twitter API Client
     * @return \Codebird\Codebird
     */
    // private static function codebird() {
    //     $acl = self::get('acl');
    //     $db = self::get('ZendDb');
    //     // Social settings
    //     $SettingsTableGateway = new DirectusSettingsTableGateway($acl, $db);
    //     $requiredKeys = array('twitter_consumer_key','twitter_consumer_secret', 'twitter_oauth_token', 'twitter_oauth_token_secret');
    //     $socialSettings = $SettingsTableGateway->fetchCollection('social', $requiredKeys);
    //     // Codebird initialization
    //     \Codebird\Codebird::setConsumerKey($socialSettings['twitter_consumer_key'], $socialSettings['twitter_consumer_secret']);
    //     $cb = \Codebird\Codebird::getInstance();
    //     $cb->setToken($socialSettings['twitter_oauth_token'], $socialSettings['twitter_oauth_token_secret']);
    //     return $cb;
    // }

    /**
     * Scan for extensions.
     * @return  array
     */
    private static function extensions()
    {
        self::requireConstants('APPLICATION_PATH', __FUNCTION__);
        $extensions = array();
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
            if ($extensionName[0] == "_") {
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
        $uiDirectory = APPLICATION_PATH . '/customs/uis';
        $uis = array();

        if (!file_exists($uiDirectory)) {
            return $uis;
        }

        $filePaths = find_js_files($uiDirectory, true);
        foreach ($filePaths as $path) {
            $uiPath = trim(substr($path, strlen(APPLICATION_PATH)), '/');
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
        $listViews = array();
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
        $SettingsTable = new DirectusSettingsTableGateway($acl, $adapter);
        try {
            $settings = $SettingsTable->fetchCollection('files', array(
                'thumbnail_size', 'thumbnail_quality', 'thumbnail_crop_enabled'
            ));
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
            $privilegesTable = new DirectusPrivilegesTableGateway($acl, $zendDb);

            $privilegesTable->insertPrivilege([
                'group_id' => $data['id'],
                'table_name' => 'directus_users',
                'read_field_blacklist' => 'token',
                'write_field_blacklist' => 'token'
            ]);
        });

        return $emitter;
    }
}
