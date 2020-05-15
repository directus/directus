<?php

namespace Directus\Database\Schema\Sources;

use Directus\Bootstrap;
use Directus\Database\Schema\SchemaManager;
use Directus\Util\ArrayUtils;
use Zend\Db\Metadata\Source\SqliteMetadata;
use Zend\Db\Sql\Expression;
use Zend\Db\Sql\Predicate\In;
use Zend\Db\Sql\Predicate\NotIn;
use Zend\Db\Sql\Select;
use Zend\Db\Sql\Sql;
use Zend\Db\Sql\Where;

class SQLiteSchema extends AbstractSchema
{
    /**
     * @var \Zend\Db\Metadata\Source\SqliteMetadata
     */
    protected $metadata;

    /**
     * @inheritDoc
     */
    public function __construct($adapter)
    {
        parent::__construct($adapter);

        $this->metadata = new SqliteMetadata($adapter);
    }

    /**
     * @inheritDoc
     */
    public function getTables()
    {
        $tablesObject = $this->metadata->getTables();
        $directusTablesInfo = $this->getDirectusTablesInfo();

        return $this->formatTablesFromInfo($tablesObject, $directusTablesInfo);
    }

    protected function getDirectusTablesInfo()
    {
        $config = Bootstrap::get('config');

        $blacklist = [];
        if ($config->has('tableBlacklist')) {
            $blacklist = $config->get('tableBlacklist');
        }

        $select = new Select();
        $select->columns([
            'table_name',
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
        ]);
        $select->from('directus_tables');

        $skipTables = array_merge(SchemaManager::getDirectusTables(), (array)$blacklist);
        $select->where([
            new NotIn('table_name', $skipTables),
        ]);

        $sql = new Sql($this->adapter);
        $statement = $sql->prepareStatementForSqlObject($select);
        $result = $statement->execute();

        return iterator_to_array($result);
    }

    protected function formatTablesFromInfo($tablesObject, $directusTablesInfo)
    {
        $tables = [];
        foreach ($tablesObject as $tableObject) {
            $directusTableInfo = [];
            foreach ($directusTablesInfo as $index => $table) {
                if ($table['table_name'] == $tableObject->getName()) {
                    $directusTableInfo = $table;
                    unset($directusTablesInfo[$index]);
                }
            }

            $tables[] = $this->formatTableFromInfo($tableObject, $directusTableInfo);
        }

        return $tables;
    }

    protected function formatTableFromInfo($tableObject, $directusTableInfo)
    {
        return [
            'id' => $tableObject->getName(),
            'table_name' => $tableObject->getName(),
            'date_created' => null,
            'comment' => '',
            'count' => null,
            'hidden' => ArrayUtils::get($directusTableInfo, 'hidden', 0),
            'single' => ArrayUtils::get($directusTableInfo, 'single', 0),
            'user_create_column' => ArrayUtils::get($directusTableInfo, 'user_create_column', null),
            'user_update_column' => ArrayUtils::get($directusTableInfo, 'user_update_column', null),
            'date_create_column' => ArrayUtils::get($directusTableInfo, 'date_create_column', null),
            'date_update_column' => ArrayUtils::get($directusTableInfo, 'date_update_column', null),
            'footer' => ArrayUtils::get($directusTableInfo, 'footer', 0),
            'list_view' => ArrayUtils::get($directusTableInfo, 'list_view', null),
            'column_groupings' => ArrayUtils::get($directusTableInfo, 'column_groupings', null),
            'filter_column_blacklist' => ArrayUtils::get($directusTableInfo, 'filter_column_blacklist', null),
            'primary_column' => ArrayUtils::get($directusTableInfo, 'primary_column', null)
        ];
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
    public function tableExists($tableName)
    {
        return $this->hasTable($tableName);
    }

    /**
     * @inheritDoc
     */
    public function someTableExists(array $tablesName)
    {
        return false;
    }

    /**
     * @inheritDoc
     */
    public function getTable($tableName)
    {
        $tablesObject = $this->metadata->getTable($tableName);
        $directusTablesInfo = $this->getDirectusTableInfo($tableName);
        if (!$directusTablesInfo) {
            $directusTablesInfo = [];
        }

        return $this->formatTableFromInfo($tablesObject, $directusTablesInfo);
    }

    public function getDirectusTableInfo($tableName)
    {
        $select = new Select();
        $select->columns([
            'table_name',
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
        ]);
        $select->from('directus_tables');

        $select->where([
            'table_name' => $tableName
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
        $columnsInfo = $this->metadata->getColumns($tableName);
        // OLD FILTER
        // @TODO this should be a job for the SchemaManager
        $columnName = isset($params['column_name']) ? $params['column_name'] : -1;
        if ($columnName != -1) {
            foreach ($columnsInfo as $index => $column) {
                if ($column->getName() == $columnName) {
                    unset($columnsInfo[$index]);
                    break;
                }
            }
        }

        $directusColumns = $this->getDirectusColumnsInfo($tableName, $params);
        $columns = $this->formatColumnsFromInfo($columnsInfo, $directusColumns);

        return $columns;
    }

    public function getAllColumns()
    {
        $allColumns = [];
        $allTables = $this->getTables();

        foreach ($allTables as $table) {
            $columns = $this->getColumns($table['table_name']);
            foreach ($columns as $index => $column) {
                $columns[$index]['table_name'] = $table['table_name'];
            }

            $allColumns = array_merge($allColumns, $columns);
        }

        return $allColumns;
    }

    protected function formatColumnsFromInfo($columnsInfo, $directusColumnsInfo)
    {
        $columns = [];

        foreach ($columnsInfo as $columnInfo) {
            $directusColumnInfo = [];
            foreach ($directusColumnsInfo as $index => $column) {
                if ($column['column_name'] == $columnInfo->getName()) {
                    $directusColumnInfo = $column;
                    unset($directusColumnsInfo[$index]);
                }
            }

            $columns[] = $this->formatColumnFromInfo($columnInfo, $directusColumnInfo);
        }

        return $columns;
    }

    protected function formatColumnFromInfo($columnInfo, $directusColumnInfo)
    {
        $matches = [];
        preg_match('#^([a-zA-Z]+)(\(.*\)){0,1}$#', $columnInfo->getDataType(), $matches);

        $dataType = strtoupper($matches[1]);

        return [
            'id' => $columnInfo->getName(),
            'column_name' => $columnInfo->getName(),
            'type' => $dataType,
            'char_length' => $columnInfo->getCharacterMaximumLength(),
            'is_nullable' => $columnInfo->getIsNullable() ? 'YES' : 'NO',
            'default_value' => $columnInfo->getColumnDefault() == 'NULL' ? NULL : $columnInfo->getColumnDefault(),
            'comment' => '',
            'sort' => $columnInfo->getOrdinalPosition(),
            'column_type' => $columnInfo->getDataType(),
            'ui' => ArrayUtils::get($directusColumnInfo, 'ui', null),
            'hidden_input' => ArrayUtils::get($directusColumnInfo, 'hidden_input', 0),
            'relationship_type' => ArrayUtils::get($directusColumnInfo, 'relationship_type', null),
            'related_table' => ArrayUtils::get($directusColumnInfo, 'related_table', null),
            'junction_table' => ArrayUtils::get($directusColumnInfo, 'junction_table', null),
            'junction_key_left' => ArrayUtils::get($directusColumnInfo, 'junction_key_left', null),
            'junction_key_right' => ArrayUtils::get($directusColumnInfo, 'junction_key_right', null),
            'required' => ArrayUtils::get($directusColumnInfo, 'required', 0),
        ];
    }

    /**
     * Get all the columns information stored on Directus Columns table
     *
     * @param $tableName
     * @param $params
     *
     * @return array
     */
    protected function getDirectusColumnsInfo($tableName, $params = null)
    {
        $acl = Bootstrap::get('acl');

        $blacklist = $readFieldBlacklist = $acl->getTablePrivilegeList($tableName, $acl::FIELD_READ_BLACKLIST);
        $columnName = isset($params['column_name']) ? $params['column_name'] : -1;

        $select = new Select();
        $select->columns([
            'id' => 'column_name',
            'column_name',
            'type' => new Expression('upper(data_type)'),
            'char_length' => new Expression('NULL'),
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
            'required' => new Expression('IFNULL(required, 0)')
        ]);
        $select->from('directus_columns');
        $where = new Where();
        $where
            ->equalTo('TABLE_NAME', $tableName)
            ->addPredicate(new In('data_type', ['alias', 'MANYTOMANY', 'ONETOMANY']));
        // ->nest()
        // ->addPredicate(new \Zend\Db\Sql\Predicate\Expression("'$columnName' = '-1'"))
        // ->OR
        // ->equalTo('column_name', $columnName)
        // ->unnest()
        // ->addPredicate(new IsNotNull('data_type'));

        if ($columnName != -1) {
            $where->equalTo('column_name', $columnName);
        }

        if (count($blacklist)) {
            $where->addPredicate(new NotIn('COLUMN_NAME', $blacklist));
        }

        $select->where($where);
        $select->order('sort');

        $sql = new Sql($this->adapter);
        $statement = $sql->prepareStatementForSqlObject($select);
        // $query = $sql->getSqlStringForSqlObject($select, $this->adapter->getPlatform());
        // echo $query;
        $result = $statement->execute();
        $columns = iterator_to_array($result);

        return $columns;
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
        $columnName = null;

        $constraints = $this->metadata->getConstraints($tableName);
        foreach ($constraints as $constraint) {
            if ($constraint->isPrimaryKey()) {
                // @TODO: Directus should handle multiple columns
                $columns = $constraint->getColumns();
                $columnName = array_shift($columns);
                break;
            }
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

    public function parseType($data, $type = null)
    {
        return $data;
    }
}
