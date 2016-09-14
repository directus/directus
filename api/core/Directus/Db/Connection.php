<?php

/**
 * Directus – <http://getdirectus.com>
 *
 * @link      The canonical repository – <https://github.com/directus/directus>
 * @copyright Copyright 2006-2016 RANGER Studio, LLC – <http://rangerstudio.com>
 * @license   GNU General Public License (v3) – <http://www.gnu.org/copyleft/gpl.html>
 */

namespace Directus\Db;

use Zend\Db\Adapter\Adapter;

/**
 * Connection Adapter
 *
 * @author Welling Guzmán <welling@rngr.org>
 */
class Connection extends Adapter
{
    /**
     * Database configuration
     *
     * @var array
     */
    protected $config = [];

    /**
     * Check if this connection has strict mode enabled.
     *
     * @return bool
     *
     * @throws \BadMethodCallException
     */
    public function isStrictModeEnabled()
    {
        $enabled = false;
        $driverName = $this->getDriver()->getDatabasePlatformName();

        switch (strtolower($driverName)) {
            case 'mysql':
                $enabled = $this->isMySQLStrictModeEnabled();
                break;
        }

        return $enabled;
    }

    /**
     * Check if MySQL has Strict mode enabled
     *
     * @return bool
     */
    protected function isMySQLStrictModeEnabled()
    {
        $strictModes = ['STRICT_ALL_TABLES', 'STRICT_TRANS_TABLES'];
        $statement = $this->query('SELECT @@sql_mode as modes');
        $result = $statement->execute();
        $modesEnabled = $result->current();

        $modes = explode(',', $modesEnabled['modes']);
        foreach ($modes as $name) {
            $modeName = strtoupper(trim($name));
            if (in_array($modeName, $strictModes)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Connect to the database
     *
     * @return \Zend\Db\Adapter\Driver\ConnectionInterface
     */
    public function connect()
    {
        return call_user_func_array([$this->getDriver()->getConnection(), 'connect'], func_get_args());
    }
}
