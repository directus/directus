<?php

namespace Directus\Database\Schema\Sources;

use function Directus\compact_sort_to_array;
use Directus\Database\Schema\DataTypes;
use Directus\Exception\Exception;
use function Directus\get_directus_setting;
use Directus\Util\ArrayUtils;
use Directus\Util\StringUtils;
use Zend\Db\Sql\Expression;
use Zend\Db\Sql\Predicate\In;
use Zend\Db\Sql\Predicate\IsNull;
use Zend\Db\Sql\Select;
use Zend\Db\Sql\Sql;
use Zend\Db\Sql\TableIdentifier;
use Zend\Db\Sql\Where;

class MySQLSchema extends AbstractSchema
{
    protected $isMariaDb = null;

    /**
     * Database connection adapter
     *
     * @var \Zend\DB\Adapter\Adapter
     */
    protected $adapter;

    /**
     * AbstractSchema constructor.
     *
     * @param $adapter
     */
    public function __construct($adapter)
    {
        $this->adapter = $adapter;
    }

    /**
     * Get the schema name
     *
     * @return string
     */
    public function getSchemaName()
    {
        return $this->adapter->getCurrentSchema();
    }

    /**
     * @return \Zend\DB\Adapter\Adapter
     */
    public function getConnection()
    {
        return $this->adapter;
    }

    /**
     * @inheritDoc
     */
    public function getCollections(array $params = [])
    {
        $select = new Select();
        $select->columns([
            'collection' => 'TABLE_NAME',
            'date_created' => 'CREATE_TIME',
            'collation' => 'TABLE_COLLATION',
            'schema_comment' => 'TABLE_COMMENT'
        ]);
        $select->from(['ST' => new TableIdentifier('TABLES', 'INFORMATION_SCHEMA')]);
        $select->join(
            ['DT' => 'directus_collections'],
            'DT.collection = ST.TABLE_NAME',
            [
                'note',
                'hidden' => new Expression('IFNULL(`DT`.`hidden`, 0)'),
                'single' => new Expression('IFNULL(`DT`.`single`, 0)'),
                'managed' => new Expression('IF(ISNULL(`DT`.`collection`), 0, `DT`.`managed`)')
            ],
            $select::JOIN_LEFT
        );

        $condition = [
            'ST.TABLE_SCHEMA' => $this->adapter->getCurrentSchema(),
            'ST.TABLE_TYPE' => 'BASE TABLE'
        ];

        $select->where($condition);
        if (isset($params['name'])) {
            $tableName = $params['name'];
            // hotfix: This solve the problem fetching a table with capital letter
            $where = $select->where->nest();
            $where->equalTo('ST.TABLE_NAME', $tableName);
            $where->OR;
            $where->equalTo('ST.TABLE_NAME', $tableName);
            $where->unnest();
        }

        $sql = new Sql($this->adapter);
        $statement = $sql->prepareStatementForSqlObject($select);
        $result = $statement->execute();

        return $result;
    }

    /**
     * @inheritDoc
     */
    public function collectionExists($collectionsName)
    {
        if (is_string($collectionsName)) {
            $collectionsName = [$collectionsName];
        }

        $select = new Select();
        $select->columns(['TABLE_NAME']);
        $select->from(['T' => new TableIdentifier('TABLES', 'INFORMATION_SCHEMA')]);
        $select->where([
            new In('T.TABLE_NAME', $collectionsName),
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
    public function getCollection($collectionName)
    {
        return $this->getCollections(['name' => $collectionName]);
    }

    /**
     * @inheritDoc
     */
    public function getFields($tableName, array $params = [])
    {
        return $this->getAllFields(array_merge($params, ['collection' => $tableName]));
    }

    /**
     * @inheritDoc
     */
    public function getAllFields(array $params = [])
    {
        $selectOne = new Select();
        // $selectOne->quantifier($selectOne::QUANTIFIER_DISTINCT);
        $selectOne->columns([
            'collection' => 'TABLE_NAME',
            'field' => 'COLUMN_NAME',
            'datatype' => new Expression('UCASE(SF.DATA_TYPE)'),
            'key' => 'COLUMN_KEY',
            'unique' => new Expression('IF(SF.COLUMN_KEY="UNI",1,0)'),
            'primary_key' => new Expression('IF(SF.COLUMN_KEY="PRI",1,0)'),
            'auto_increment' => new Expression('IF(SF.EXTRA="auto_increment",1,0)'),
            'extra' => 'EXTRA',
            'char_length' => 'CHARACTER_MAXIMUM_LENGTH',
            'precision' => 'NUMERIC_PRECISION',
            'scale' => 'NUMERIC_SCALE',
            'nullable' => new Expression('IF(SF.IS_NULLABLE="YES",1,0)'),
            'default_value' => 'COLUMN_DEFAULT',
            'note' => new Expression('IFNULL(DF.note, SF.COLUMN_COMMENT)'),
            'column_type' => 'COLUMN_TYPE',
            'signed' => new Expression('IF(LOCATE(" unsigned", SF.COLUMN_TYPE)>0,0,1)'),
        ]);

        $selectOne->from(['SF' => new TableIdentifier('COLUMNS', 'INFORMATION_SCHEMA')]);
        $selectOne->join(
            ['DF' => 'directus_fields'],
            'SF.COLUMN_NAME = DF.field AND SF.TABLE_NAME = DF.collection',
            [
                'id' => new Expression('IF(ISNULL(DF.id), NULL, DF.id)'),
                'type',
                'sort',
                'managed' =>  new Expression('IF(ISNULL(DF.id),0,1)'),
                'interface',
                'hidden_detail' => new Expression('IF(DF.hidden_detail=1,1,0)'),
                'hidden_browse' => new Expression('IF(DF.hidden_browse=1,1,0)'),
                'required' => new Expression('IF(SF.IS_NULLABLE="NO",1,0)'),
                'options',
                'locked',
                'translation',
                'readonly',
                'width',
                'validation',
                'group',
            ],
            $selectOne::JOIN_LEFT
        );

        $selectOne->where([
            'SF.TABLE_SCHEMA' => $this->adapter->getCurrentSchema(),
            // 'T.TABLE_TYPE' => 'BASE TABLE'
        ]);

        if (isset($params['collection'])) {
            $where = $selectOne->where->nest();
            $where->equalTo(new Expression('BINARY SF.TABLE_NAME'), $params['collection']);
            $where->unnest();
        }

        if (isset($params['field'])) {
            $where = $selectOne->where->nest();
            $where->equalTo('DF.field', $params['field']);
            $where->or;
            $where->equalTo('SF.COLUMN_NAME', $params['field']);
            $where->unnest();
        }

        $selectOne->order(['collection' => 'ASC', 'SF.ORDINAL_POSITION' => 'ASC']);

        $selectTwo = new Select();
        $selectTwo->columns([
            'collection',
            'field',
            'datatype' => new Expression('NULL'),
            'key' => new Expression('NULL'),
            'unique' => new Expression('NULL'),
            'primary_key' => new Expression('NULL'),
            'auto_increment' => new Expression('NULL'),
            'extra' => new Expression('NULL'),
            'char_length' => new Expression('NULL'),
            'precision' => new Expression('NULL'),
            'scale' => new Expression('NULL'),
            'is_nullable' => new Expression('"NO"'),
            'default_value' => new Expression('NULL'),
            'note',
            'column_type' => new Expression('NULL'),
            'signed' => new Expression('NULL'),
            'id',
            'type' => new Expression('UCASE(type)'),
            'sort',
            'managed' =>  new Expression('IF(ISNULL(DF2.id),0,1)'),
            'interface',
            'hidden_detail',
            'hidden_browse',
            'required',
            'options',
            'locked',
            'translation',
            'readonly',
            'width',
            'validation',
            'group',
        ]);
        $selectTwo->from(['DF2' => 'directus_fields']);

        $where = new Where();
        $where->addPredicate(new In(new Expression('UCASE(type)'), DataTypes::getAliasTypes()));
        if (isset($params['collection'])) {
            $where->equalTo('DF2.collection', $params['collection']);
        }

        $selectTwo->where($where);

        $selectOne->combine($selectTwo);

        $sorts = ArrayUtils::get($params, 'sort', 'collection');
        if (is_string($sorts)) {
            $sorts = StringUtils::csv($sorts);
        }

        $sql = new Sql($this->adapter);
        $selectUnion = new Select();
        $selectUnion->from(['fields' => $selectOne]);

        $sortNullLast = (bool) get_directus_setting('sort_null_last', true);
        foreach ($sorts as $field) {
            $sort = compact_sort_to_array($field);
            if ($sortNullLast) {
                $selectUnion->order(new IsNull(key($sort)));
            }

            $selectUnion->order($sort);
        }

        if (ArrayUtils::has($params, 'limit')) {
            $selectUnion->limit((int) ArrayUtils::get($params, 'limit'));
        }

        $statement = $sql->prepareStatementForSqlObject($selectUnion);
        $result = $statement->execute();

        return $result;
    }

    /**
     * @inheritDoc
     */
    public function hasField($tableName, $columnName)
    {
        // TODO: Implement hasColumn() method.
    }

    /**
     * @inheritDoc
     */
    public function getField($tableName, $columnName)
    {
        return $this->getFields($tableName, ['field' => $columnName])->current();
    }

    /**
     * @inheritdoc
     */
    public function getAllRelations()
    {
        // TODO: Implement getAllRelations() method.
    }

    public function getRelations($collectionName)
    {
        $selectOne = new Select();
        $selectOne->columns([
            'id',
            'collection_many',
            'field_many',
            'collection_one',
            'field_one',
            'junction_field'
        ]);

        $selectOne->from('directus_relations');

        $where = $selectOne->where->nest();
        $where->equalTo('collection_many', $collectionName);
        $where->OR;
        $where->equalTo('collection_one', $collectionName);
        $where->unnest();

        $sql = new Sql($this->adapter);
        $statement = $sql->prepareStatementForSqlObject($selectOne);
        $result = $statement->execute();

        return $result;
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
        $columnData = $this->getField($table, $column);

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
        $connection = $this->adapter;

        return $connection->query($query, $connection::QUERY_MODE_EXECUTE);
    }

    /**
     * @inheritDoc
     */
    public function dropPrimaryKey($table, $column)
    {
        $columnData = $this->getField($table, $column);

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
        $connection = $this->adapter;

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
            case 'bool':
            case 'boolean':
                $data = boolval($data);
                break;
            case 'tinyjson':
            case 'json':
            case 'mediumjson':
            case 'longjson':
                if ($data) {
                    $data = is_string($data) ? json_decode($data) : $data;
                } else {
                    $data = null;
                }
                break;
            case 'blob':
            case 'mediumblob':
                // NOTE: Do we really need to encode the blob?
                $data = base64_encode($data);
                break;
            case 'year':
            case 'tinyint':
            case 'smallint':
            case 'mediumint':
            case 'int':
            case 'integer':
                // do not cast bigint values. php doesn't support bigint
                // case 'bigint':
                // case 'serial':
                // Only cast if the value is numeric already
                // Avoid casting when the hooks already have cast numeric data type set as boolean type
                if (is_numeric($data)) {
                    $data = (int) $data;
                }
                break;
            case 'numeric':
            case 'float':
            case 'real':
            case 'decimal':
            case 'double':
                $data = (float) $data;
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
    public function getFloatingPointTypes()
    {
        return [
            'double',
            'double precision', // alias of double
            'real', // alias of double or float when REAL_AS_FLOAT is enabled
            'decimal',
            'dec', // alias of decimal
            'fixed', // alias of decimal
            'numeric', // alias of decimal
            'float',
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
            'integer', // alias of int
            'long',
            'tinyint'
        ];
    }

    /**
     * @inheritdoc
     */
    public function getNumericTypes()
    {
        return array_merge($this->getFloatingPointTypes(), $this->getIntegerTypes());
    }

    /**
     * @inheritdoc
     */
    public function isFloatingPointType($type)
    {
        return $this->isType($type, $this->getFloatingPointTypes());
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

    /**
     * @inheritdoc
     */
    public function getDateAndTimeTypes()
    {
        return [
            'date',
            'datetime',
            'time',
            'timestamp',
        ];
    }

    /**
     * @inheritdoc
     */
    public function isDateAndTimeTypes($type)
    {
        return in_array(strtolower($type), $this->getDateAndTimeTypes());
    }

    /**
     * @inheritdoc
     */
    public function getTypesRequireLength()
    {
        return [
            'varchar',
            'varbinary',
            'enum',
            'set',
            'decimal',
            'char'
        ];
    }

    /**
     * @inheritdoc
     */
    public function getTypesAllowLength()
    {
        return array_merge($this->getNumericTypes(), [
            'char',
            'binary',
        ]);
    }

    /**
     * @inheritdoc
     */
    public function isTypeLengthRequired($type)
    {
        return in_array(strtolower($type), $this->getTypesRequireLength());
    }

    /**
     * @inheritdoc
     */
    public function isTypeLengthAllowed($type)
    {
        return in_array(strtolower($type), $this->getTypesAllowLength());
    }

    /**
     * Checks whether the connection is to a MariaDB server
     *
     * @return bool
     */
    public function isMariaDb()
    {
        if ($this->isMariaDb === null) {
            $this->isMariaDb = false;
            $result = $this->adapter->query('SHOW VARIABLES WHERE Variable_Name LIKE "version" OR Variable_Name LIKE "version_comment";')->execute();
            while ($result->valid() && !$this->isMariaDb) {
                $this->isMariaDb = $result->current() && strpos(strtolower(ArrayUtils::get($result->current(), 'Value', '')), 'mariadb') !== false;
                $result->next();
            }
        }

        return $this->isMariaDb;
    }
}
