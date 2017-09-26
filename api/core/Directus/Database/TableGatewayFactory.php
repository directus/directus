<?php

/**
 * Directus – <http://getdirectus.com>
 *
 * @link      The canonical repository – <https://github.com/directus/directus>
 * @copyright Copyright 2006-2017 RANGER Studio, LLC – <http://rangerstudio.com>
 * @license   GNU General Public License (v3) – <http://www.gnu.org/copyleft/gpl.html>
 */

namespace Directus\Database;

use Directus\Bootstrap;
use Directus\Container\Container;
use Directus\Database\TableGateway\BaseTableGateway;
use Directus\Database\TableGateway\RelationalTableGateway;
use Directus\Util\ArrayUtils;
use Directus\Util\Formatting;

/**
 * TableGateway factory
 *
 * @author Welling Guzmán <welling@rngr.org>
 */
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
        $adapter = ArrayUtils::get($options, 'adapter');

        if (static::$container) {
            if ($acl === null) {
                $acl = static::$container->get('acl');
            }

            if ($adapter === null) {
                $adapter = static::$container->get('zendDb');
            }
        }

        if (class_exists($tableGatewayClassName)) {
            $instance = new $tableGatewayClassName($adapter, $acl);
        } else {
            $instance = new RelationalTableGateway($tableName, $adapter, $acl);
        }

        return $instance;
    }
}
