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

/**
 * Table prefix/suffix adapter.
 *
 * Used for inserting a prefix or suffix into table names.
 *
 * @author Samuel Fisher <sam@sfisher.co>
 */
class TablePrefixAdapter extends AdapterWrapper
{
    /**
     * {@inheritdoc}
     */
    public function getAdapterType()
    {
        return 'TablePrefixAdapter';
    }

    /**
     * {@inheritdoc}
     */
    public function hasTable($tableName)
    {
        $adapterTableName = $this->getAdapterTableName($tableName);

        return parent::hasTable($adapterTableName);
    }

    /**
     * {@inheritdoc}
     */
    public function createTable(Table $table)
    {
        $adapterTable = clone $table;
        $adapterTableName = $this->getAdapterTableName($table->getName());
        $adapterTable->setName($adapterTableName);

        foreach ($adapterTable->getForeignKeys() as $fk) {
            $adapterReferenceTable = $fk->getReferencedTable();
            $adapterReferenceTableName = $this->getAdapterTableName($adapterReferenceTable->getName());
            $adapterReferenceTable->setName($adapterReferenceTableName);
        }

        parent::createTable($adapterTable);
    }

    /**
     * {@inheritdoc}
     */
    public function renameTable($tableName, $newTableName)
    {
        $adapterTableName = $this->getAdapterTableName($tableName);
        $adapterNewTableName = $this->getAdapterTableName($newTableName);
        parent::renameTable($adapterTableName, $adapterNewTableName);
    }

    /**
     * {@inheritdoc}
     */
    public function dropTable($tableName)
    {
        $adapterTableName = $this->getAdapterTableName($tableName);
        parent::dropTable($adapterTableName);
    }

    /**
     * {@inheritdoc}
     */
    public function truncateTable($tableName)
    {
        $adapterTableName = $this->getAdapterTableName($tableName);
        parent::truncateTable($adapterTableName);
    }

    /**
     * {@inheritdoc}
     */
    public function getColumns($tableName)
    {
        $adapterTableName = $this->getAdapterTableName($tableName);

        return parent::getColumns($adapterTableName);
    }

    /**
     * {@inheritdoc}
     */
    public function hasColumn($tableName, $columnName)
    {
        $adapterTableName = $this->getAdapterTableName($tableName);

        return parent::hasColumn($adapterTableName, $columnName);
    }

    /**
     * {@inheritdoc}
     */
    public function addColumn(Table $table, Column $column)
    {
        $adapterTable = clone $table;
        $adapterTableName = $this->getAdapterTableName($table->getName());
        $adapterTable->setName($adapterTableName);
        parent::addColumn($adapterTable, $column);
    }

    /**
     * {@inheritdoc}
     */
    public function renameColumn($tableName, $columnName, $newColumnName)
    {
        $adapterTableName = $this->getAdapterTableName($tableName);
        parent::renameColumn($adapterTableName, $columnName, $newColumnName);
    }

    /**
     * {@inheritdoc}
     */
    public function changeColumn($tableName, $columnName, Column $newColumn)
    {
        $adapterTableName = $this->getAdapterTableName($tableName);

        return parent::changeColumn($adapterTableName, $columnName, $newColumn);
    }

    /**
     * {@inheritdoc}
     */
    public function dropColumn($tableName, $columnName)
    {
        $adapterTableName = $this->getAdapterTableName($tableName);
        parent::dropColumn($adapterTableName, $columnName);
    }

    /**
     * {@inheritdoc}
     */
    public function hasIndex($tableName, $columns)
    {
        $adapterTableName = $this->getAdapterTableName($tableName);

        return parent::hasIndex($adapterTableName, $columns);
    }

    /**
     * {@inheritdoc}
     */
    public function hasIndexByName($tableName, $indexName)
    {
        $adapterTableName = $this->getAdapterTableName($tableName);

        return parent::hasIndexByName($adapterTableName, $indexName);
    }

    /**
     * {@inheritdoc}
     */
    public function addIndex(Table $table, Index $index)
    {
        $adapterTable = clone $table;
        $adapterTableName = $this->getAdapterTableName($table->getName());
        $adapterTable->setName($adapterTableName);
        parent::addIndex($adapterTable, $index);
    }

    /**
     * {@inheritdoc}
     */
    public function dropIndex($tableName, $columns)
    {
        $adapterTableName = $this->getAdapterTableName($tableName);
        parent::dropIndex($adapterTableName, $columns);
    }

    /**
     * {@inheritdoc}
     */
    public function dropIndexByName($tableName, $indexName)
    {
        $adapterTableName = $this->getAdapterTableName($tableName);
        parent::dropIndexByName($adapterTableName, $indexName);
    }

    /**
     * {@inheritdoc}
     */
    public function hasForeignKey($tableName, $columns, $constraint = null)
    {
        $adapterTableName = $this->getAdapterTableName($tableName);

        return parent::hasForeignKey($adapterTableName, $columns, $constraint);
    }

    /**
     * {@inheritdoc}
     */
    public function addForeignKey(Table $table, ForeignKey $foreignKey)
    {
        $adapterTable = clone $table;
        $adapterTableName = $this->getAdapterTableName($table->getName());
        $adapterTable->setName($adapterTableName);
        parent::addForeignKey($adapterTable, $foreignKey);
    }

    /**
     * {@inheritdoc}
     */
    public function dropForeignKey($tableName, $columns, $constraint = null)
    {
        $adapterTableName = $this->getAdapterTableName($tableName);
        parent::dropForeignKey($adapterTableName, $columns, $constraint);
    }

    /**
     * {@inheritdoc}
     */
    public function insert(Table $table, $row)
    {
        $adapterTable = clone $table;
        $adapterTableName = $this->getAdapterTableName($table->getName());
        $adapterTable->setName($adapterTableName);
        parent::insert($adapterTable, $row);
    }

    /**
     * {@inheritdoc}
     */
    public function bulkinsert(Table $table, $rows)
    {
        $adapterTable = clone $table;
        $adapterTableName = $this->getAdapterTableName($table->getName());
        $adapterTable->setName($adapterTableName);
        parent::bulkinsert($adapterTable, $rows);
    }

    /**
     * Gets the table prefix.
     *
     * @return string
     */
    public function getPrefix()
    {
        return (string)$this->getOption('table_prefix');
    }

    /**
     * Gets the table suffix.
     *
     * @return string
     */
    public function getSuffix()
    {
        return (string)$this->getOption('table_suffix');
    }

    /**
     * Applies the prefix and suffix to the table name.
     *
     * @param string $tableName
     * @return string
     */
    public function getAdapterTableName($tableName)
    {
        return $this->getPrefix() . $tableName . $this->getSuffix();
    }
}
