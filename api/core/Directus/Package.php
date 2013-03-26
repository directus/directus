<?php

namespace Directus;

/**
 * @todo  we can improve load time by caching these scan results
 */
class Package {

	public static $extensions;
	public static $uis;

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

}