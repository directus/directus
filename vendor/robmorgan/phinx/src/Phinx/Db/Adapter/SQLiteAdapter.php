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
 * Phinx SQLite Adapter.
 *
 * @author Rob Morgan <robbym@gmail.com>
 * @author Richard McIntyre <richard.mackstars@gmail.com>
 */
class SQLiteAdapter extends PdoAdapter implements AdapterInterface
{
    protected $definitionsWithLimits = [
        'CHARACTER',
        'VARCHAR',
        'VARYING CHARACTER',
        'NCHAR',
        'NATIVE CHARACTER',
        'NVARCHAR'
    ];

    /**
     * {@inheritdoc}
     */
    public function connect()
    {
        if ($this->connection === null) {
            if (!class_exists('PDO') || !in_array('sqlite', \PDO::getAvailableDrivers(), true)) {
                // @codeCoverageIgnoreStart
                throw new \RuntimeException('You need to enable the PDO_SQLITE extension for Phinx to run properly.');
                // @codeCoverageIgnoreEnd
            }

            $db = null;
            $options = $this->getOptions();

            // if port is specified use it, otherwise use the MySQL default
            if (isset($options['memory'])) {
                $dsn = 'sqlite::memory:';
            } else {
                $dsn = 'sqlite:' . $options['name'];
                if (file_exists($options['name'] . '.sqlite3')) {
                    $dsn = 'sqlite:' . $options['name'] . '.sqlite3';
                }
            }

            try {
                $db = new \PDO($dsn);
            } catch (\PDOException $exception) {
                throw new \InvalidArgumentException(sprintf(
                    'There was a problem connecting to the database: %s',
                    $exception->getMessage()
                ));
            }

            $this->setConnection($db);
        }
    }

    /**
     * {@inheritdoc}
     */
    public function disconnect()
    {
        $this->connection = null;
    }

    /**
     * {@inheritdoc}
     */
    public function hasTransactions()
    {
        return true;
    }

    /**
     * {@inheritdoc}
     */
    public function beginTransaction()
    {
        $this->execute('BEGIN TRANSACTION');
    }

    /**
     * {@inheritdoc}
     */
    public function commitTransaction()
    {
        $this->execute('COMMIT');
    }

    /**
     * {@inheritdoc}
     */
    public function rollbackTransaction()
    {
        $this->execute('ROLLBACK');
    }

    /**
     * {@inheritdoc}
     */
    public function quoteTableName($tableName)
    {
        return str_replace('.', '`.`', $this->quoteColumnName($tableName));
    }

    /**
     * {@inheritdoc}
     */
    public function quoteColumnName($columnName)
    {
        return '`' . str_replace('`', '``', $columnName) . '`';
    }

    /**
     * {@inheritdoc}
     */
    public function hasTable($tableName)
    {
        $tables = [];
        $rows = $this->fetchAll(sprintf('SELECT name FROM sqlite_master WHERE type=\'table\' AND name=\'%s\'', $tableName));
        foreach ($rows as $row) {
            $tables[] = strtolower($row[0]);
        }

        return in_array(strtolower($tableName), $tables);
    }

    /**
     * {@inheritdoc}
     */
    public function createTable(Table $table)
    {
        // Add the default primary key
        $columns = $table->getPendingColumns();
        $options = $table->getOptions();
        if (!isset($options['id']) || (isset($options['id']) && $options['id'] === true)) {
            $column = new Column();
            $column->setName('id')
                   ->setType('integer')
                   ->setIdentity(true);

            array_unshift($columns, $column);
        } elseif (isset($options['id']) && is_string($options['id'])) {
            // Handle id => "field_name" to support AUTO_INCREMENT
            $column = new Column();
            $column->setName($options['id'])
                   ->setType('integer')
                   ->setIdentity(true);

            array_unshift($columns, $column);
        }

        $sql = 'CREATE TABLE ';
        $sql .= $this->quoteTableName($table->getName()) . ' (';
        foreach ($columns as $column) {
            $sql .= $this->quoteColumnName($column->getName()) . ' ' . $this->getColumnSqlDefinition($column) . ', ';
        }

        // set the primary key(s)
        if (isset($options['primary_key'])) {
            $sql = rtrim($sql);
            $sql .= ' PRIMARY KEY (';
            if (is_string($options['primary_key'])) { // handle primary_key => 'id'
                $sql .= $this->quoteColumnName($options['primary_key']);
            } elseif (is_array($options['primary_key'])) { // handle primary_key => array('tag_id', 'resource_id')
                $sql .= implode(',', array_map([$this, 'quoteColumnName'], $options['primary_key']));
            }
            $sql .= ')';
        } else {
            $sql = substr(rtrim($sql), 0, -1); // no primary keys
        }

        // set the foreign keys
        $foreignKeys = $table->getForeignKeys();
        if (!empty($foreignKeys)) {
            foreach ($foreignKeys as $foreignKey) {
                $sql .= ', ' . $this->getForeignKeySqlDefinition($foreignKey);
            }
        }

        $sql = rtrim($sql) . ');';
        // execute the sql
        $this->execute($sql);

        foreach ($table->getIndexes() as $index) {
            $this->addIndex($table, $index);
        }
    }

    /**
     * {@inheritdoc}
     */
    public function renameTable($tableName, $newTableName)
    {
        $this->execute(sprintf('ALTER TABLE %s RENAME TO %s', $this->quoteTableName($tableName), $this->quoteTableName($newTableName)));
    }

    /**
     * {@inheritdoc}
     */
    public function dropTable($tableName)
    {
        $this->execute(sprintf('DROP TABLE %s', $this->quoteTableName($tableName)));
    }

    /**
     * {@inheritdoc}
     */
    public function truncateTable($tableName)
    {
        $sql = sprintf(
            'DELETE FROM %s',
            $this->quoteTableName($tableName)
        );

        $this->execute($sql);
    }

    /**
     * {@inheritdoc}
     */
    public function getColumns($tableName)
    {
        $columns = [];
        $rows = $this->fetchAll(sprintf('pragma table_info(%s)', $this->quoteTableName($tableName)));

        foreach ($rows as $columnInfo) {
            $column = new Column();
            $type = strtolower($columnInfo['type']);
            $column->setName($columnInfo['name'])
                   ->setNull($columnInfo['notnull'] !== '1')
                   ->setDefault($columnInfo['dflt_value']);

            $phinxType = $this->getPhinxType($type);
            $column->setType($phinxType['name'])
                   ->setLimit($phinxType['limit']);

            if ($columnInfo['pk'] == 1) {
                $column->setIdentity(true);
            }

            $columns[] = $column;
        }

        return $columns;
    }

    /**
     * {@inheritdoc}
     */
    public function hasColumn($tableName, $columnName)
    {
        $rows = $this->fetchAll(sprintf('pragma table_info(%s)', $this->quoteTableName($tableName)));
        foreach ($rows as $column) {
            if (strcasecmp($column['name'], $columnName) === 0) {
                return true;
            }
        }

        return false;
    }

    /**
     * {@inheritdoc}
     */
    public function addColumn(Table $table, Column $column)
    {
        $sql = sprintf(
            'ALTER TABLE %s ADD COLUMN %s %s',
            $this->quoteTableName($table->getName()),
            $this->quoteColumnName($column->getName()),
            $this->getColumnSqlDefinition($column)
        );

        $this->execute($sql);
    }

    /**
     * {@inheritdoc}
     */
    public function renameColumn($tableName, $columnName, $newColumnName)
    {
        $tmpTableName = 'tmp_' . $tableName;

        $rows = $this->fetchAll('select * from sqlite_master where `type` = \'table\'');

        $sql = '';
        foreach ($rows as $table) {
            if ($table['tbl_name'] === $tableName) {
                $sql = $table['sql'];
            }
        }

        $columns = $this->fetchAll(sprintf('pragma table_info(%s)', $this->quoteTableName($tableName)));
        $selectColumns = [];
        $writeColumns = [];
        foreach ($columns as $column) {
            $selectName = $column['name'];
            $writeName = ($selectName == $columnName)? $newColumnName : $selectName;
            $selectColumns[] = $this->quoteColumnName($selectName);
            $writeColumns[] = $this->quoteColumnName($writeName);
        }

        if (!in_array($this->quoteColumnName($columnName), $selectColumns)) {
            throw new \InvalidArgumentException(sprintf(
                'The specified column doesn\'t exist: ' . $columnName
            ));
        }

        $this->execute(sprintf('ALTER TABLE %s RENAME TO %s', $tableName, $tmpTableName));

        $sql = str_replace(
            $this->quoteColumnName($columnName),
            $this->quoteColumnName($newColumnName),
            $sql
        );
        $this->execute($sql);

        $sql = sprintf(
            'INSERT INTO %s(%s) SELECT %s FROM %s',
            $tableName,
            implode(', ', $writeColumns),
            implode(', ', $selectColumns),
            $tmpTableName
        );

        $this->execute($sql);

        $this->execute(sprintf('DROP TABLE %s', $this->quoteTableName($tmpTableName)));
    }

    /**
     * {@inheritdoc}
     */
    public function changeColumn($tableName, $columnName, Column $newColumn)
    {
        // TODO: DRY this up....
        $tmpTableName = 'tmp_' . $tableName;

        $rows = $this->fetchAll('select * from sqlite_master where `type` = \'table\'');

        $sql = '';
        foreach ($rows as $table) {
            if ($table['tbl_name'] === $tableName) {
                $sql = $table['sql'];
            }
        }

        $columns = $this->fetchAll(sprintf('pragma table_info(%s)', $this->quoteTableName($tableName)));
        $selectColumns = [];
        $writeColumns = [];
        foreach ($columns as $column) {
            $selectName = $column['name'];
            $writeName = ($selectName === $columnName)? $newColumn->getName() : $selectName;
            $selectColumns[] = $this->quoteColumnName($selectName);
            $writeColumns[] = $this->quoteColumnName($writeName);
        }

        if (!in_array($this->quoteColumnName($columnName), $selectColumns)) {
            throw new \InvalidArgumentException(sprintf(
                'The specified column doesn\'t exist: ' . $columnName
            ));
        }

        $this->execute(sprintf('ALTER TABLE %s RENAME TO %s', $tableName, $tmpTableName));

        $sql = preg_replace(
            sprintf("/%s(?:\/\*.*?\*\/|\([^)]+\)|'[^']*?'|[^,])+([,)])/", $this->quoteColumnName($columnName)),
            sprintf('%s %s$1', $this->quoteColumnName($newColumn->getName()), $this->getColumnSqlDefinition($newColumn)),
            $sql,
            1
        );

        $this->execute($sql);

        $sql = sprintf(
            'INSERT INTO %s(%s) SELECT %s FROM %s',
            $tableName,
            implode(', ', $writeColumns),
            implode(', ', $selectColumns),
            $tmpTableName
        );

        $this->execute($sql);
        $this->execute(sprintf('DROP TABLE %s', $this->quoteTableName($tmpTableName)));
    }

    /**
     * {@inheritdoc}
     */
    public function dropColumn($tableName, $columnName)
    {
        // TODO: DRY this up....
        $tmpTableName = 'tmp_' . $tableName;

        $rows = $this->fetchAll('select * from sqlite_master where `type` = \'table\'');

        $sql = '';
        foreach ($rows as $table) {
            if ($table['tbl_name'] === $tableName) {
                $sql = $table['sql'];
            }
        }

        $rows = $this->fetchAll(sprintf('pragma table_info(%s)', $this->quoteTableName($tableName)));
        $columns = [];
        $columnType = null;
        foreach ($rows as $row) {
            if ($row['name'] !== $columnName) {
                $columns[] = $row['name'];
            } else {
                $found = true;
                $columnType = $row['type'];
            }
        }

        if (!isset($found)) {
            throw new \InvalidArgumentException(sprintf(
                'The specified column doesn\'t exist: ' . $columnName
            ));
        }

        $this->execute(sprintf('ALTER TABLE %s RENAME TO %s', $tableName, $tmpTableName));

        $sql = preg_replace(
            sprintf("/%s\s%s.*(,\s(?!')|\)$)/U", preg_quote($this->quoteColumnName($columnName)), preg_quote($columnType)),
            "",
            $sql
        );

        if (substr($sql, -2) === ', ') {
            $sql = substr($sql, 0, -2) . ')';
        }

        $this->execute($sql);

        $sql = sprintf(
            'INSERT INTO %s(%s) SELECT %s FROM %s',
            $tableName,
            implode(', ', $columns),
            implode(', ', $columns),
            $tmpTableName
        );

        $this->execute($sql);
        $this->execute(sprintf('DROP TABLE %s', $this->quoteTableName($tmpTableName)));
    }

    /**
     * Get an array of indexes from a particular table.
     *
     * @param string $tableName Table Name
     * @return array
     */
    protected function getIndexes($tableName)
    {
        $indexes = [];
        $rows = $this->fetchAll(sprintf('pragma index_list(%s)', $tableName));

        foreach ($rows as $row) {
            $indexData = $this->fetchAll(sprintf('pragma index_info(%s)', $row['name']));
            if (!isset($indexes[$tableName])) {
                $indexes[$tableName] = ['index' => $row['name'], 'columns' => []];
            }
            foreach ($indexData as $indexItem) {
                $indexes[$tableName]['columns'][] = strtolower($indexItem['name']);
            }
        }

        return $indexes;
    }

    /**
     * {@inheritdoc}
     */
    public function hasIndex($tableName, $columns)
    {
        if (is_string($columns)) {
            $columns = [$columns]; // str to array
        }

        $columns = array_map('strtolower', $columns);
        $indexes = $this->getIndexes($tableName);

        foreach ($indexes as $index) {
            $a = array_diff($columns, $index['columns']);
            if (empty($a)) {
                return true;
            }
        }

        return false;
    }

    /**
     * {@inheritdoc}
     */
    public function hasIndexByName($tableName, $indexName)
    {
        $indexes = $this->getIndexes($tableName);

        foreach ($indexes as $index) {
            if ($indexName === $index['index']) {
                return true;
            }
        }

        return false;
    }

    /**
     * {@inheritdoc}
     */
    public function addIndex(Table $table, Index $index)
    {
        $indexColumnArray = [];
        foreach ($index->getColumns() as $column) {
            $indexColumnArray[] = sprintf('`%s` ASC', $column);
        }
        $indexColumns = implode(',', $indexColumnArray);
        $this->execute(
            sprintf(
                'CREATE %s ON %s (%s)',
                $this->getIndexSqlDefinition($table, $index),
                $this->quoteTableName($table->getName()),
                $indexColumns
            )
        );
    }

    /**
     * {@inheritdoc}
     */
    public function dropIndex($tableName, $columns)
    {
        if (is_string($columns)) {
            $columns = [$columns]; // str to array
        }

        $indexes = $this->getIndexes($tableName);
        $columns = array_map('strtolower', $columns);

        foreach ($indexes as $index) {
            $a = array_diff($columns, $index['columns']);
            if (empty($a)) {
                $this->execute(
                    sprintf(
                        'DROP INDEX %s',
                        $this->quoteColumnName($index['index'])
                    )
                );

                return;
            }
        }
    }

    /**
     * {@inheritdoc}
     */
    public function dropIndexByName($tableName, $indexName)
    {
        $indexes = $this->getIndexes($tableName);

        foreach ($indexes as $index) {
            if ($indexName === $index['index']) {
                $this->execute(
                    sprintf(
                        'DROP INDEX %s',
                        $this->quoteColumnName($indexName)
                    )
                );

                return;
            }
        }
    }

    /**
     * {@inheritdoc}
     */
    public function hasForeignKey($tableName, $columns, $constraint = null)
    {
        if (is_string($columns)) {
            $columns = [$columns]; // str to array
        }
        $foreignKeys = $this->getForeignKeys($tableName);

        $a = array_diff($columns, $foreignKeys);
        if (empty($a)) {
            return true;
        }

        return false;
    }

    /**
     * Get an array of foreign keys from a particular table.
     *
     * @param string $tableName Table Name
     * @return array
     */
    protected function getForeignKeys($tableName)
    {
        $foreignKeys = [];
        $rows = $this->fetchAll(
            "SELECT sql, tbl_name
              FROM (
                    SELECT sql sql, type type, tbl_name tbl_name, name name
                      FROM sqlite_master
                     UNION ALL
                    SELECT sql, type, tbl_name, name
                      FROM sqlite_temp_master
                   )
             WHERE type != 'meta'
               AND sql NOTNULL
               AND name NOT LIKE 'sqlite_%'
             ORDER BY substr(type, 2, 1), name"
        );

        foreach ($rows as $row) {
            if ($row['tbl_name'] === $tableName) {
                if (strpos($row['sql'], 'REFERENCES') !== false) {
                    preg_match_all("/\(`([^`]*)`\) REFERENCES/", $row['sql'], $matches);
                    foreach ($matches[1] as $match) {
                        $foreignKeys[] = $match;
                    }
                }
            }
        }

        return $foreignKeys;
    }

    /**
     * {@inheritdoc}
     */
    public function addForeignKey(Table $table, ForeignKey $foreignKey)
    {
        // TODO: DRY this up....
        $this->execute('pragma foreign_keys = ON');

        $tmpTableName = 'tmp_' . $table->getName();
        $rows = $this->fetchAll('select * from sqlite_master where `type` = \'table\'');

        $sql = '';
        foreach ($rows as $row) {
            if ($row['tbl_name'] === $table->getName()) {
                $sql = $row['sql'];
            }
        }

        $rows = $this->fetchAll(sprintf('pragma table_info(%s)', $this->quoteTableName($table->getName())));
        $columns = [];
        foreach ($rows as $column) {
            $columns[] = $this->quoteColumnName($column['name']);
        }

        $this->execute(sprintf('ALTER TABLE %s RENAME TO %s', $this->quoteTableName($table->getName()), $tmpTableName));

        $sql = substr($sql, 0, -1) . ',' . $this->getForeignKeySqlDefinition($foreignKey) . ')';
        $this->execute($sql);

        $sql = sprintf(
            'INSERT INTO %s(%s) SELECT %s FROM %s',
            $this->quoteTableName($table->getName()),
            implode(', ', $columns),
            implode(', ', $columns),
            $this->quoteTableName($tmpTableName)
        );

        $this->execute($sql);
        $this->execute(sprintf('DROP TABLE %s', $this->quoteTableName($tmpTableName)));
    }

    /**
     * {@inheritdoc}
     */
    public function dropForeignKey($tableName, $columns, $constraint = null)
    {
        // TODO: DRY this up....
        if (is_string($columns)) {
            $columns = [$columns]; // str to array
        }

        $tmpTableName = 'tmp_' . $tableName;

        $rows = $this->fetchAll('select * from sqlite_master where `type` = \'table\'');

        $sql = '';
        foreach ($rows as $table) {
            if ($table['tbl_name'] === $tableName) {
                $sql = $table['sql'];
            }
        }

        $rows = $this->fetchAll(sprintf('pragma table_info(%s)', $this->quoteTableName($tableName)));
        $replaceColumns = [];
        foreach ($rows as $row) {
            if (!in_array($row['name'], $columns)) {
                $replaceColumns[] = $row['name'];
            } else {
                $found = true;
            }
        }

        if (!isset($found)) {
            throw new \InvalidArgumentException(sprintf(
                'The specified column doesn\'t exist: '
            ));
        }

        $this->execute(sprintf('ALTER TABLE %s RENAME TO %s', $this->quoteTableName($tableName), $tmpTableName));

        foreach ($columns as $columnName) {
            $search = sprintf(
                "/,[^,]*\(%s(?:,`?(.*)`?)?\) REFERENCES[^,]*\([^\)]*\)[^,)]*/",
                $this->quoteColumnName($columnName)
            );
            $sql = preg_replace($search, '', $sql, 1);
        }

        $this->execute($sql);

        $sql = sprintf(
            'INSERT INTO %s(%s) SELECT %s FROM %s',
            $tableName,
            implode(', ', $columns),
            implode(', ', $columns),
            $tmpTableName
        );

        $this->execute($sql);
        $this->execute(sprintf('DROP TABLE %s', $this->quoteTableName($tmpTableName)));
    }

    /**
     * {@inheritdoc}
     */
    public function insert(Table $table, $row)
    {
        $sql = sprintf(
            "INSERT INTO %s ",
            $this->quoteTableName($table->getName())
        );

        $columns = array_keys($row);
        $sql .= "(" . implode(', ', array_map([$this, 'quoteColumnName'], $columns)) . ")";
        $sql .= " VALUES ";

        $sql .= "(" . implode(', ', array_map(function ($value) {
            if (is_numeric($value)) {
                return $value;
            }

            if ($value === null) {
                return 'null';
            }

                return $this->getConnection()->quote($value);
        }, $row)) . ")";

        $this->execute($sql);
    }

    /**
     * {@inheritdoc}
     */
    public function getSqlType($type, $limit = null)
    {
        switch ($type) {
            case static::PHINX_TYPE_STRING:
                return ['name' => 'varchar', 'limit' => 255];
            case static::PHINX_TYPE_CHAR:
                return ['name' => 'char', 'limit' => 255];
            case static::PHINX_TYPE_TEXT:
                return ['name' => 'text'];
            case static::PHINX_TYPE_INTEGER:
                return ['name' => 'integer'];
            case static::PHINX_TYPE_BIG_INTEGER:
                return ['name' => 'bigint'];
            case static::PHINX_TYPE_FLOAT:
                return ['name' => 'float'];
            case static::PHINX_TYPE_DECIMAL:
                return ['name' => 'decimal'];
            case static::PHINX_TYPE_DATETIME:
                return ['name' => 'datetime'];
            case static::PHINX_TYPE_TIMESTAMP:
                return ['name' => 'datetime'];
            case static::PHINX_TYPE_TIME:
                return ['name' => 'time'];
            case static::PHINX_TYPE_DATE:
                return ['name' => 'date'];
            case static::PHINX_TYPE_BLOB:
            case static::PHINX_TYPE_BINARY:
                return ['name' => 'blob'];
            case static::PHINX_TYPE_BOOLEAN:
                return ['name' => 'boolean'];
            case static::PHINX_TYPE_UUID:
                return ['name' => 'char', 'limit' => 36];
            case static::PHINX_TYPE_ENUM:
                return ['name' => 'enum'];
            // Geospatial database types
            // No specific data types exist in SQLite, instead all geospatial
            // functionality is handled in the client. See also: SpatiaLite.
            case static::PHINX_TYPE_GEOMETRY:
            case static::PHINX_TYPE_POLYGON:
                return ['name' => 'text'];
            case static::PHINX_TYPE_LINESTRING:
                return ['name' => 'varchar', 'limit' => 255];
            case static::PHINX_TYPE_POINT:
                return ['name' => 'float'];
            default:
                throw new \RuntimeException('The type: "' . $type . '" is not supported.');
        }
    }

    /**
     * Returns Phinx type by SQL type
     *
     * @param string $sqlTypeDef SQL type
     * @returns string Phinx type
     */
    public function getPhinxType($sqlTypeDef)
    {
        if (!preg_match('/^([\w]+)(\(([\d]+)*(,([\d]+))*\))*$/', $sqlTypeDef, $matches)) {
            throw new \RuntimeException('Column type ' . $sqlTypeDef . ' is not supported');
        } else {
            $limit = null;
            $precision = null;
            $type = $matches[1];
            if (count($matches) > 2) {
                $limit = $matches[3] ?: null;
            }
            if (count($matches) > 4) {
                $precision = $matches[5];
            }
            switch ($matches[1]) {
                case 'varchar':
                    $type = static::PHINX_TYPE_STRING;
                    if ($limit === 255) {
                        $limit = null;
                    }
                    break;
                case 'char':
                    $type = static::PHINX_TYPE_CHAR;
                    if ($limit === 255) {
                        $limit = null;
                    }
                    if ($limit === 36) {
                        $type = static::PHINX_TYPE_UUID;
                    }
                    break;
                case 'int':
                    $type = static::PHINX_TYPE_INTEGER;
                    if ($limit === 11) {
                        $limit = null;
                    }
                    break;
                case 'bigint':
                    if ($limit === 11) {
                        $limit = null;
                    }
                    $type = static::PHINX_TYPE_BIG_INTEGER;
                    break;
                case 'blob':
                    $type = static::PHINX_TYPE_BINARY;
                    break;
            }
            if ($type === 'tinyint') {
                if ($matches[3] === 1) {
                    $type = static::PHINX_TYPE_BOOLEAN;
                    $limit = null;
                }
            }

            $this->getSqlType($type);

            return [
                'name' => $type,
                'limit' => $limit,
                'precision' => $precision
            ];
        }
    }

    /**
     * {@inheritdoc}
     */
    public function createDatabase($name, $options = [])
    {
        touch($name . '.sqlite3');
    }

    /**
     * {@inheritdoc}
     */
    public function hasDatabase($name)
    {
        return is_file($name . '.sqlite3');
    }

    /**
     * {@inheritdoc}
     */
    public function dropDatabase($name)
    {
        if (file_exists($name . '.sqlite3')) {
            unlink($name . '.sqlite3');
        }
    }

    /**
     * Get the definition for a `DEFAULT` statement.
     *
     * @param  mixed $default
     * @return string
     */
    protected function getDefaultValueDefinition($default)
    {
        if (is_string($default) && 'CURRENT_TIMESTAMP' !== $default) {
            $default = $this->getConnection()->quote($default);
        } elseif (is_bool($default)) {
            $default = $this->castToBool($default);
        }

        return isset($default) ? ' DEFAULT ' . $default : '';
    }

    /**
     * Gets the SQLite Column Definition for a Column object.
     *
     * @param \Phinx\Db\Table\Column $column Column
     * @return string
     */
    protected function getColumnSqlDefinition(Column $column)
    {
        $sqlType = $this->getSqlType($column->getType());
        $def = '';
        $def .= strtoupper($sqlType['name']);
        if ($column->getPrecision() && $column->getScale()) {
            $def .= '(' . $column->getPrecision() . ',' . $column->getScale() . ')';
        }
        $limitable = in_array(strtoupper($sqlType['name']), $this->definitionsWithLimits);
        if (($column->getLimit() || isset($sqlType['limit'])) && $limitable) {
            $def .= '(' . ($column->getLimit() ?: $sqlType['limit']) . ')';
        }
        if (($values = $column->getValues()) && is_array($values)) {
            $def .= " CHECK({$column->getName()} IN ('" . implode("', '", $values) . "'))";
        }

        $default = $column->getDefault();

        $def .= ($column->isNull() || is_null($default)) ? ' NULL' : ' NOT NULL';
        $def .= $this->getDefaultValueDefinition($default);
        $def .= ($column->isIdentity()) ? ' PRIMARY KEY AUTOINCREMENT' : '';

        if ($column->getUpdate()) {
            $def .= ' ON UPDATE ' . $column->getUpdate();
        }

        $def .= $this->getCommentDefinition($column);

        return $def;
    }

    /**
     * Gets the comment Definition for a Column object.
     *
     * @param \Phinx\Db\Table\Column $column Column
     * @return string
     */
    protected function getCommentDefinition(Column $column)
    {
        if ($column->getComment()) {
            return ' /* ' . $column->getComment() . ' */ ';
        }

        return '';
    }

    /**
     * Gets the SQLite Index Definition for an Index object.
     *
     * @param \Phinx\Db\Table $table Table
     * @param \Phinx\Db\Table\Index $index Index
     * @return string
     */
    protected function getIndexSqlDefinition(Table $table, Index $index)
    {
        if ($index->getType() === Index::UNIQUE) {
            $def = 'UNIQUE INDEX';
        } else {
            $def = 'INDEX';
        }
        if (is_string($index->getName())) {
            $indexName = $index->getName();
        } else {
            $indexName = $table->getName() . '_';
            foreach ($index->getColumns() as $column) {
                $indexName .= $column . '_';
            }
            $indexName .= 'index';
        }
        $def .= ' `' . $indexName . '`';

        return $def;
    }

    /**
     * {@inheritdoc}
     */
    public function getColumnTypes()
    {
        return array_merge(parent::getColumnTypes(), ['enum']);
    }

    /**
     * Gets the SQLite Foreign Key Definition for an ForeignKey object.
     *
     * @param \Phinx\Db\Table\ForeignKey $foreignKey
     * @return string
     */
    protected function getForeignKeySqlDefinition(ForeignKey $foreignKey)
    {
        $def = '';
        if ($foreignKey->getConstraint()) {
            $def .= ' CONSTRAINT ' . $this->quoteColumnName($foreignKey->getConstraint());
        } else {
            $columnNames = [];
            foreach ($foreignKey->getColumns() as $column) {
                $columnNames[] = $this->quoteColumnName($column);
            }
            $def .= ' FOREIGN KEY (' . implode(',', $columnNames) . ')';
            $refColumnNames = [];
            foreach ($foreignKey->getReferencedColumns() as $column) {
                $refColumnNames[] = $this->quoteColumnName($column);
            }
            $def .= ' REFERENCES ' . $this->quoteTableName($foreignKey->getReferencedTable()->getName()) . ' (' . implode(',', $refColumnNames) . ')';
            if ($foreignKey->getOnDelete()) {
                $def .= ' ON DELETE ' . $foreignKey->getOnDelete();
            }
            if ($foreignKey->getOnUpdate()) {
                $def .= ' ON UPDATE ' . $foreignKey->getOnUpdate();
            }
        }

        return $def;
    }
}
