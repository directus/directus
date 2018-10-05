<?php

namespace Directus\Database;

use Directus\Database\TableGateway\RelationalTableGateway;
use Directus\Util\ArrayUtils;
use Directus\Util\Formatting;

class TableGatewayFactory
{
    /**
     * @var object
     */
    protected static $container = null;

    public static function setContainer($container)
    {
        static::$container = $container;
    }

    /**
     * Create a new table gateway
     *
     * e.g. directus_users => \Directus\Database\TableGateway\DirectusUsersTableGateway
     *
     * @param $tableName
     * @param array $options
     *
     * @return mixed
     */
    public static function create($tableName, $options = [])
    {
        $tableGatewayClassName = Formatting::underscoreToCamelCase($tableName) . 'TableGateway';
        $namespace = __NAMESPACE__ . '\\TableGateway\\';
        $tableGatewayClassName = $namespace . $tableGatewayClassName;

        $acl = ArrayUtils::get($options, 'acl');
        $dbConnection = ArrayUtils::get($options, 'connection');

        if (static::$container) {
            if ($acl === null) {
                $acl = static::$container->get('acl');
            }

            if ($dbConnection === null) {
                // TODO: Replace "database" for "connection"
                $dbConnection = static::$container->get('database');
            }
        }

        if (!$acl) {
            $acl = null;
        }

        if (class_exists($tableGatewayClassName)) {
            $instance = new $tableGatewayClassName($dbConnection, $acl);
        } else {
            $instance = new RelationalTableGateway($tableName, $dbConnection, $acl);
        }

        return $instance;
    }
}
