<?php

namespace Directus;

use Directus\Acl\Acl;
use Directus\Auth\Provider as AuthProvider;
use Directus\Filesystem\Filesystem;
use Directus\Filesystem\FilesystemFactory;
use Directus\Db\TableGateway\DirectusUsersTableGateway;
use Directus\Db\TableGateway\DirectusPrivilegesTableGateway;
use Directus\Db\TableGateway\DirectusSettingsTableGateway;
use Directus\Db\TableGateway\DirectusTablesTableGateway;
use Slim\Slim;
use Slim\Extras\Log\DateTimeFileWriter;

/**
 * NOTE: This class depends on the constants defined in config.php
 */
class Bootstrap {

    public static $singletons = array();

    /**
     * Returns the instance of the specified singleton, instantiating one if it
     * doesn't yet exist.
     * @param  string $key  The name of the singleton / singleton factory function
     * @param  mixed  $arg An argument to be passed to the singleton factory function
     * @param  bool $newInsnce return new instance rather than singleton instance (useful for long running scripts to get a new Db Conn)
     * @return mixed           The singleton with the specified name
     */
    public static function get($key, $arg = null, $newInstance = false) {
        $key = strtolower($key);
        if(!method_exists(__CLASS__, $key)) {
            throw new \InvalidArgumentException("No such factory function on " . __CLASS__ . ": $key");
        }
        if ($newInstance){
            return call_user_func(__CLASS__."::$key", $arg);
        }
        if(!array_key_exists($key, self::$singletons)) {
            self::$singletons[$key] = call_user_func(__CLASS__."::$key", $arg);
        }
        return self::$singletons[$key];
    }

    /**
     * Does an extension by the given name exist?
     * @param  string $extensionName
     * @return bool
     */
    public static function extensionExists($extensionName) {
        $extensions = self::get('extensions');
        return array_key_exists($extensionName, $extensions);
    }

    /**
     * Used to interrupt the bootstrapping of a singleton if the constants it
     * requires aren't defined.
     * @param  string|array $constants       One or more constant names
     * @param  string $dependentFunctionName The name of the function establishing the dependency.
     * @return  null
     * @throws  Exception If the specified constants are not defined
     */
    private static function requireConstants($constants, $dependentFunctionName) {
        if(!is_array($constants)) {
            $constants = array($constants);
        }
        foreach($constants as $constant) {
            if(!defined($constant)) {
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
    private static function app() {
        self::requireConstants(array('DIRECTUS_ENV','APPLICATION_PATH'), __FUNCTION__);
        $loggerSettings = array(
            'path' => APPLICATION_PATH . '/api/logs'
        );
        $app = new Slim(array(
            'templates.path'=> APPLICATION_PATH.'/api/views/',
            'mode'          => DIRECTUS_ENV,
            'debug'         => false,
            'log.enable'    => true,
            'log.writer'    => new DateTimeFileWriter($loggerSettings)
        ));
        return $app;
    }

    private static function config() {
        self::requireConstants('BASE_PATH', __FUNCTION__);
        $config = require APPLICATION_PATH . "/api/configuration.php";
        return $config;
    }

    private static function status() {
      $config = self::get('config');
      $status = $config['statusMapping'];
      return $status;
    }

    private static function mailer() {
        $config = self::get('config');
        if (!array_key_exists('mail', $config)) {
            return null;
        }

        $mailConfig = $config['mail'];
        // $smtp = $config['SMTP'];
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
        // $transport = \Swift_SmtpTransport::newInstance($smtp['host'], $smtp['port'])
        //     ->setUsername($smtp['username'])
        //     ->setPassword($smtp['password']);
        $mailer = \Swift_Mailer::newInstance($transport);
        return $mailer;
    }

    /**
     * Yield Slim logger
     * @return \Slim\Extras\Log\DateTimeFileWriter
     */
    private static function log() {
        return self::get('app')->getLog();
    }

    private static function zendDbSlave(){
        if (!defined('DB_HOST_SLAVE')){
            return self::zenddb();
        }
        self::requireConstants(array('DIRECTUS_ENV','DB_HOST_SLAVE','DB_NAME','DB_USER_SLAVE','DB_PASSWORD_SLAVE'), __FUNCTION__);
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


    private static function zendDbSlaveCron(){
        if (!defined('DB_HOST_SLAVE')){
            return self::zenddb();
        }
        self::requireConstants(array('DIRECTUS_ENV','DB_HOST_SLAVE','DB_NAME','DB_USER_SLAVE_CRON','DB_PASSWORD_SLAVE_CRON'), __FUNCTION__);
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
     * @param  array  $dbConfig
     * @return \Zend\Db\Adapter
     */
    private static function zenddb() {
        self::requireConstants(array('DIRECTUS_ENV','DB_HOST','DB_NAME','DB_USER','DB_PASSWORD'), __FUNCTION__);
        $dbConfig = array(
            'driver' => 'Pdo_Mysql',
            'host' => DB_HOST,
            'database' => DB_NAME,
            'username' => DB_USER,
            'password' => DB_PASSWORD,
            'charset' => 'utf8',
            \PDO::MYSQL_ATTR_USE_BUFFERED_QUERY => true,
            \PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8"
        );

        try {
            $db = new \Zend\Db\Adapter\Adapter($dbConfig);
            $db->getDriver()->getConnection()->connect();
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

    /**
     * Construct Acl provider
     * @return \Directus\Acl
     */
    private static function acl() {
        $acl = new acl;
        $db = self::get('ZendDb');

        $DirectusTablesTableGateway = new DirectusTablesTableGateway($acl, $db);
        $getTables = function() use ($DirectusTablesTableGateway) {
            return $DirectusTablesTableGateway->select()->toArray();
        };

        $tableRecords = $DirectusTablesTableGateway->memcache->getOrCache(MemcacheProvider::getKeyDirectusTables(), $getTables, 1800);

        $magicOwnerColumnsByTable = array();
        foreach($tableRecords as $tableRecord) {
            if(!empty($tableRecord['user_create_column'])) {
                $magicOwnerColumnsByTable[$tableRecord['table_name']] = $tableRecord['user_create_column'];
            }
        }
        $acl::$cms_owner_columns_by_table = $magicOwnerColumnsByTable;

        if(AuthProvider::loggedIn()) {
            $currentUser = AuthProvider::getUserInfo();
            $Users = new DirectusUsersTableGateway($acl, $db);
            $cacheFn = function () use ($currentUser, $Users) {
                return $Users->find($currentUser['id']);
            };
            $cacheKey = MemcacheProvider::getKeyDirectusUserFind($currentUser['id']);
            $currentUser = $Users->memcache->getOrCache($cacheKey, $cacheFn, 10800);
            if($currentUser) {
                $Privileges = new DirectusPrivilegesTableGateway($acl, $db);
                $getPrivileges = function() use ($currentUser, $Privileges) {
                    return (array) $Privileges->fetchGroupPrivileges($currentUser['group']);
                };
                $groupPrivileges = $Privileges->memcache->getOrCache(MemcacheProvider::getKeyDirectusGroupPrivileges($currentUser['group']), $getPrivileges, 1800);
                $acl->setGroupPrivileges($groupPrivileges);
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
    private static function extensions() {
        self::requireConstants('APPLICATION_PATH', __FUNCTION__);
        $extensions = array();
        $extensionsDirectory = APPLICATION_PATH . '/extensions/';
        foreach (new \DirectoryIterator($extensionsDirectory) as $file) {
            if($file->isDot()) {
                continue;
            }
            $extensionName = $file->getFilename();

            // Ignore all extensions prefixed with an underscore
            if($extensionName[0] == "_"){
                continue;
            }

            if(is_dir($extensionsDirectory . $extensionName)) {
                $extensions[$extensionName] = "extensions/$extensionName/main";
            }
        }
        return $extensions;
    }

    /**
     * Scan for uis.
     * @return  array
     */
    private static function uis() {
        self::requireConstants('APPLICATION_PATH', __FUNCTION__);
        $uiDirectory = APPLICATION_PATH . '/ui';
        $uis = array();
        $objects = new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($uiDirectory), \RecursiveIteratorIterator::SELF_FIRST);
        foreach($objects as $name => $object){
            if("js" == pathinfo($name, PATHINFO_EXTENSION)) {
                $uiPath = substr($name, strlen(APPLICATION_PATH) + 1);
                $uiName = basename($name);
                $uis[$uiName] = substr($uiPath, 0, -3);
            }
        }
        return $uis;
    }


    /**
     * Scan for listviews.
     * @return  array
     */
    private static function listViews() {
        self::requireConstants('APPLICATION_PATH', __FUNCTION__);
        $listViews = array();
        $listViewsDirectory = APPLICATION_PATH . '/listviews/';
        foreach (new \DirectoryIterator($listViewsDirectory) as $file) {
            if($file->isDot()) {
                continue;
            }
            $listViewName = $file->getFilename();
            if(is_dir($listViewsDirectory . $listViewName)) {
                $listViews[] = "listviews/$listViewName/ListView";
            }
        }
        return $listViews;
    }



}
