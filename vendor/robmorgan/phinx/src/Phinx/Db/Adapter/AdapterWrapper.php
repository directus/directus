<?php
/**
 * Phinx
 *
 * (The MIT license)
 * Copyright (c) 2015 Rob Morgan
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated * documentation files (the "Software"), to
 * deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 *
 * @package    Phinx
 * @subpackage Phinx\Db\Adapter
 */
namespace Phinx\Db\Adapter;

use Phinx\Db\Table;
use Phinx\Db\Table\Column;
use Phinx\Db\Table\ForeignKey;
use Phinx\Db\Table\Index;
use Phinx\Migration\MigrationInterface;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;

/**
 * Adapter Wrapper.
 *
 * Proxy commands through to another adapter, allowing modification of
 * parameters during calls.
 *
 * @author Woody Gilk <woody.gilk@gmail.com>
 */
abstract class AdapterWrapper implements AdapterInterface, WrapperInterface
{
    /**
     * @var \Phinx\Db\Adapter\AdapterInterface
     */
    protected $adapter;

    /**
     * {@inheritdoc}
     */
    public function __construct(AdapterInterface $adapter)
    {
        $this->setAdapter($adapter);
    }

    /**
     * {@inheritdoc}
     */
    public function setAdapter(AdapterInterface $adapter)
    {
        $this->adapter = $adapter;

        return $this;
    }

    /**
     * {@inheritdoc}
     */
    public function getAdapter()
    {
        return $this->adapter;
    }

    /**
     * {@inheritdoc}
     */
    public function setOptions(array $options)
    {
        $this->adapter->setOptions($options);

        return $this;
    }

    /**
     * {@inheritdoc}
     */
    public function getOptions()
    {
        return $this->adapter->getOptions();
    }

    /**
     * {@inheritdoc}
     */
    public function hasOption($name)
    {
        return $this->adapter->hasOption($name);
    }

    /**
     * {@inheritdoc}
     */
    public function getOption($name)
    {
        return $this->adapter->getOption($name);
    }

    /**
     * {@inheritdoc}
     */
    public function setInput(InputInterface $input)
    {
        $this->adapter->setInput($input);

        return $this;
    }

    /**
     * {@inheritdoc}
     */
    public function getInput()
    {
        return $this->adapter->getInput();
    }

    /**
     * {@inheritdoc}
     */
    public function setOutput(OutputInterface $output)
    {
        $this->adapter->setOutput($output);

        return $this;
    }

    /**
     * {@inheritdoc}
     */
    public function getOutput()
    {
        return $this->adapter->getOutput();
    }

    /**
     * {@inheritdoc}
     */
    public function connect()
    {
        $this->getAdapter()->connect();
    }

    /**
     * {@inheritdoc}
     */
    public function disconnect()
    {
        $this->getAdapter()->disconnect();
    }

    /**
     * {@inheritdoc}
     */
    public function execute($sql)
    {
        return $this->getAdapter()->execute($sql);
    }

    /**
     * {@inheritdoc}
     */
    public function query($sql)
    {
        return $this->getAdapter()->query($sql);
    }

    /**
     * {@inheritdoc}
     */
    public function insert(Table $table, $row)
    {
        $this->getAdapter()->insert($table, $row);
    }

    /**
     * {@inheritdoc}
     */
    public function bulkinsert(Table $table, $rows)
    {
        $this->getAdapter()->bulkinsert($table, $rows);
    }

    /**
     * {@inheritdoc}
     */
    public function fetchRow($sql)
    {
        return $this->getAdapter()->fetchRow($sql);
    }

    /**
     * {@inheritdoc}
     */
    public function fetchAll($sql)
    {
        return $this->getAdapter()->fetchAll($sql);
    }

    /**
     * {@inheritdoc}
     */
    public function getVersions()
    {
        return $this->getAdapter()->getVersions();
    }

    /**
     * {@inheritdoc}
     */
    public function getVersionLog()
    {
        return $this->getAdapter()->getVersionLog();
    }

    /**
     * {@inheritdoc}
     */
    public function migrated(MigrationInterface $migration, $direction, $startTime, $endTime)
    {
        $this->getAdapter()->migrated($migration, $direction, $startTime, $endTime);

        return $this;
    }

    /**
     * @inheritDoc
     */
    public function toggleBreakpoint(MigrationInterface $migration)
    {
        $this->getAdapter()->toggleBreakpoint($migration);

        return $this;
    }

    /**
     * @inheritDoc
     */
    public function resetAllBreakpoints()
    {
        return $this->getAdapter()->resetAllBreakpoints();
    }

    /**
     * {@inheritdoc}
     */
    public function hasSchemaTable()
    {
        return $this->getAdapter()->hasSchemaTable();
    }

    /**
     * {@inheritdoc}
     */
    public function createSchemaTable()
    {
        $this->getAdapter()->createSchemaTable();
    }

    /**
     * {@inheritdoc}
     */
    public function getColumnTypes()
    {
        return $this->getAdapter()->getColumnTypes();
    }

    /**
     * {@inheritdoc}
     */
    public function isValidColumnType(Column $column)
    {
        return $this->getAdapter()->isValidColumnType($column);
    }

    /**
     * {@inheritdoc}
     */
    public function hasTransactions()
    {
        return $this->getAdapter()->hasTransactions();
    }

    /**
     * {@inheritdoc}
     */
    public function beginTransaction()
    {
        $this->getAdapter()->beginTransaction();
    }

    /**
     * {@inheritdoc}
     */
    public function commitTransaction()
    {
        $this->getAdapter()->commitTransaction();
    }

    /**
     * {@inheritdoc}
     */
    public function rollbackTransaction()
    {
        $this->getAdapter()->rollbackTransaction();
    }

    /**
     * {@inheritdoc}
     */
    public function quoteTableName($tableName)
    {
        return $this->getAdapter()->quoteTableName($tableName);
    }

    /**
     * {@inheritdoc}
     */
    public function quoteColumnName($columnName)
    {
        return $this->getAdapter()->quoteColumnName($columnName);
    }

    /**
     * {@inheritdoc}
     */
    public function hasTable($tableName)
    {
        return $this->getAdapter()->hasTable($tableName);
    }

    /**
     * {@inheritdoc}
     */
    public function createTable(Table $table)
    {
        $this->getAdapter()->createTable($table);
    }

    /**
     * {@inheritdoc}
     */
    public function renameTable($tableName, $newTableName)
    {
        $this->getAdapter()->renameTable($tableName, $newTableName);
    }

    /**
     * {@inheritdoc}
     */
    public function dropTable($tableName)
    {
        $this->getAdapter()->dropTable($tableName);
    }

    /**
     * {@inheritdoc}
     */
    public function truncateTable($tableName)
    {
        $this->getAdapter()->truncateTable($tableName);
    }

    /**
     * {@inheritdoc}
     */
    public function getColumns($tableName)
    {
        return $this->getAdapter()->getColumns($tableName);
    }

    /**
     * {@inheritdoc}
     */
    public function hasColumn($tableName, $columnName)
    {
        return $this->getAdapter()->hasColumn($tableName, $columnName);
    }

    /**
     * {@inheritdoc}
     */
    public function addColumn(Table $table, Column $column)
    {
        $this->getAdapter()->addColumn($table, $column);
    }

    /**
     * {@inheritdoc}
     */
    public function renameColumn($tableName, $columnName, $newColumnName)
    {
        $this->getAdapter()->renameColumn($tableName, $columnName, $newColumnName);
    }

    /**
     * {@inheritdoc}
     */
    public function changeColumn($tableName, $columnName, Column $newColumn)
    {
        return $this->getAdapter()->changeColumn($tableName, $columnName, $newColumn);
    }

    /**
     * {@inheritdoc}
     */
    public function dropColumn($tableName, $columnName)
    {
        $this->getAdapter()->dropColumn($tableName, $columnName);
    }

    /**
     * {@inheritdoc}
     */
    public function hasIndex($tableName, $columns)
    {
        return $this->getAdapter()->hasIndex($tableName, $columns);
    }

    /**
     * {@inheritdoc}
     */
    public function hasIndexByName($tableName, $indexName)
    {
        return $this->getAdapter()->hasIndexByName($tableName, $indexName);
    }

    /**
     * {@inheritdoc}
     */
    public function addIndex(Table $table, Index $index)
    {
        $this->getAdapter()->addIndex($table, $index);
    }

    /**
     * {@inheritdoc}
     */
    public function dropIndex($tableName, $columns)
    {
        $this->getAdapter()->dropIndex($tableName, $columns);
    }

    /**
     * {@inheritdoc}
     */
    public function dropIndexByName($tableName, $indexName)
    {
        $this->getAdapter()->dropIndexByName($tableName, $indexName);
    }

    /**
     * {@inheritdoc}
     */
    public function hasForeignKey($tableName, $columns, $constraint = null)
    {
        return $this->getAdapter()->hasForeignKey($tableName, $columns, $constraint);
    }

    /**
     * {@inheritdoc}
     */
    public function addForeignKey(Table $table, ForeignKey $foreignKey)
    {
        $this->getAdapter()->addForeignKey($table, $foreignKey);
    }

    /**
     * {@inheritdoc}
     */
    public function dropForeignKey($tableName, $columns, $constraint = null)
    {
        $this->getAdapter()->dropForeignKey($tableName, $columns, $constraint);
    }

    /**
     * {@inheritdoc}
     */
    public function getSqlType($type, $limit = null)
    {
        return $this->getAdapter()->getSqlType($type, $limit);
    }

    /**
     * {@inheritdoc}
     */
    public function createDatabase($name, $options = [])
    {
        $this->getAdapter()->createDatabase($name, $options);
    }

    /**
     * {@inheritdoc}
     */
    public function hasDatabase($name)
    {
        $this->getAdapter()->hasDatabase($name);
    }

    /**
     * {@inheritdoc}
     */
    public function dropDatabase($name)
    {
        $this->getAdapter()->dropDatabase($name);
    }

    /**
     * {@inheritdoc}
     */
    public function createSchema($schemaName = 'public')
    {
        $this->getAdapter()->createSchema($schemaName);
    }

    /**
     * {@inheritdoc}
     */
    public function dropSchema($schemaName)
    {
        $this->getAdapter()->dropSchema($schemaName);
    }

    /**
     * {@inheritdoc}
     */
    public function castToBool($value)
    {
        return $this->getAdapter()->castToBool($value);
    }

    /**
     * {@inheritdoc}
     */
    public function getConnection()
    {
        return $this->getAdapter()->getConnection();
    }
}
