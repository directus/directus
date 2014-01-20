<?php

namespace Directus\Db;

use Directus\Bootstrap;

class Hooks {

    protected static function getHook($hookName) {
        $config = Bootstrap::get('config');
        if(isset($config['dbHooks']) && isset($config['dbHooks'][$hookName])) {
            return $config['dbHooks'][$hookName];
        }
        return false;
    }

    public static function runHook($hookName, $arguments) {
        $hook = self::getHook($hookName);
        if($hook) {
            return call_user_func_array($hook, $arguments);
        }
    }

}