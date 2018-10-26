<?php

namespace Directus\Database;

use Zend\Db\Adapter\Adapter;

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

    /**
     * Execute an query string
     *
     * @param $sql
     *
     * @return \Zend\Db\Adapter\Driver\StatementInterface|\Zend\Db\ResultSet\ResultSet
     */
    public function execute($sql)
    {
        return $this->query($sql, static::QUERY_MODE_EXECUTE);
    }
}
