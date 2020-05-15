<?php
/**
 * Phinx
 *
 * (The MIT license)
 * Copyright (c) 2017 Cake Software Foundation
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
use Symfony\Component\Console\Output\OutputInterface;

/**
 * Wraps any adpter to record the time spend executing its commands
 */
class TimedOutputAdapter extends AdapterWrapper
{

    /**
     * {@inheritdoc}
     */
    public function getAdapterType()
    {
        return $this->getAdapter()->getAdapterType();
    }

    /**
     * Start timing a command.
     *
     * @return callable A function that is to be called when the command finishes
     */
    public function startCommandTimer()
    {
        $started = microtime(true);

        return function () use ($started) {
            $end = microtime(true);
            if (OutputInterface::VERBOSITY_VERBOSE <= $this->getOutput()->getVerbosity()) {
                $this->getOutput()->writeln('    -> ' . sprintf('%.4fs', $end - $started));
            }
        };
    }

    /**
     * Write a Phinx command to the output.
     *
     * @param string $command Command Name
     * @param array  $args    Command Args
     * @return void
     */
    public function writeCommand($command, $args = [])
    {
        if (OutputInterface::VERBOSITY_VERBOSE > $this->getOutput()->getVerbosity()) {
            return;
        }

        if (count($args)) {
            $outArr = [];
            foreach ($args as $arg) {
                if (is_array($arg)) {
                    $arg = array_map(
                        function ($value) {
                            return '\'' . $value . '\'';
                        },
                        $arg
                    );
                    $outArr[] = '[' . implode(', ', $arg) . ']';
                    continue;
                }

                $outArr[] = '\'' . $arg . '\'';
            }
            $this->getOutput()->writeln(' -- ' . $command . '(' . implode(', ', $outArr) . ')');

            return;
        }

        $this->getOutput()->writeln(' -- ' . $command);
    }

    /**
     * {@inheritdoc}
     *
     * @return void
     */
    public function insert(Table $table, $row)
    {
        $end = $this->startCommandTimer();
        $this->writeCommand('insert', [$table->getName()]);
        parent::insert($table, $row);
        $end();
    }

    /**
     * {@inheritdoc}
     *
     * @return void
     */
    public function bulkinsert(Table $table, $rows)
    {
        $end = $this->startCommandTimer();
        $this->writeCommand('bulkinsert', [$table->getName()]);
        parent::bulkinsert($table, $rows);
        $end();
    }

    /**
     * {@inheritdoc}
     */
    public function createTable(Table $table)
    {
        $end = $this->startCommandTimer();
        $this->writeCommand('createTable', [$table->getName()]);
        parent::createTable($table);
        $end();
    }

    /**
     * {@inheritdoc}
     */
    public function renameTable($tableName, $newTableName)
    {
        $end = $this->startCommandTimer();
        $this->writeCommand('renameTable', [$tableName, $newTableName]);
        parent::renameTable($tableName, $newTableName);
        $end();
    }

    /**
     * {@inheritdoc}
     */
    public function dropTable($tableName)
    {
        $end = $this->startCommandTimer();
        $this->writeCommand('dropTable', [$tableName]);
        parent::dropTable($tableName);
        $end();
    }

    /**
     * {@inheritdoc}
     */
    public function truncateTable($tableName)
    {
        $end = $this->startCommandTimer();
        $this->writeCommand('truncateTable', [$tableName]);
        parent::truncateTable($tableName);
        $end();
    }

    /**
     * {@inheritdoc}
     */
    public function addColumn(Table $table, Column $column)
    {
        $end = $this->startCommandTimer();
        $this->writeCommand(
            'addColumn',
            [
                $table->getName(),
                $column->getName(),
                $column->getType()
            ]
        );
        parent::addColumn($table, $column);
        $end();
    }

    /**
     * {@inheritdoc}
     */
    public function renameColumn($tableName, $columnName, $newColumnName)
    {
        $end = $this->startCommandTimer();
        $this->writeCommand('renameColumn', [$tableName, $columnName, $newColumnName]);
        parent::renameColumn($tableName, $columnName, $newColumnName);
        $end();
    }

    /**
     * {@inheritdoc}
     */
    public function changeColumn($tableName, $columnName, Column $newColumn)
    {
        $end = $this->startCommandTimer();
        $this->writeCommand('changeColumn', [$tableName, $columnName, $newColumn->getType()]);
        parent::changeColumn($tableName, $columnName, $newColumn);
        $end();
    }

    /**
     * {@inheritdoc}
     */
    public function dropColumn($tableName, $columnName)
    {
        $end = $this->startCommandTimer();
        $this->writeCommand('dropColumn', [$tableName, $columnName]);
        parent::dropColumn($tableName, $columnName);
        $end();
    }

    /**
     * {@inheritdoc}
     */
    public function addIndex(Table $table, Index $index)
    {
        $end = $this->startCommandTimer();
        $this->writeCommand('addIndex', [$table->getName(), $index->getColumns()]);
        parent::addIndex($table, $index);
        $end();
    }

    /**
     * {@inheritdoc}
     */
    public function dropIndex($tableName, $columns)
    {
        $end = $this->startCommandTimer();
        $this->writeCommand('dropIndex', [$tableName, $columns]);
        parent::dropIndex($tableName, $columns);
        $end();
    }

    /**
     * {@inheritdoc}
     */
    public function dropIndexByName($tableName, $indexName)
    {
        $end = $this->startCommandTimer();
        $this->writeCommand('dropIndexByName', [$tableName, $indexName]);
        parent::dropIndexByName($tableName, $indexName);
        $end();
    }

    /**
     * {@inheritdoc}
     */
    public function addForeignKey(Table $table, ForeignKey $foreignKey)
    {
        $end = $this->startCommandTimer();
        $this->writeCommand('addForeignKey', [$table->getName(), $foreignKey->getColumns()]);
        parent::addForeignKey($table, $foreignKey);
        $end();
    }

    /**
     * {@inheritdoc}
     */
    public function dropForeignKey($tableName, $columns, $constraint = null)
    {
        $end = $this->startCommandTimer();
        $this->writeCommand('dropForeignKey', [$tableName, $columns]);
        parent::dropForeignKey($tableName, $columns, $constraint);
        $end();
    }

    /**
     * {@inheritdoc}
     */
    public function createDatabase($name, $options = [])
    {
        $end = $this->startCommandTimer();
        $this->writeCommand('createDatabase', [$name]);
        parent::createDatabase($name, $options);
        $end();
    }

    /**
     * {@inheritdoc}
     */
    public function dropDatabase($name)
    {
        $end = $this->startCommandTimer();
        $this->writeCommand('dropDatabase', [$name]);
        parent::dropDatabase($name);
        $end();
    }

    /**
     * {@inheritdoc}
     */
    public function createSchema($name = 'public')
    {
        $end = $this->startCommandTimer();
        $this->writeCommand('createSchema', [$name]);
        parent::createSchema($name);
        $end();
    }

    /**
     * {@inheritdoc}
     */
    public function dropSchema($name)
    {
        $end = $this->startCommandTimer();
        $this->writeCommand('dropSchema', [$name]);
        parent::dropSchema($name);
        $end();
    }
}
