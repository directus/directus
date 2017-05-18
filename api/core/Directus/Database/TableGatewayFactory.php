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
     * Create a new table gateway
     *
     * e.g. directus_users => \Directus\Db\TableGateway\DirectusUsersTableGateway
     *
     * @param $tableName
     * @param array $options
     *
     * @return BaseTableGateway
     */
    public static function create($tableName, $options = [])
    {
        $tableGatewayClassName = Formatting::underscoreToCamelCase($tableName) . 'TableGateway';
        $namespace = __NAMESPACE__ . '\\TableGateway\\';
        $tableGatewayClassName = $namespace . $tableGatewayClassName;

        $acl = ArrayUtils::get($options, 'acl', Bootstrap::get('acl'));
        $adapter = ArrayUtils::get($options, 'adapter', Bootstrap::get('zendDb'));

        if (class_exists($tableGatewayClassName)) {
            $instance = new $tableGatewayClassName($adapter, $acl);
        } else {
            $instance = new RelationalTableGateway($tableName, $adapter, $acl);
        }

        return $instance;
    }
}
