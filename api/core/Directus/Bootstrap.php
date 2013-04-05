<?php

namespace Directus;

use Directus\Acl as AclProvider;
use Directus\Auth\Provider as AuthProvider;
use Slim\Slim;
use Slim\Extras\Log\DateTimeFileWriter;

/**
 * NOTE: This class depends on the constants defined in config.php
 */
class Bootstrap {

	public static $singletons = array();

	public static function get($key, $args = array()) {
		$key = strtolower($key);
		if(!array_key_exists($key, self::$singletons))
			self::$singletons[$key] = self::{$key}($args);
		return self::$singletons[$key];
	}

	public static function extensionExists($extensionName) {
		$extensions = self::getExtensions();
		return array_key_exists($extensionName, $extensions);
	}

	private static function requireConstants($constants, $dependentFunctionName) {
		if(!is_array($constants))
			$constants = array($constants);
		foreach($constants as $constant) {
			if(!defined($constant))
				throw new \Exception("Directus\Bootstrap#$dependentFunctionName depends on undefined constant $constant");
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

	/**
	 * Construct ZendDb adapter.
	 * @param  array  $dbConfig
	 * @return \Zend\Db\Adapter
	 */
	private static function zenddb(array $dbConfig) {
		self::requireConstants('DIRECTUS_ENV', __FUNCTION__);
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

	private static function aclprovider() {
		$aclProvider = new AclProvider;
		if(AuthProvider::loggedIn()) {
		    $currentUser = AuthProvider::getUserInfo();
		    $ZendDb = self::get('ZendDb');
		    $Users = new Db\Users($aclProvider, $ZendDb);
		    $currentUser = $Users->find($currentUser['id']);
		    if($currentUser) {
		        $Privileges = new Db\Privileges($aclProvider, $ZendDb);
		        $groupPrivileges = $Privileges->fetchGroupPrivileges($currentUser['id']);
		        $aclProvider->setGroupPrivileges($groupPrivileges);
		    }
		}
		return $aclProvider;
	}

}