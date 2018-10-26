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
use Phinx\Migration\IrreversibleMigrationException;

/**
 * Phinx Proxy Adapter.
 *
 * Used for recording migration commands to automatically reverse them.
 *
 * @author Rob Morgan <robbym@gmail.com>
 */
class ProxyAdapter extends AdapterWrapper
{
    /**
     * @var array
     */
    protected $commands;

    /**
     * {@inheritdoc}
     */
    public function getAdapterType()
    {
        return 'ProxyAdapter';
    }

    /**
     * {@inheritdoc}
     */
    public function createTable(Table $table)
    {
        $this->recordCommand('createTable', [$table->getName()]);
    }

    /**
     * {@inheritdoc}
     */
    public function renameTable($tableName, $newTableName)
    {
        $this->recordCommand('renameTable', [$tableName, $newTableName]);
    }

    /**
     * {@inheritdoc}
     */
    public function dropTable($tableName)
    {
        $this->recordCommand('dropTable', [$tableName]);
    }

    /**
     * {@inheritdoc}
     */
    public function truncateTable($tableName)
    {
        $this->recordCommand('truncateTable', [$tableName]);
    }

    /**
     * {@inheritdoc}
     */
    public function addColumn(Table $table, Column $column)
    {
        $this->recordCommand('addColumn', [$table, $column]);
    }

    /**
     * {@inheritdoc}
     */
    public function renameColumn($tableName, $columnName, $newColumnName)
    {
        $this->recordCommand('renameColumn', [$tableName, $columnName, $newColumnName]);
    }

    /**
     * {@inheritdoc}
     */
    public function changeColumn($tableName, $columnName, Column $newColumn)
    {
        $this->recordCommand('changeColumn', [$tableName, $columnName, $newColumn]);
    }

    /**
     * {@inheritdoc}
     */
    public function dropColumn($tableName, $columnName)
    {
        $this->recordCommand('dropColumn', [$tableName, $columnName]);
    }

    /**
     * {@inheritdoc}
     */
    public function addIndex(Table $table, Index $index)
    {
        $this->recordCommand('addIndex', [$table, $index]);
    }

    /**
     * {@inheritdoc}
     */
    public function dropIndex($tableName, $columns, $options = [])
    {
        $this->recordCommand('dropIndex', [$tableName, $columns, $options]);
    }

    /**
     * {@inheritdoc}
     */
    public function dropIndexByName($tableName, $indexName)
    {
        $this->recordCommand('dropIndexByName', [$tableName, $indexName]);
    }

    /**
     * {@inheritdoc}
     */
    public function addForeignKey(Table $table, ForeignKey $foreignKey)
    {
        $this->recordCommand('addForeignKey', [$table, $foreignKey]);
    }

    /**
     * {@inheritdoc}
     */
    public function dropForeignKey($tableName, $columns, $constraint = null)
    {
        $this->recordCommand('dropForeignKey', [$columns, $constraint]);
    }

    /**
     * {@inheritdoc}
     */
    public function createDatabase($name, $options = [])
    {
        $this->recordCommand('createDatabase', [$name, $options]);
    }

    /**
     * Record a command for execution later.
     *
     * @param string $name Command Name
     * @param array $arguments Command Arguments
     * @return void
     */
    public function recordCommand($name, $arguments)
    {
        $this->commands[] = [
            'name' => $name,
            'arguments' => $arguments
        ];
    }

    /**
     * Sets an array of recorded commands.
     *
     * @param array $commands Commands
     * @return \Phinx\Db\Adapter\ProxyAdapter
     */
    public function setCommands($commands)
    {
        $this->commands = $commands;

        return $this;
    }

    /**
     * Gets an array of the recorded commands.
     *
     * @return array
     */
    public function getCommands()
    {
        return $this->commands;
    }

    /**
     * Gets an array of the recorded commands in reverse.
     *
     * @throws \Phinx\Migration\IrreversibleMigrationException if a command cannot be reversed.
     * @return array
     */
    public function getInvertedCommands()
    {
        if ($this->getCommands() === null) {
            return [];
        }

        $invCommands = [];
        $supportedCommands = [
            'createTable', 'renameTable', 'addColumn',
            'renameColumn', 'addIndex', 'addForeignKey'
        ];
        foreach (array_reverse($this->getCommands()) as $command) {
            if (!in_array($command['name'], $supportedCommands)) {
                throw new IrreversibleMigrationException(sprintf(
                    'Cannot reverse a "%s" command',
                    $command['name']
                ));
            }
            $invertMethod = 'invert' . ucfirst($command['name']);
            $invertedCommand = $this->$invertMethod($command['arguments']);
            $invCommands[] = [
                'name' => $invertedCommand['name'],
                'arguments' => $invertedCommand['arguments']
            ];
        }

        return $invCommands;
    }

    /**
     * Execute the recorded commands.
     *
     * @return void
     */
    public function executeCommands()
    {
        $commands = $this->getCommands();
        foreach ($commands as $command) {
            call_user_func_array([$this->getAdapter(), $command['name']], $command['arguments']);
        }
    }

    /**
     * Execute the recorded commands in reverse.
     *
     * @return void
     */
    public function executeInvertedCommands()
    {
        $commands = $this->getInvertedCommands();
        foreach ($commands as $command) {
            call_user_func_array([$this->getAdapter(), $command['name']], $command['arguments']);
        }
    }

    /**
     * Returns the reverse of a createTable command.
     *
     * @param array $args Method Arguments
     * @return array
     */
    public function invertCreateTable($args)
    {
        return ['name' => 'dropTable', 'arguments' => [$args[0]]];
    }

    /**
     * Returns the reverse of a renameTable command.
     *
     * @param array $args Method Arguments
     * @return array
     */
    public function invertRenameTable($args)
    {
        return ['name' => 'renameTable', 'arguments' => [$args[1], $args[0]]];
    }

    /**
     * Returns the reverse of a addColumn command.
     *
     * @param array $args Method Arguments
     * @return array
     */
    public function invertAddColumn($args)
    {
        return ['name' => 'dropColumn', 'arguments' => [$args[0]->getName(), $args[1]->getName()]];
    }

    /**
     * Returns the reverse of a renameColumn command.
     *
     * @param array $args Method Arguments
     * @return array
     */
    public function invertRenameColumn($args)
    {
        return ['name' => 'renameColumn', 'arguments' => [$args[0], $args[2], $args[1]]];
    }

    /**
     * Returns the reverse of a addIndex command.
     *
     * @param array $args Method Arguments
     * @return array
     */
    public function invertAddIndex($args)
    {
        return ['name' => 'dropIndex', 'arguments' => [$args[0]->getName(), $args[1]->getColumns()]];
    }

    /**
     * Returns the reverse of a addForeignKey command.
     *
     * @param array $args Method Arguments
     * @return array
     */
    public function invertAddForeignKey($args)
    {
        return ['name' => 'dropForeignKey', 'arguments' => [$args[0]->getName(), $args[1]->getColumns()]];
    }
}
