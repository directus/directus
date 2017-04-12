<?php

/**
 * Directus – <http://getdirectus.com>
 *
 * @link      The canonical repository – <https://github.com/directus/directus>
 * @copyright Copyright 2006-2017 RANGER Studio, LLC – <http://rangerstudio.com>
 * @license   GNU General Public License (v3) – <http://www.gnu.org/copyleft/gpl.html>
 */

namespace Directus\Db;

use Directus\Bootstrap;
use Directus\Util\ArrayUtils;
use Directus\Util\Formatting;

/**
 * TableGateway factory
 *
 * @author Welling Guzmán <welling@rngr.org>
 */
class FactoryTableGateway
{
    const BASE = 0;
    const ACL_AWARE = 1;
    const RELATIONAL = 2;

    /**
     * Create a new table gateway
     *
     * e.g. directus_users => \Directus\Db\TableGateway\DirectusUsersTableGateway
     *
     * @param $tableName
     * @param array $options
     * @param int $type
     *
     * @return BaseTableGateway
     */
    public static function create($tableName, $options = [], $type = self::RELATIONAL)
    {
        $tableGatewayClassName = Formatting::underscoreToCamelCase($tableName) . 'TableGateway';
        $namespace = __NAMESPACE__ . '\\TableGateway\\';
        $tableGatewayClassName = $namespace . $tableGatewayClassName;

        $acl = ArrayUtils::get($options, 'acl', Bootstrap::get('acl'));
        $adapter = ArrayUtils::get($options, 'adapter', Bootstrap::get('zendDb'));

        if (class_exists($tableGatewayClassName)) {
            $instance = new $tableGatewayClassName($acl, $adapter);
        } else {
            $classPrefix = 'Base';
            switch ($type) {
                case static::RELATIONAL:
                    $classPrefix = 'Relational';
                    break;
                case static::ACL_AWARE:
                    $classPrefix = 'AclAware';
            }

            $args = [
                $tableName,
                $adapter
            ];

            if ($type !== static::BASE) {
                array_unshift($args, $acl);
            }

            $reflector = new \ReflectionClass($namespace . $classPrefix . 'TableGateway');
            $instance = $reflector->newInstanceArgs($args);
        }

        return $instance;
    }
}
