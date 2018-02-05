<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace Zend\Db\Adapter\Platform;

use Zend\Db\Adapter\Driver\DriverInterface;
use Zend\Db\Adapter\Driver\Pdo;
use Zend\Db\Adapter\Driver\Pgsql;
use Zend\Db\Adapter\Exception;

class Postgresql extends AbstractPlatform
{
    /**
     * Overrides value from AbstractPlatform to use proper escaping for Postgres
     *
     * @var string
     */
    protected $quoteIdentifierTo = '""';

    /**
     * @var resource|\PDO
     */
    protected $resource = null;

    /**
     * @param null|\Zend\Db\Adapter\Driver\Pgsql\Pgsql|\Zend\Db\Adapter\Driver\Pdo\Pdo|resource|\PDO $driver
     */
    public function __construct($driver = null)
    {
        if ($driver) {
            $this->setDriver($driver);
        }
    }

    /**
     * @param \Zend\Db\Adapter\Driver\Pgsql\Pgsql|\Zend\Db\Adapter\Driver\Pdo\Pdo|resource|\PDO $driver
     * @return self Provides a fluent interface
     * @throws \Zend\Db\Adapter\Exception\InvalidArgumentException
     */
    public function setDriver($driver)
    {
        if ($driver instanceof Pgsql\Pgsql
            || ($driver instanceof Pdo\Pdo && $driver->getDatabasePlatformName() == 'Postgresql')
            || (is_resource($driver) && (in_array(get_resource_type($driver), ['pgsql link', 'pgsql link persistent'])))
            || ($driver instanceof \PDO && $driver->getAttribute(\PDO::ATTR_DRIVER_NAME) == 'pgsql')
        ) {
            $this->resource = $driver;
            return $this;
        }

        throw new Exception\InvalidArgumentException(
            '$driver must be a Pgsql or Postgresql PDO Zend\Db\Adapter\Driver, pgsql link resource or Postgresql PDO '
            . 'instance'
        );
    }

    /**
     * {@inheritDoc}
     */
    public function getName()
    {
        return 'PostgreSQL';
    }

    /**
     * {@inheritDoc}
     */
    public function quoteIdentifierChain($identifierChain)
    {
        return '"' . implode('"."', (array) str_replace('"', '""', $identifierChain)) . '"';
    }

    /**
     * {@inheritDoc}
     */
    public function quoteValue($value)
    {
        if ($this->resource instanceof DriverInterface) {
            $this->resource = $this->resource->getConnection()->getResource();
        }
        if (is_resource($this->resource)) {
            return '\'' . pg_escape_string($this->resource, $value) . '\'';
        }
        if ($this->resource instanceof \PDO) {
            return $this->resource->quote($value);
        }
        return 'E' . parent::quoteValue($value);
    }

    /**
     * {@inheritDoc}
     */
    public function quoteTrustedValue($value)
    {
        if ($this->resource instanceof DriverInterface) {
            $this->resource = $this->resource->getConnection()->getResource();
        }
        if (is_resource($this->resource)) {
            return '\'' . pg_escape_string($this->resource, $value) . '\'';
        }
        if ($this->resource instanceof \PDO) {
            return $this->resource->quote($value);
        }
        return 'E' . parent::quoteTrustedValue($value);
    }
}
