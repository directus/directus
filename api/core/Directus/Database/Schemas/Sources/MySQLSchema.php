<?php

/**
 * Directus – <http://getdirectus.com>
 *
 * @link      The canonical repository – <https://github.com/directus/directus>
 * @copyright Copyright 2006-2017 RANGER Studio, LLC – <http://rangerstudio.com>
 * @license   GNU General Public License (v3) – <http://www.gnu.org/copyleft/gpl.html>
 */

namespace Directus\Database\Schemas\Sources;

use Directus\Database\Object\Column;
use Directus\Exception\Exception;
use Directus\Util\ArrayUtils;
use Zend\Db\Sql\Expression;
use Zend\Db\Sql\Predicate\In;
use Zend\Db\Sql\Predicate\IsNotNull;
use Zend\Db\Sql\Predicate\NotIn;
use Zend\Db\Sql\Select;
use Zend\Db\Sql\Sql;
use Zend\Db\Sql\TableIdentifier;
use Zend\Db\Sql\Where;

/**
 * MySQLSchema.
 *
 * @author Olov Sundström <olov@rngr.org>
 * @author Daniel Bickett <daniel@rngr.org>
 * @author Jason El-Massih <jason@rngr.org>
 * @author Welling Guzmán <welling@rngr.org>
 */
class MySQLSchema extends AbstractSchema
{
    /**
     * @inheritDoc
     */
    public function getTables(array $params = [])
    {
        $select = new Select();
        $select->columns([
            'id' => 'TABLE_NAME',
            'table_name' => 'TABLE_NAME',
            'date_created' => 'CREATE_TIME',
            'comment' => 'TABLE_COMMENT',
            'row_count' => 'TABLE_ROWS'
        ]);
        $select->from(['ST' => new TableIdentifier('TABLES', 'INFORMATION_SCHEMA')]);
        $select->join(
            ['DT' => 'directus_tables'],
            'DT.table_name = ST.TABLE_NAME',
            [
                'hidden' => new Expression('IFNULL(hidden, 0)'),
                'single' => new Expression('IFNULL(single, 0)'),
                'default_status' => new Expression('IFNULL(single, NULL)'),
                'user_create_column',
                'user_update_column',
                'date_create_column',
                'date_update_column',
                'footer',
                'column_groupings',
                'filter_column_blacklist',
                'primary_column',
                'sort_column',
                'status_column',
                'display_template',
                'preview_url',
                'status_mapping'
            ],
            $select::JOIN_LEFT
        );

        $condition = [
            'ST.TABLE_SCHEMA' => $this->adapter->getCurrentSchema(),
            'ST.TABLE_TYPE' => 'BASE TABLE'
        ];

        $blacklisted = ArrayUtils::get($params, 'blacklist', null);
        if ($blacklisted) {
            $condition[] = new NotIn('ST.TABLE_NAME', $blacklisted);
        }

        $select->where($condition);

        $sql = new Sql($this->adapter);
        $statement = $sql->prepareStatementForSqlObject($select);
        $result = $statement->execute();

        return $result;
    }

    /**
     * @inheritDoc
     */
    public function getTablesName()
    {
        $select = new Select();

        $select->columns([
            'table_name' => 'TABLE_NAME'
        ]);
        $select->from(new TableIdentifier('TABLES', 'INFORMATION_SCHEMA'));
        $select->where([
            'TABLE_SCHEMA' => $this->adapter->getCurrentSchema(),
            'TABLE_TYPE' => 'BASE TABLE'
        ]);

        $sql = new Sql($this->adapter);
        $statement = $sql->prepareStatementForSqlObject($select);
        $result = $statement->execute();

        return $result;
    }

    /**
     * @inheritDoc
     */
    public function hasTable($tableName)
    {
        $result = $this->getTable($tableName);

        return $result->count() ? true : false;
    }

    /**
     * @inheritDoc
     */
    public function tableExists($tableName)
    {
        return $this->hasTable($tableName);
    }

    /**
     * @inheritDoc
     */
    public function someTableExists(array $tablesName)
    {
        $select = new Select();
        $select->columns(['TABLE_NAME']);
        $select->from(['T' => new TableIdentifier('TABLES', 'INFORMATION_SCHEMA')]);
        $select->where([
            new In('T.TABLE_NAME', $tablesName),
            'T.TABLE_SCHEMA' => $this->adapter->getCurrentSchema()
        ]);

        $sql = new Sql($this->adapter);
        $statement = $sql->prepareStatementForSqlObject($select);
        $result = $statement->execute();

        return $result->count() ? true : false;
    }

    /**
     * @inheritDoc
     */
    public function getTable($tableName)
    {
        $select = new Select();
        $select->columns([
            'id' => 'TABLE_NAME',
            'table_name' => 'TABLE_NAME',
            'date_created' => 'CREATE_TIME',
            'comment' => 'TABLE_COMMENT',
            'row_count' => 'TABLE_ROWS'
        ]);

        $select->from(['T' => new TableIdentifier('TABLES', 'INFORMATION_SCHEMA')]);
        $select->join(
            ['DT' => 'directus_tables'],
            'DT.table_name = T.TABLE_NAME',
            [
                'hidden' => new Expression('IFNULL(hidden, 0)'),
                'single' => new Expression('IFNULL(single, 0)'),
                'default_status' => new Expression('IFNULL(single, NULL)'),
                'user_create_column',
                'user_update_column',
                'date_create_column',
                'date_update_column',
                'footer',
                'column_groupings',
                'filter_column_blacklist',
                'primary_column',
                'sort_column',
                'status_column',
                'display_template',
                'preview_url',
                'status_mapping'
            ],
            $select::JOIN_LEFT
        );

        $select->where([
            'T.TABLE_SCHEMA' => $this->adapter->getCurrentSchema()
        ]);

        // @hotfix: This solve the problem fetching a table with capital letter
        $where = $select->where->nest();
        $where->equalTo('T.TABLE_NAME', $tableName);
        $where->OR;
        $where->equalTo('T.TABLE_NAME', $tableName);
        $where->unnest();

        $sql = new Sql($this->adapter);
        $statement = $sql->prepareStatementForSqlObject($select);
        $result = $statement->execute();

        return $result;
    }

    /**
     * @inheritDoc
     */
    public function getColumns($tableName, $params = null)
    {
        $columnName = isset($params['column_name']) ? $params['column_name'] : -1;

        $selectOne = new Select();
        $selectOne->quantifier($selectOne::QUANTIFIER_DISTINCT);
        $selectOne->columns([
            'id' => 'COLUMN_NAME',
            'table_name' => 'TABLE_NAME',
            'column_name' => 'COLUMN_NAME',
            'type' => new Expression('UCASE(C.DATA_TYPE)'),
            'key' => 'COLUMN_KEY',
            'extra' => 'EXTRA',
            'char_length' => 'CHARACTER_MAXIMUM_LENGTH',
            'precision' => 'NUMERIC_PRECISION',
            'scale' => 'NUMERIC_SCALE',
            'is_nullable' => 'IS_NULLABLE',
            'default_value' => 'COLUMN_DEFAULT',
            'comment' => new Expression('IFNULL(comment, COLUMN_COMMENT)'),
            'sort' => new Expression('IFNULL(sort, ORDINAL_POSITION)'),
            'column_type' => 'COLUMN_TYPE'
        ]);
        $selectOne->from(['C' => new TableIdentifier('COLUMNS', 'INFORMATION_SCHEMA')]);
        $selectOne->join(
            ['D' => 'directus_columns'],
            'C.COLUMN_NAME = D.column_name AND C.TABLE_NAME = D.table_name',
            [
                'ui',
                'hidden_input' => new Expression('IFNULL(hidden_input, 0)'),
                'relationship_type',
                'related_table',
                'junction_table',
                'junction_key_left',
                'junction_key_right',
                'required' => new Expression('IFNULL(D.required, 0)'),
                'options',
            ],
            $selectOne::JOIN_LEFT
        );

        $where = new Where();
        $where
            ->equalTo('C.TABLE_SCHEMA', $this->adapter->getCurrentSchema())
            ->equalTo('C.TABLE_NAME', $tableName)
            // @note: what does did do?
            ->nest()
            ->addPredicate(new \Zend\Db\Sql\Predicate\Expression('"'. $columnName . '" = -1'))
            ->OR
            ->equalTo('C.column_name', $columnName)
            ->unnest();

        if (isset($params['blacklist']) && count($params['blacklist']) > 0) {
            $where->addPredicate(new NotIn('C.COLUMN_NAME', $params['blacklist']));
        }

        $selectOne->where($where);

        $selectTwo = new Select();
        $selectTwo->columns([
            'id' => 'column_name',
            'table_name',
            'column_name',
            'type' => new Expression('UCASE(data_type)'),
            'key' => new Expression('NULL'),
            'extra' => new Expression('NULL'),
            'char_length' => new Expression('NULL'),
            'precision' => new Expression('NULL'),
            'scale' => new Expression('NULL'),
            'is_nullable' => new Expression('"NO"'),
            'default_value' => new Expression('NULL'),
            'comment',
            'sort',
            'column_type' => new Expression('NULL'),
            'ui',
            'hidden_input',
            'relationship_type',
            'related_table',
            'junction_table',
            'junction_key_left',
            'junction_key_right',
            'required' => new Expression('IFNULL(required, 0)'),
            'options',
        ]);
        $selectTwo->from('directus_columns');
        $where = new Where();
        $where
            ->equalTo('TABLE_NAME', $tableName)
            ->addPredicate(new In('data_type', ['alias', 'MANYTOMANY', 'ONETOMANY']))
            ->nest()
            // NOTE: is this actually necessary?
            ->addPredicate(new \Zend\Db\Sql\Predicate\Expression('"' . $columnName . '" = -1'))
            ->OR
            ->equalTo('column_name', $columnName)
            ->unnest()
            ->addPredicate(new IsNotNull('relationship_type'));

        if (isset($params['blacklist']) && count($params['blacklist']) > 0) {
            $where->addPredicate(new NotIn('COLUMN_NAME', $params['blacklist']));
        }

        $selectTwo->where($where);
        $selectTwo->order('sort');

        $selectOne->combine($selectTwo);

        $sql = new Sql($this->adapter);
        $statement = $sql->prepareStatementForSqlObject($selectOne);
        $result = $statement->execute();

        return $result;
    }

    /**
     * @inheritDoc
     */
    public function getAllColumns()
    {
        $selectOne = new Select();
        $selectOne->columns([
            'id' => 'COLUMN_NAME',
            'table_name' => 'TABLE_NAME',
            'column_name' => 'COLUMN_NAME',
            'sort' => new Expression('IFNULL(sort, ORDINAL_POSITION)'),
            'type' => new Expression('UCASE(C.DATA_TYPE)'),
            'key' => 'COLUMN_KEY',
            'extra' => 'EXTRA',
            'char_length' => 'CHARACTER_MAXIMUM_LENGTH',
            'precision' => 'NUMERIC_PRECISION',
            'scale' => 'NUMERIC_SCALE',
            'is_nullable' => 'IS_NULLABLE',
            'default_value' => 'COLUMN_DEFAULT',
            'comment' => new Expression('IFNULL(comment, COLUMN_COMMENT)'),
            'column_type' => 'COLUMN_TYPE'
        ]);

        $selectOne->from(['C' => new TableIdentifier('COLUMNS', 'INFORMATION_SCHEMA')]);
        $selectOne->join(
            ['D' => 'directus_columns'],
            'C.COLUMN_NAME = D.column_name AND C.TABLE_NAME = D.table_name',
            [
                'ui',
                'hidden_input' => new Expression('IFNULL(hidden_input, 0)'),
                'relationship_type',
                'related_table',
                'junction_table',
                'junction_key_left',
                'junction_key_right',
                'required' => new Expression('IFNULL(D.required, 0)'),
                'options',
            ],
            $selectOne::JOIN_LEFT
        );

        $selectOne->join(
            ['T' => new TableIdentifier('TABLES', 'INFORMATION_SCHEMA')],
            'C.TABLE_NAME = T.TABLE_NAME',
            ['table_name' => 'TABLE_NAME'],
            $selectOne::JOIN_LEFT
        );

        $selectOne->where([
            'C.TABLE_SCHEMA' => $this->adapter->getCurrentSchema(),
            'T.TABLE_SCHEMA' => $this->adapter->getCurrentSchema(),
            'T.TABLE_TYPE' => 'BASE TABLE'
        ]);

        $selectTwo = new Select();
        $selectTwo->columns([
            'id' => 'column_name',
            'table_name',
            'column_name',
            'sort',
            'type' => new Expression('UCASE(data_type)'),
            'key' => new Expression('NULL'),
            'extra' => new Expression('NULL'),
            'char_length' => new Expression('NULL'),
            'precision' => new Expression('NULL'),
            'scale' => new Expression('NULL'),
            'is_nullable' => new Expression('"NO"'),
            'default_value' => new Expression('NULL'),
            'comment',
            'column_type' => new Expression('NULL'),
            'ui',
            'hidden_input',
            'relationship_type',
            'related_table',
            'junction_table',
            'junction_key_left',
            'junction_key_right',
            'required' => new Expression('IFNULL(required, 0)'),
            'options',
            'table_name'
        ]);
        $selectTwo->from('directus_columns');

        $where = new Where();
        $where->addPredicate(new In('data_type', ['alias', 'MANYTOMANY', 'ONETOMANY']));
        $selectTwo->where($where);

        $selectOne->combine($selectTwo, $selectOne::COMBINE_UNION, 'ALL');
        $selectOne->order('T.table_name');

        $sql = new Sql($this->adapter);
        $statement = $sql->prepareStatementForSqlObject($selectOne);
        $result = $statement->execute();

        return $result;
    }

    /**
     * @inheritDoc
     */
    public function hasColumn($tableName, $columnName)
    {
        // TODO: Implement hasColumn() method.
    }

    /**
     * @inheritDoc
     */
    public function getColumn($tableName, $columnName)
    {
        return $this->getColumns($tableName, ['column_name' => $columnName])->current();
    }

    /**
     * @inheritDoc
     */
    public function hasPrimaryKey($tableName)
    {
        // TODO: Implement hasPrimaryKey() method.
    }

    /**
     * @inheritDoc
     */
    public function getPrimaryKey($tableName)
    {
        $select = new Select();
        $columnName = null;

        // @todo: make this part of loadSchema
        // without the need to use acl and create a infinite nested function call
        $select->columns([
            'column_name' => 'COLUMN_NAME'
        ]);
        $select->from(new TableIdentifier('COLUMNS', 'INFORMATION_SCHEMA'));
        $select->where([
            'TABLE_NAME' => $tableName,
            'TABLE_SCHEMA' => $this->adapter->getCurrentSchema(),
            'COLUMN_KEY' => 'PRI'
        ]);

        $sql = new Sql($this->adapter);
        $statement = $sql->prepareStatementForSqlObject($select);
        $result = $statement->execute();

        // @TODO: Primary key can be more than one.
        $column = $result->current();
        if ($column) {
            $columnName = $column['column_name'];
        }

        return $columnName;
    }

    /**
     * @inheritDoc
     */
    public function getFullSchema()
    {
        // TODO: Implement getFullSchema() method.
    }

    /**
     * @inheritDoc
     */
    public function getColumnUI($column)
    {
        // TODO: Implement getColumnUI() method.
    }

    /**
     * Add primary key to an existing column
     *
     * @param $table
     * @param $column
     *
     * @return \Zend\Db\Adapter\Driver\StatementInterface|\Zend\Db\ResultSet\ResultSet
     *
     * @throws Exception
     */
    public function addPrimaryKey($table, $column)
    {
        $columnData = $this->getColumn($table, $column);

        if (!$columnData) {
            // TODO: Better error message
            throw new Exception('Missing column');
        }

        $dataType = ArrayUtils::get($columnData, 'type');

        if (!$dataType) {
            // TODO: Better error message
            throw new Exception('Missing data type');
        }

        $queryFormat = 'ALTER TABLE `%s` ADD PRIMARY KEY(`%s`)';
        // NOTE: Make this work with strings
        if ($this->isNumericType($dataType)) {
            $queryFormat .= ', MODIFY COLUMN `%s` %s AUTO_INCREMENT';
        }

        $query = sprintf($queryFormat, $table, $column, $column, $dataType);
        $connection = $this->getConnection();

        return $connection->query($query, $connection::QUERY_MODE_EXECUTE);
    }

    /**
     * @inheritDoc
     */
    public function dropPrimaryKey($table, $column)
    {
        $columnData = $this->getColumn($table, $column);

        if (!$columnData) {
            // TODO: Better message
            throw new Exception('Missing column');
        }

        $dataType = ArrayUtils::get($columnData, 'type');

        if (!$dataType) {
            // TODO: Better message
            throw new Exception('Missing data type');
        }

        $queryFormat = 'ALTER TABLE `%s` CHANGE COLUMN `%s` `%s` %s NOT NULL, DROP PRIMARY KEY';
        $query = sprintf($queryFormat, $table, $column, $column, $dataType);
        $connection = $this->getConnection();

        return $connection->query($query, $connection::QUERY_MODE_EXECUTE);
    }

    /**
     * Cast string values to its database type.
     *
     * @param $data
     * @param $type
     * @param $length
     *
     * @return mixed
     */
    public function castValue($data, $type = null, $length = false)
    {
        $type = strtolower($type);

        switch ($type) {
            case 'blob':
            case 'mediumblob':
                // NOTE: Do we really need to encode the blob?
                $data = base64_encode($data);
                break;
            case 'year':
            case 'bigint':
            case 'smallint':
            case 'mediumint':
            case 'int':
            case 'long':
            case 'tinyint':
                $data = ($data === null) ? null : (int)$data;
                break;
            case 'float':
                $data = (float)$data;
                break;
            case 'date':
            case 'datetime':
                $format = 'Y-m-d';
                $zeroData = '0000-00-00';
                if ($type === 'datetime') {
                    $format .= ' H:i:s';
                    $zeroData .= ' 00:00:00';
                }

                if ($data === $zeroData) {
                    $data = null;
                }
                $datetime = \DateTime::createFromFormat($format, $data);
                $data = $datetime ? $datetime->format($format) : null;
                break;
            case 'time':
                // NOTE: Assuming this are all valid formatted data
                $data = !empty($data) ? $data : null;
                break;
            case 'char':
            case 'varchar':
            case 'text':
            case 'tinytext':
            case 'mediumtext':
            case 'longtext':
            case 'var_string':
                break;
        }

        return $data;
    }

    public function parseType($data, $type = null, $length = false)
    {
        return $this->castValue($data, $type, $length);
    }

    /**
     * @inheritdoc
     */
    public function getDecimalTypes()
    {
        return [
            'double',
            'decimal',
            'float'
        ];
    }

    /**
     * @inheritdoc
     */
    public function getIntegerTypes()
    {
        return [
            'year',
            'bigint',
            'smallint',
            'mediumint',
            'int',
            'long',
            'tinyint'
        ];
    }

    /**
     * @inheritdoc
     */
    public function getNumericTypes()
    {
        return array_merge($this->getDecimalTypes(), $this->getIntegerTypes());
    }

    /**
     * @inheritdoc
     */
    public function isDecimalType($type)
    {
        return $this->isType($type, $this->getDecimalTypes());
    }

    /**
     * @inheritdoc
     */
    public function isIntegerType($type)
    {
        return $this->isType($type, $this->getIntegerTypes());
    }

    /**
     * @inheritdoc
     */
    public function isNumericType($type)
    {
        return in_array(strtolower($type), $this->getNumericTypes());
    }

    /**
     * @inheritdoc
     */
    public function getStringTypes()
    {
        return [
            'char',
            'varchar',
            'text',
            'enum',
            'set',
            'tinytext',
            'text',
            'mediumtext',
            'longtext'
        ];
    }

    /**
     * @inheritdoc
     */
    public function isStringType($type)
    {
        return in_array(strtolower($type), $this->getStringTypes());
    }
}
