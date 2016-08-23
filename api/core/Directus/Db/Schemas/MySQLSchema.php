<?php

namespace Directus\Db\Schemas;


use Directus\Bootstrap;
use Directus\Db\SchemaManager;
use Directus\Db\TableGateway\DirectusPreferencesTableGateway;
use Zend\Db\Sql\Expression;
use Zend\Db\Sql\Predicate\In;
use Zend\Db\Sql\Predicate\IsNotNull;
use Zend\Db\Sql\Predicate\NotIn;
use Zend\Db\Sql\Select;
use Zend\Db\Sql\Sql;
use Zend\Db\Sql\TableIdentifier;
use Zend\Db\Sql\Where;

class MySQLSchema extends AbstractSchema
{
    /**
     * @inheritDoc
     */
    public function getTables()
    {
        $zendDb = Bootstrap::get('zendDb');
        $config = Bootstrap::get('config');

        $blacklist = [];
        if (array_key_exists('tableBlacklist', $config)) {
            $blacklist = $config['tableBlacklist'];
        }

        $select = new Select();
        $select->columns([
            'id' => 'TABLE_NAME',
            'table_name' => 'TABLE_NAME',
            'date_created' => 'CREATE_TIME',
            'comment' => 'TABLE_COMMENT',
            'count' => 'TABLE_ROWS'
        ]);
        $select->from(['ST' => new TableIdentifier('TABLES', 'INFORMATION_SCHEMA')]);
        $select->join(
            ['DT' => 'directus_tables'],
            'DT.table_name = ST.TABLE_NAME',
            [
                'hidden' => new Expression('IFNULL(hidden, 0)'),
                'single' => new Expression('IFNULL(single, 0)'),
                'user_create_column',
                'user_update_column',
                'date_create_column',
                'date_update_column',
                'footer',
                'list_view',
                'column_groupings',
                'filter_column_blacklist',
                'primary_column'
            ],
            $select::JOIN_LEFT
        );

        $ignoredTables = SchemaManager::getDirectusTables(DirectusPreferencesTableGateway::$IGNORED_TABLES);
        $select->where([
            'ST.TABLE_SCHEMA' => $zendDb->getCurrentSchema(),
            'ST.TABLE_TYPE' => 'BASE TABLE',
            new NotIn('ST.TABLE_NAME', array_merge($ignoredTables, (array)$blacklist)),
        ]);

        $sql = new Sql($zendDb);
        $statement = $sql->prepareStatementForSqlObject($select);
        $result = $statement->execute();

        return iterator_to_array($result);
    }

    /**
     * @inheritDoc
     */
    public function getTablesName()
    {
        $zendDb = Bootstrap::get('zendDb');
        $select = new Select();

        $select->columns([
            'table_name' => 'TABLE_NAME'
        ]);
        $select->from(new TableIdentifier('TABLES', 'INFORMATION_SCHEMA'));
        $select->where([
            'TABLE_SCHEMA' => $zendDb->getCurrentSchema(),
            'TABLE_TYPE' => 'BASE TABLE'
        ]);

        $sql = new Sql($zendDb);
        $statement = $sql->prepareStatementForSqlObject($select);
        $rows = iterator_to_array($statement->execute());

        $tables = [];
        foreach($rows as $row) {
            $tables[] = $row['table_name'];
        }

        return $tables;
    }

    /**
     * @inheritDoc
     */
    public function hasTable($tableName)
    {
        return $this->getTable($tableName) ? true : false;
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

        return $result->count();
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
            'count' => 'TABLE_ROWS'
        ]);

        $select->from(['T' => new TableIdentifier('TABLES', 'INFORMATION_SCHEMA')]);
        $select->join(
            ['DT' => 'directus_tables'],
            'DT.table_name = T.TABLE_NAME',
            [
                'hidden' => new Expression('IFNULL(hidden, 0)'),
                'single' => new Expression('IFNULL(single, 0)'),
                'user_create_column',
                'user_update_column',
                'date_create_column',
                'date_update_column',
                'footer',
            ],
            $select::JOIN_LEFT
        );

        $select->where([
            'T.TABLE_NAME' => $tableName,
            'T.TABLE_SCHEMA' => $this->adapter->getCurrentSchema()
        ]);

        $sql = new Sql($this->adapter);
        $statement = $sql->prepareStatementForSqlObject($select);
        $result = $statement->execute();

        return $result->current();
    }

    /**
     * @inheritDoc
     */
    public function getColumns($tableName, $params = null)
    {
        $zendDb = Bootstrap::get('zendDb');
        $acl = Bootstrap::get('acl');

        $blacklist = $readFieldBlacklist = $acl->getTablePrivilegeList($tableName, $acl::FIELD_READ_BLACKLIST);
        $columnName = isset($params['column_name']) ? $params['column_name'] : -1;

        $selectOne = new Select();
        $selectOne->quantifier($selectOne::QUANTIFIER_DISTINCT);
        $selectOne->columns([
            'id' => 'COLUMN_NAME',
            'column_name' => 'COLUMN_NAME',
            'type' => new Expression('UCASE(C.DATA_TYPE)'),
            'char_length' => 'CHARACTER_MAXIMUM_LENGTH',
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
                'hidden_list' => new Expression('IFNULL(hidden_list, 0)'),
                'hidden_input' => new Expression('IFNULL(hidden_input, 0)'),
                'relationship_type',
                'related_table',
                'junction_table',
                'junction_key_left',
                'junction_key_right',
                'required' => new Expression('IFNULL(D.required, 0)'),
            ],
            $selectOne::JOIN_LEFT
        );

        $where = new Where();
        $where
            ->equalTo('C.TABLE_SCHEMA', $zendDb->getCurrentSchema())
            ->equalTo('C.TABLE_NAME', $tableName)
            ->nest()
            ->addPredicate(new \Zend\Db\Sql\Predicate\Expression("'$columnName' = '-1'"))
            ->OR
            ->equalTo('C.column_name', $columnName)
            ->unnest();

        if (count($blacklist)) {
            $where->addPredicate(new NotIn('C.COLUMN_NAME', $blacklist));
        }

        $selectOne->where($where);

        $selectTwo = new Select();
        $selectTwo->columns([
            'id' => 'column_name',
            'column_name',
            'type' => new Expression('UCASE(data_type)'),
            'char_length' => new Expression('NULL'),
            'is_nullable' => new Expression("'NO'"),
            'default_value' => new Expression('NULL'),
            'comment',
            'sort',
            'column_type' => new Expression('NULL'),
            'ui',
            'hidden_list',
            'hidden_input',
            'relationship_type',
            'related_table',
            'junction_table',
            'junction_key_left',
            'junction_key_right',
            'required' => new Expression('IFNULL(required, 0)')
        ]);
        $selectTwo->from('directus_columns');
        $where = new Where();
        $where
            ->equalTo('TABLE_NAME', $tableName)
            ->addPredicate(new In('data_type', ['alias', 'MANYTOMANY', 'ONETOMANY']))
            ->nest()
            ->addPredicate(new \Zend\Db\Sql\Predicate\Expression("'$columnName' = '-1'"))
            ->OR
            ->equalTo('column_name', $columnName)
            ->unnest()
            ->addPredicate(new IsNotNull('relationship_type'));

        if (count($blacklist)) {
            $where->addPredicate(new NotIn('COLUMN_NAME', $blacklist));
        }

        $selectTwo->where($where);
        $selectTwo->order('sort');

        $selectOne->combine($selectTwo);

        $sql = new Sql($zendDb);
        $statement = $sql->prepareStatementForSqlObject($selectOne);
        $result = $statement->execute();

        return iterator_to_array($result);
    }

    public function getAllColumns()
    {
        $selectOne = new Select();
        $selectOne->columns([
            'column_name' => 'COLUMN_NAME',
            'sort' => new Expression('IFNULL(sort, ORDINAL_POSITION)'),
            'type' => new Expression('UCASE(C.DATA_TYPE)'),
            'char_length' => 'CHARACTER_MAXIMUM_LENGTH',
            'is_nullable' => 'IS_NULLABLE',
            'default_value' => 'COLUMN_DEFAULT',
            'comment' => new Expression('IFNULL(comment, COLUMN_COMMENT)'),
            'column_type' => 'COLUMN_TYPE',
            'column_key' => 'COLUMN_KEY'
        ]);

        $selectOne->from(['C' => new TableIdentifier('COLUMNS', 'INFORMATION_SCHEMA')]);
        $selectOne->join(
            ['D' => 'directus_columns'],
            'C.COLUMN_NAME = D.column_name AND C.TABLE_NAME = D.table_name',
            [
                'ui',
                'hidden_list' => new Expression('IFNULL(hidden_list, 0)'),
                'hidden_input' => new Expression('IFNULL(hidden_input, 0)'),
                'relationship_type',
                'related_table',
                'junction_table',
                'junction_key_left',
                'junction_key_right',
                'required' => new Expression('IFNULL(D.required, 0)'),
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
            'column_name',
            'sort',
            'type' => new Expression('UCASE(data_type)'),
            'char_length' => new Expression('NULL'),
            'is_nullable' => new Expression("'NO'"),
            'default_value' => new Expression('NULL'),
            'comment',
            'column_type' => new Expression('NULL'),
            'column_key' => new Expression('NULL'),
            'ui',
            'hidden_list',
            'hidden_input',
            'relationship_type',
            'related_table',
            'junction_table',
            'junction_key_left',
            'junction_key_right',
            'required' => new Expression('IFNULL(required, 0)'),
            'table_name'
        ]);
        $selectTwo->from('directus_columns');

        $where = new Where();
        $where->addPredicate(new In('data_type', ['alias', 'MANYTOMANY', 'ONETOMANY']));
        $selectTwo->where($where);

        $selectOne->combine($selectTwo, $selectOne::COMBINE_UNION, 'ALL');
        $selectOne->order('table_name');

        $sql = new Sql($this->adapter);
        $statement = $sql->prepareStatementForSqlObject($selectOne);

        return iterator_to_array($statement->execute());
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
        // TODO: Implement getColumn() method.
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
    public function getUIOptions($tableName, $columnName)
    {
        // TODO: Implement getUIOptions() method.
    }

    /**
     * @inheritDoc
     */
    public function getColumnUI($column)
    {
        // TODO: Implement getColumnUI() method.
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
    public function parseType($data, $type = null, $length = false)
    {
        $type = strtolower($type);

        switch ($type) {
            case null:
                break;
            case 'blob':
            case 'mediumblob':
                return base64_encode($data);
            case 'year':
            case 'bigint':
            case 'smallint':
            case 'mediumint':
            case 'int':
            case 'long':
            case 'tinyint':
                return ($data === null) ? null : (int) $data;
            case 'float':
                return (float) $data;
            case 'date':
            case 'datetime':
                $nullDate = empty($data) || ("0000-00-00 00:00:00" == $data) || ('0000-00-00' === $data);
                if ($nullDate) {
                    return null;
                }
                $date = new \DateTime($data);
                $formatted = $date->format('Y-m-d H:i:s');
                return $formatted;
            case 'time':
                return !empty($data) ? $data : null;
            case 'char':
            case 'varchar':
            case 'text':
            case 'tinytext':
            case 'mediumtext':
            case 'longtext':
            case 'var_string':
                return $data;
        }
        return $data;
    }
}
