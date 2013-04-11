<?php

namespace Directus;

use Directus\Acl\Acl as AclProvider;
use Directus\Auth\Provider as AuthProvider;
use Directus\Db\TableGateway\DirectusUsersGateway;
use Directus\Db\TableGateway\DirectusPrivilegesGateway;
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
     * @return mixed           The singleton with the specified name
     */
    public static function get($key, $arg = null) {
        $key = strtolower($key);
        if(!method_exists(__CLASS__, $key))
            throw new \InvalidArgumentException("No such factory function on " . __CLASS__ . ": $key");
        if(!array_key_exists($key, self::$singletons))
            self::$singletons[$key] = call_user_func(__CLASS__."::$key", $arg);
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
        if(!is_array($constants))
            $constants = array($constants);
        foreach($constants as $constant) {
            if(!defined($constant))
                throw new \Exception(__CLASS__ . "#$dependentFunctionName depends on undefined constant $constant");
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
        self::requireConstants('DIRECTUS_ENV', __FUNCTION__);
        $app = new Slim(array(
            'mode'    => DIRECTUS_ENV,
            'log.writer' => new DateTimeFileWriter()
        ));
        $app->configureMode('production', function () use ($app) {
            $app->config(array(
                'log.enable' => true,
                'debug' => false
            ));
        });
        $app->configureMode('development', function () use ($app) {
            $app->config(array(
                'log.enable' => false,
                'debug' => true
            ));
        });
        return $app;
    }

    /**
     * Construct ZendDb adapter.
     * @param  array  $dbConfig
     * @return \Zend\Db\Adapter
     */
    private static function zenddb() {
        self::requireConstants(array('DIRECTUS_ENV','DB_HOST','DB_NAME','DB_USER','DB_PASSWORD'), __FUNCTION__);
        $dbConfig = array(
            'driver'    => 'Pdo_Mysql',
            'host'      => DB_HOST,
            'database'  => DB_NAME,
            'username'  => DB_USER,
            'password'  => DB_PASSWORD,
            'charset'   => 'utf8'
        );
        $ZendDb = new \Zend\Db\Adapter\Adapter($dbConfig);
        $connection = $ZendDb->getDriver()->getConnection();
        try { $connection->connect(); }
        catch(\PDOException $e) {
            echo "Database connection failed.<br />";
             $app = self::get('app');
            $app->getLog()->fatal(print_r($e, true));
            if('production' !== DIRECTUS_ENV)
                die(var_dump($e));
            die;
        }
        $dbh = $connection->getResource();
        $dbh->exec("SET CHARACTER SET utf8");
        $dbh->query("SET NAMES utf8");
        return $ZendDb;
    }

    /**
     * Construct old DB object
     * @return \DB
     */
    private static function olddb() {
        self::requireConstants('DB_NAME', __FUNCTION__);
        $ZendDb = self::get('ZendDb');
        $connection = $ZendDb->getDriver()->getConnection();
        $dbh = $connection->getResource();
        $db = new \DB($dbh, DB_NAME, $ZendDb);
        return $db;
    }

    /**
     * Construct Acl provider
     * @return \Directus\Acl
     */
    private static function aclprovider() {
        $aclProvider = new AclProvider;
        if(AuthProvider::loggedIn()) {
            $currentUser = AuthProvider::getUserInfo();
            $ZendDb = self::get('ZendDb');
            $Users = new DirectusUsersGateway($aclProvider, $ZendDb);
            $currentUser = $Users->find($currentUser['id']);
            if($currentUser) {
                $Privileges = new DirectusPrivilegesGateway($aclProvider, $ZendDb);
                $groupPrivileges = $Privileges->fetchGroupPrivileges($currentUser['group']);
                $aclProvider->setGroupPrivileges($groupPrivileges);
            }
        }
        return $aclProvider;
    }

    /**
     * Scan for extensions.
     * @return  array
     */
    private static function extensions() {
        self::requireConstants('APPLICATION_PATH', __FUNCTION__);
        $extensions = array();
        $extensionsDirectory = APPLICATION_PATH . '/extensions/';
        foreach (new \DirectoryIterator($extensionsDirectory) as $file) {
            if($file->isDot())
                continue;
            $extensionName = $file->getFilename();
            if(is_dir($extensionsDirectory . $extensionName))
                $extensions[$extensionName] = "extensions/$extensionName/main";
        }
        return $extensions;
    }

    /**
     * Scan for uis.
     * @return  array
     */
    private static function uis() {
        self::requireConstants('APPLICATION_PATH', __FUNCTION__);
        $uis = array();
        $uiDirectory = APPLICATION_PATH . '/ui';
        foreach (new \DirectoryIterator($uiDirectory) as $file) {
            if($file->isDot())
                continue;
            $info = pathinfo($file->getFilename());
            if(array_key_exists('extension', $info) && $info['extension'] != 'js')
                continue;
            $uiFilename = $file->getFilename();
            $uis[$uiFilename] = 'ui/' . basename($uiFilename,'.js');
        }
        return $uis;
    }

}