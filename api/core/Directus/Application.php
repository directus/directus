<?php

namespace Directus;

class Application {

	/**
	 * Slim application instance
	 * @var \Slim\Slim
	 */
	public static $app = null;

	/**
	 * Extension paths
	 * @var array
	 */
	public static $extensions = null;

	/**
	 * UI paths
	 * @var array
	 */
	public static $uis = null;

	/**
	 * @return \Slim\Slim
	 */
	public static function getApp() {
		if(is_null(self::$app))
			throw new Exception("Attempting to get \$app object from container before assigning it.");
		return self::$app;
	}

	/**
	 * @param \Slim\Slim $app
	 */
	public static function setApp($app) {
		self::$app = $app;
	}

	/**
	 * Scan for extensions.
	 * @return [type] [description]
	 */
	public static function getExtensions() {
		if(is_null(self::$extensions)) {
			self::$extensions = array();
			$extensionsDirectory = APPLICATION_PATH . '/extensions/';
			foreach (new \DirectoryIterator($extensionsDirectory) as $file) {
				if($file->isDot())
					continue;
				$extensionName = $file->getFilename();
				if(is_dir($extensionsDirectory . $extensionName))
					self::$extensions[$extensionName] = "extensions/$extensionName/main";
			}
		}
		return self::$extensions;
	}

	/**
	 * Scan for uis.
	 * @return [type] [description]
	 */
	public static function getUis() {
		if(is_null(self::$uis)) {
			self::$uis = array();
			$uiDirectory = APPLICATION_PATH . '/ui';
			foreach (new \DirectoryIterator($uiDirectory) as $file) {
				if($file->isDot())
					continue;
				$info = pathinfo($file->getFilename());
				if(array_key_exists('extension', $info) && $info['extension'] != 'js')
					continue;
				$uiFilename = $file->getFilename();
				self::$uis[$uiFilename] = 'ui/' . basename($uiFilename,'.js');
			}
		}
		return self::$uis;
	}

	public static function extensionExists($extensionName) {
		$extensions = self::getExtensions();
		return array_key_exists($extensionName, $extensions);
	}

}