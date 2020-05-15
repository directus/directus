<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace Zend\Db\RowGateway;

use ArrayAccess;
use Countable;
use Zend\Db\Sql\Sql;
use Zend\Db\Sql\TableIdentifier;

abstract class AbstractRowGateway implements ArrayAccess, Countable, RowGatewayInterface
{
    /**
     * @var bool
     */
    protected $isInitialized = false;

    /**
     * @var string|TableIdentifier
     */
    protected $table = null;

    /**
     * @var array
     */
    protected $primaryKeyColumn = null;

    /**
     * @var array
     */
    protected $primaryKeyData = null;

    /**
     * @var array
     */
    protected $data = [];

    /**
     * @var Sql
     */
    protected $sql = null;

    /**
     * @var Feature\FeatureSet
     */
    protected $featureSet = null;

    /**
     * initialize()
     */
    public function initialize()
    {
        if ($this->isInitialized) {
            return;
        }

        if (! $this->featureSet instanceof Feature\FeatureSet) {
            $this->featureSet = new Feature\FeatureSet;
        }

        $this->featureSet->setRowGateway($this);
        $this->featureSet->apply('preInitialize', []);

        if (! is_string($this->table) && ! $this->table instanceof TableIdentifier) {
            throw new Exception\RuntimeException('This row object does not have a valid table set.');
        }

        if ($this->primaryKeyColumn === null) {
            throw new Exception\RuntimeException('This row object does not have a primary key column set.');
        } elseif (is_string($this->primaryKeyColumn)) {
            $this->primaryKeyColumn = (array) $this->primaryKeyColumn;
        }

        if (! $this->sql instanceof Sql) {
            throw new Exception\RuntimeException('This row object does not have a Sql object set.');
        }

        $this->featureSet->apply('postInitialize', []);

        $this->isInitialized = true;
    }

    /**
     * Populate Data
     *
     * @param  array $rowData
     * @param  bool  $rowExistsInDatabase
     * @return self Provides a fluent interface
     */
    public function populate(array $rowData, $rowExistsInDatabase = false)
    {
        $this->initialize();

        $this->data = $rowData;
        if ($rowExistsInDatabase == true) {
            $this->processPrimaryKeyData();
        } else {
            $this->primaryKeyData = null;
        }

        return $this;
    }

    /**
     * @param mixed $array
     * @return AbstractRowGateway
     */
    public function exchangeArray($array)
    {
        return $this->populate($array, true);
    }

    /**
     * Save
     *
     * @return int
     */
    public function save()
    {
        $this->initialize();

        if ($this->rowExistsInDatabase()) {
            // UPDATE

            $data = $this->data;
            $where = [];
            $isPkModified = false;

            // primary key is always an array even if its a single column
            foreach ($this->primaryKeyColumn as $pkColumn) {
                $where[$pkColumn] = $this->primaryKeyData[$pkColumn];
                if ($data[$pkColumn] == $this->primaryKeyData[$pkColumn]) {
                    unset($data[$pkColumn]);
                } else {
                    $isPkModified = true;
                }
            }

            $statement = $this->sql->prepareStatementForSqlObject($this->sql->update()->set($data)->where($where));
            $result = $statement->execute();
            $rowsAffected = $result->getAffectedRows();
            unset($statement, $result); // cleanup

            // If one or more primary keys are modified, we update the where clause
            if ($isPkModified) {
                foreach ($this->primaryKeyColumn as $pkColumn) {
                    if ($data[$pkColumn] != $this->primaryKeyData[$pkColumn]) {
                        $where[$pkColumn] = $data[$pkColumn];
                    }
                }
            }
        } else {
            // INSERT
            $insert = $this->sql->insert();
            $insert->values($this->data);

            $statement = $this->sql->prepareStatementForSqlObject($insert);

            $result = $statement->execute();
            if (($primaryKeyValue = $result->getGeneratedValue()) && count($this->primaryKeyColumn) == 1) {
                $this->primaryKeyData = [$this->primaryKeyColumn[0] => $primaryKeyValue];
            } else {
                // make primary key data available so that $where can be complete
                $this->processPrimaryKeyData();
            }
            $rowsAffected = $result->getAffectedRows();
            unset($statement, $result); // cleanup

            $where = [];
            // primary key is always an array even if its a single column
            foreach ($this->primaryKeyColumn as $pkColumn) {
                $where[$pkColumn] = $this->primaryKeyData[$pkColumn];
            }
        }

        // refresh data
        $statement = $this->sql->prepareStatementForSqlObject($this->sql->select()->where($where));
        $result = $statement->execute();
        $rowData = $result->current();
        unset($statement, $result); // cleanup

        // make sure data and original data are in sync after save
        $this->populate($rowData, true);

        // return rows affected
        return $rowsAffected;
    }

    /**
     * Delete
     *
     * @return int
     */
    public function delete()
    {
        $this->initialize();

        $where = [];
        // primary key is always an array even if its a single column
        foreach ($this->primaryKeyColumn as $pkColumn) {
            $where[$pkColumn] = $this->primaryKeyData[$pkColumn];
        }

        // @todo determine if we need to do a select to ensure 1 row will be affected

        $statement = $this->sql->prepareStatementForSqlObject($this->sql->delete()->where($where));
        $result = $statement->execute();

        $affectedRows = $result->getAffectedRows();
        if ($affectedRows == 1) {
            // detach from database
            $this->primaryKeyData = null;
        }

        return $affectedRows;
    }

    /**
     * Offset Exists
     *
     * @param  string $offset
     * @return bool
     */
    public function offsetExists($offset)
    {
        return array_key_exists($offset, $this->data);
    }

    /**
     * Offset get
     *
     * @param  string $offset
     * @return mixed
     */
    public function offsetGet($offset)
    {
        return $this->data[$offset];
    }

    /**
     * Offset set
     *
     * @param  string $offset
     * @param  mixed $value
     * @return self Provides a fluent interface
     */
    public function offsetSet($offset, $value)
    {
        $this->data[$offset] = $value;
        return $this;
    }

    /**
     * Offset unset
     *
     * @param  string $offset
     * @return self Provides a fluent interface
     */
    public function offsetUnset($offset)
    {
        $this->data[$offset] = null;
        return $this;
    }

    /**
     * @return int
     */
    public function count()
    {
        return count($this->data);
    }

    /**
     * To array
     *
     * @return array
     */
    public function toArray()
    {
        return $this->data;
    }

    /**
     * __get
     *
     * @param  string $name
     * @throws Exception\InvalidArgumentException
     * @return mixed
     */
    public function __get($name)
    {
        if (array_key_exists($name, $this->data)) {
            return $this->data[$name];
        } else {
            throw new Exception\InvalidArgumentException('Not a valid column in this row: ' . $name);
        }
    }

    /**
     * __set
     *
     * @param  string $name
     * @param  mixed $value
     * @return void
     */
    public function __set($name, $value)
    {
        $this->offsetSet($name, $value);
    }

    /**
     * __isset
     *
     * @param  string $name
     * @return bool
     */
    public function __isset($name)
    {
        return $this->offsetExists($name);
    }

    /**
     * __unset
     *
     * @param  string $name
     * @return void
     */
    public function __unset($name)
    {
        $this->offsetUnset($name);
    }

    /**
     * @return bool
     */
    public function rowExistsInDatabase()
    {
        return ($this->primaryKeyData !== null);
    }

    /**
     * @throws Exception\RuntimeException
     */
    protected function processPrimaryKeyData()
    {
        $this->primaryKeyData = [];
        foreach ($this->primaryKeyColumn as $column) {
            if (! isset($this->data[$column])) {
                throw new Exception\RuntimeException(
                    'While processing primary key data, a known key ' . $column . ' was not found in the data array'
                );
            }
            $this->primaryKeyData[$column] = $this->data[$column];
        }
    }
}
