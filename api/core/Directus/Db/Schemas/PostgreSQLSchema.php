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
use Zend\Db\TableGateway\TableGateway;

class PostgreSQLSchema extends AbstractSchema
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
                'hidden' => new Expression('COALESCE(hidden, 0)'),
                'single' => new Expression('COALESCE(single, 0)'),
                'is_junction_table',
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
        // TODO: Implement hasTable() method.
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
                'hidden' => new Expression('COALESCE(hidden, 0)'),
                'single' => new Expression('COALESCE(single, 0)'),
                'is_junction_table',
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
            'id' => 'column_name',
            'column_name' => 'column_name',
            'type' => new Expression('upper(c.data_type)'),
            'char_length' => 'character_maximum_length',
            'is_nullable' => 'is_nullable',
            'default_value' => 'column_default',
            // @TODO: COMMENTS
            //
            //
            //
            //
            'comment' => new Expression("''"),//new Expression('COALESCE(comment, column_comment)'),
            'sort' => new Expression('COALESCE(sort, ordinal_position)'),
            'column_type' => 'column_type'
        ]);
        $selectOne->from(['c' => new TableIdentifier('columns', 'information_schema')]);
        $selectOne->join(
            ['D' => 'directus_columns'],
            'c.column_name = D.column_name AND c.table_name = D.table_name',
            [
                'ui',
                'system' => new Expression('COALESCE(system, 0)'),
                'master' => new Expression('COALESCE(master, 0)'),
                'hidden_list' => new Expression('COALESCE(hidden_list, 0)'),
                'hidden_input' => new Expression('COALESCE(hidden_input, 0)'),
                'relationship_type',
                'table_related',
                'junction_table',
                'junction_key_left',
                'junction_key_right',
                'required' => new Expression('COALESCE(D.required, 0)'),
            ],
            $selectOne::JOIN_LEFT
        );

        $where = new Where();
        $where
            ->equalTo('c.table_schema', $zendDb->getCurrentSchema())
            ->equalTo('c.table_name', $tableName)
            ->nest()
            ->addPredicate(new \Zend\Db\Sql\Predicate\Expression("'$columnName' = '-1'"))
            ->OR
            ->equalTo('c.column_name', $columnName)
            ->unnest();

        if (count($blacklist)) {
            $where->addPredicate(new NotIn('c.column_name', $blacklist));
        }

        $selectOne->where($where);

        $selectTwo = new Select();
        $selectTwo->columns([
            'id' => 'column_name',
            'column_name',
            'type' => new Expression('upper(data_type)'),
            'char_length' => new Expression('NULL'),
            'is_nullable' => new Expression("'NO'"),
            'default_value' => new Expression('NULL'),
            'comment',
            'sort',
            'column_type' => new Expression('NULL'),
            'ui',
            'system',
            'master',
            'hidden_list',
            'hidden_input',
            'relationship_type',
            'table_related',
            'junction_table',
            'junction_key_left',
            'junction_key_right',
            'required' => new Expression('COALESCE(required, 0)')
        ]);
        $selectTwo->from('directus_columns');
        $where = new Where();
        $where
            ->equalTo('table_name', $tableName)
            ->addPredicate(new In('data_type', ['alias', 'MANYTOMANY', 'ONETOMANY']))
            ->nest()
            ->addPredicate(new \Zend\Db\Sql\Predicate\Expression("'$columnName' = '-1'"))
            ->OR
            ->equalTo('column_name', $columnName)
            ->unnest()
            ->addPredicate(new IsNotNull('data_type'));

        if (count($blacklist)) {
            $where->addPredicate(new NotIn('column_name', $blacklist));
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
            'sort' => new Expression('COALESCE(sort, ORDINAL_POSITION)'),
            'type' => new Expression('UCASE(C.DATA_TYPE)'),
            'char_length' => 'CHARACTER_MAXIMUM_LENGTH',
            'is_nullable' => 'IS_NULLABLE',
            'default_value' => 'COLUMN_DEFAULT',
            'comment' => new Expression('COALESCE(comment, COLUMN_COMMENT)'),
            'column_type' => 'column_type',
            'column_key' => 'column_key'
        ]);

        $selectOne->from(['C' => new TableIdentifier('COLUMNS', 'INFORMATION_SCHEMA')]);
        $selectOne->join(
            ['D' => 'directus_columns'],
            'C.COLUMN_NAME = D.column_name AND C.TABLE_NAME = D.table_name',
            [
                'ui',
                'system' => new Expression('COALESCE(system, 0)'),
                'master' => new Expression('COALESCE(master, 0)'),
                'hidden_list' => new Expression('COALESCE(hidden_list, 0)'),
                'hidden_input' => new Expression('COALESCE(hidden_input, 0)'),
                'relationship_type',
                'table_related',
                'junction_table',
                'junction_key_left',
                'junction_key_right',
                'required' => new Expression('COALESCE(D.required, 0)'),
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
            'system',
            'master',
            'hidden_list',
            'hidden_input',
            'relationship_type',
            'table_related',
            'junction_table',
            'junction_key_left',
            'junction_key_right',
            'required' => new Expression('COALESCE(required, 0)'),
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
            'column_name'
        ]);
        $select->from(['ccu' => new TableIdentifier('constraint_column_usage', 'information_schema')]);
        $select->join(
            ['tc' => new TableIdentifier('table_constraints', 'information_schema')],
            'tc.table_schema = ccu.table_schema AND tc.table_name = ccu.table_name',
            []
        );
        $select->join(
            ['c' => new TableIdentifier('columns', 'information_schema')],
            'ccu.table_name = c.table_name AND ccu.column_name = c.column_name',
            []
        );
        $select->where([
            'tc.table_name' => $tableName,
            'tc.table_schema' => $this->adapter->getCurrentSchema(),
            'tc.constraint_type' => 'PRIMARY KEY'
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

}
