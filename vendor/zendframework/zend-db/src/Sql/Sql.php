<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace Zend\Db\Sql;

use Zend\Db\Adapter\AdapterInterface;
use Zend\Db\Adapter\Driver\StatementInterface;
use Zend\Db\Adapter\Platform\PlatformInterface;

class Sql
{
    /** @var AdapterInterface */
    protected $adapter = null;

    /** @var string|array|TableIdentifier */
    protected $table = null;

    /** @var Platform\Platform */
    protected $sqlPlatform = null;

    /**
     * @param AdapterInterface                  $adapter
     * @param null|string|array|TableIdentifier $table
     * @param null|Platform\AbstractPlatform    $sqlPlatform @deprecated since version 3.0
     */
    public function __construct(AdapterInterface $adapter, $table = null, Platform\AbstractPlatform $sqlPlatform = null)
    {
        $this->adapter = $adapter;
        if ($table) {
            $this->setTable($table);
        }
        $this->sqlPlatform = $sqlPlatform ?: new Platform\Platform($adapter);
    }

    /**
     * @return null|\Zend\Db\Adapter\AdapterInterface
     */
    public function getAdapter()
    {
        return $this->adapter;
    }

    public function hasTable()
    {
        return ($this->table !== null);
    }

    public function setTable($table)
    {
        if (is_string($table) || is_array($table) || $table instanceof TableIdentifier) {
            $this->table = $table;
        } else {
            throw new Exception\InvalidArgumentException('Table must be a string, array or instance of TableIdentifier.');
        }
        return $this;
    }

    public function getTable()
    {
        return $this->table;
    }

    public function getSqlPlatform()
    {
        return $this->sqlPlatform;
    }

    public function select($table = null)
    {
        if ($this->table !== null && $table !== null) {
            throw new Exception\InvalidArgumentException(sprintf(
                'This Sql object is intended to work with only the table "%s" provided at construction time.',
                $this->table
            ));
        }
        return new Select(($table) ?: $this->table);
    }

    public function insert($table = null)
    {
        if ($this->table !== null && $table !== null) {
            throw new Exception\InvalidArgumentException(sprintf(
                'This Sql object is intended to work with only the table "%s" provided at construction time.',
                $this->table
            ));
        }
        return new Insert(($table) ?: $this->table);
    }

    public function update($table = null)
    {
        if ($this->table !== null && $table !== null) {
            throw new Exception\InvalidArgumentException(sprintf(
                'This Sql object is intended to work with only the table "%s" provided at construction time.',
                $this->table
            ));
        }
        return new Update(($table) ?: $this->table);
    }

    public function delete($table = null)
    {
        if ($this->table !== null && $table !== null) {
            throw new Exception\InvalidArgumentException(sprintf(
                'This Sql object is intended to work with only the table "%s" provided at construction time.',
                $this->table
            ));
        }
        return new Delete(($table) ?: $this->table);
    }

    /**
     * @param PreparableSqlInterface $sqlObject
     * @param StatementInterface     $statement
     * @param AdapterInterface       $adapter
     *
     * @return StatementInterface
     */
    public function prepareStatementForSqlObject(PreparableSqlInterface $sqlObject, StatementInterface $statement = null, AdapterInterface $adapter = null)
    {
        $adapter   = $adapter ?: $this->adapter;
        $statement = $statement ?: $adapter->getDriver()->createStatement();

        return $this->sqlPlatform->setSubject($sqlObject)->prepareStatement($adapter, $statement);
    }

    /**
     * Get sql string using platform or sql object
     *
     * @param SqlInterface           $sqlObject
     * @param PlatformInterface|null $platform
     *
     * @return string
     *
     * @deprecated Deprecated in 2.4. Use buildSqlString() instead
     */
    public function getSqlStringForSqlObject(SqlInterface $sqlObject, PlatformInterface $platform = null)
    {
        $platform = ($platform) ?: $this->adapter->getPlatform();
        return $this->sqlPlatform->setSubject($sqlObject)->getSqlString($platform);
    }

    /**
     * @param SqlInterface     $sqlObject
     * @param AdapterInterface $adapter
     *
     * @return string
     *
     * @throws Exception\InvalidArgumentException
     */
    public function buildSqlString(SqlInterface $sqlObject, AdapterInterface $adapter = null)
    {
        return $this
            ->sqlPlatform
            ->setSubject($sqlObject)
            ->getSqlString($adapter ? $adapter->getPlatform() : $this->adapter->getPlatform());
    }
}
