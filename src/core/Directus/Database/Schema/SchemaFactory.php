<?php

namespace Directus\Database\Schema;

use Directus\Database\Ddl\Column\Bit;
use Directus\Database\Ddl\Column\CollectionLength;
use Directus\Database\Ddl\Column\Custom;
use Directus\Database\Ddl\Column\Double;
use Directus\Database\Ddl\Column\Enum;
use Directus\Database\Ddl\Column\LongBlob;
use Directus\Database\Ddl\Column\LongText;
use Directus\Database\Ddl\Column\MediumBlob;
use Directus\Database\Ddl\Column\MediumInteger;
use Directus\Database\Ddl\Column\MediumText;
use Directus\Database\Ddl\Column\Numeric;
use Directus\Database\Ddl\Column\Real;
use Directus\Database\Ddl\Column\Set;
use Directus\Database\Ddl\Column\SmallInteger;
use Directus\Database\Ddl\Column\TinyBlob;
use Directus\Database\Ddl\Column\TinyInteger;
use Directus\Database\Ddl\Column\TinyText;
use Directus\Database\Exception\FieldAlreadyHasUniqueKeyException;
use Directus\Database\Exception\UnknownTypeException;
use Directus\Util\ArrayUtils;
use Directus\Validator\Exception\InvalidRequestException;
use Directus\Validator\Validator;
use Symfony\Component\Validator\ConstraintViolationList;
use Zend\Db\Sql\AbstractSql;
use Zend\Db\Sql\Ddl\AlterTable;
use Zend\Db\Sql\Ddl\Column\AbstractLengthColumn;
use Zend\Db\Sql\Ddl\Column\AbstractPrecisionColumn;
use Zend\Db\Sql\Ddl\Column\BigInteger;
use Zend\Db\Sql\Ddl\Column\Binary;
use Zend\Db\Sql\Ddl\Column\Blob;
use Zend\Db\Sql\Ddl\Column\Char;
use Zend\Db\Sql\Ddl\Column\Column;
use Zend\Db\Sql\Ddl\Column\Date;
use Zend\Db\Sql\Ddl\Column\Datetime;
use Zend\Db\Sql\Ddl\Column\Decimal;
use Zend\Db\Sql\Ddl\Column\Floating;
use Zend\Db\Sql\Ddl\Column\Integer;
use Zend\Db\Sql\Ddl\Column\Text;
use Zend\Db\Sql\Ddl\Column\Time;
use Zend\Db\Sql\Ddl\Column\Timestamp;
use Zend\Db\Sql\Ddl\Column\Varbinary;
use Zend\Db\Sql\Ddl\Column\Varchar;
use Zend\Db\Sql\Ddl\Constraint\PrimaryKey;
use Zend\Db\Sql\Ddl\Constraint\UniqueKey;
use Zend\Db\Sql\Ddl\CreateTable;
use Zend\Db\Sql\Sql;
use Zend\Db\Sql\Predicate\Expression;
use Zend\Db\Sql\Select;
use Directus\Database\Exception\FieldRequiredException;

class SchemaFactory
{
    /**
     * @var SchemaManager
     */
    protected $schemaManager;

    /**
     * @var Validator
     */
    protected $validator;

    public function __construct(SchemaManager $manager)
    {
        $this->schemaManager = $manager;
        $this->validator = new Validator();
    }

    /**
     * Create a new table
     *
     * @param string $name
     * @param array $columnsData
     *
     * @return CreateTable
     */
    public function createTable($name, array $columnsData = [])
    {
        $table = new CreateTable($name);
        $columns = $this->createColumns($columnsData);

        foreach ($columnsData as $column) {
            if (ArrayUtils::get($column, 'primary_key', false)) {
                $table->addConstraint(new PrimaryKey($column['field']));
            } else if (ArrayUtils::get($column, 'unique') == true) {
                $table->addConstraint(new UniqueKey($column['field']));
            }
        }

        foreach ($columns as $column) {
            $table->addColumn($column);
        }

        return $table;
    }

    /**
     * Alter an existing table
     *
     * @param $name
     * @param array $data
     *
     * @return AlterTable
     *
     * @throws FieldAlreadyHasUniqueKeyException
     * @throws FieldRequiredException
     */
    public function alterTable($name, array $data)
    {
        $table = new AlterTable($name);

        $connection = $this->schemaManager->getSource()->getConnection();
        $sql = new Sql($connection);
    
        $toAddColumnsData = ArrayUtils::get($data, 'add', []);
        $toAddColumns = $this->createColumns($toAddColumnsData);
        foreach ($toAddColumns as $column) {
            $table->addColumn($column);

            $options = $column->getOptions();
            if (!is_array($options)) {
                continue;
            }

            if (ArrayUtils::get($options, 'primary_key') == true) {
                $table->addConstraint(new PrimaryKey($column->getName()));
            }
            if (ArrayUtils::get($options, 'unique') == true) {
                $table->addConstraint(new UniqueKey($column->getName()));
            }
        }

        $toChangeColumnsData = ArrayUtils::get($data, 'change', []);
        
        // Throws an exception when trying to make the field required and there are items with no value for that field in collection
        foreach ($toChangeColumnsData as $column) {
            if($column['required']) {

                //...for alias columns we don't need to check the items, since it't not real column and we are not facing the limitation because of "NOT NULL" constraint.
                if(!DataTypes::isAliasType(ArrayUtils::get($column, 'type'))) {
                    $select = new Select();
                    $select->columns([
                        'count' => new Expression('COUNT(*)')
                    ]);
                    $select->from($name);
                    $select->where->isNull($column['field']);
                    $statement = $sql->prepareStatementForSqlObject($select);
                    $result = $statement->execute();
                    $entries = $result->current();
                    if($entries['count'] > 0) {
                        throw new FieldRequiredException();
                    }
                }
            }
        }

        $toChangeColumns = $this->createColumns($toChangeColumnsData);
        foreach ($toChangeColumns as $column) {
            $table->changeColumn($column->getName(), $column);

            $options = $column->getOptions();
            if (!is_array($options)) {
                continue;
            }

            if (ArrayUtils::get($options, 'primary_key') == true) {
                $table->addConstraint(new PrimaryKey($column->getName()));
            }
            if (ArrayUtils::get($options, 'unique') == true) {
                $table->addConstraint(new UniqueKey($column->getName()));
            }
        }

        $toDropColumnsName = ArrayUtils::get($data, 'drop', []);
        foreach ($toDropColumnsName as $column) {
            $table->dropColumn($column);
        }

        return $table;
    }

    /**
     * @param array $data
     *
     * @return Column[]
     */
    public function createColumns(array $data)
    {
        $columns = [];
        foreach ($data as $column) {
            if (!DataTypes::isAliasType(ArrayUtils::get($column, 'type'))) {
                $columns[] = $this->createColumn(ArrayUtils::get($column, 'field'), $column);
            }
        }

        return $columns;
    }

    /**
     * @param string $name
     * @param array $data
     *
     * @return Column
     */
    public function createColumn($name, array $data)
    {
        $this->validate($data);
        $type = ArrayUtils::get($data, 'type');
        $dataType = isset($data['datatype']) ? $data['datatype'] : $type;
        $autoincrement = ArrayUtils::get($data, 'auto_increment', false);
        $unique = ArrayUtils::get($data, 'unique', false);
        $primaryKey = ArrayUtils::get($data, 'primary_key', false);
        $length = ArrayUtils::get($data, 'length', $this->schemaManager->getFieldDefaultLength($type));
        $default = ArrayUtils::get($data, 'default_value', null);
        $unsigned = !ArrayUtils::get($data, 'signed', false);
        $note = ArrayUtils::get($data, 'note');
        $nullable = !ArrayUtils::get($data, 'required', false);
        // ZendDB doesn't support encoding nor collation

        $column = $this->createColumnFromType($name, $dataType);
        $column->setNullable($nullable);
        $column->setDefault($default);
        $column->setOption('comment', $note);

        if (!$autoincrement && $unique === true) {
            $column->setOption('unique', $unique);
        }

        if ($primaryKey === true) {
            $column->setOption('primary_key', $primaryKey);
        }

        // CollectionLength are SET or ENUM data type
        if ($column instanceof AbstractPrecisionColumn) {
            $parts = !is_array($length) ? explode(',', $length) : $length;
            $column->setDigits($parts[0]);
            $column->setDecimal(isset($parts[1]) ? $parts[1] : 0);
        } else if ($column instanceof AbstractLengthColumn || $column instanceof CollectionLength) {
            $column->setLength($length);
        } else {
            $column->setOption('length', $length);
        }

        // Only works for integers
        if ($column instanceof Integer) {
            $column->setOption('autoincrement', $autoincrement);
            $column->setOption('unsigned', $unsigned);
        }

        return $column;
    }

    /**
     * Creates the given table
     *
     * @param AbstractSql|AlterTable|CreateTable $table
     *
     * @return \Zend\Db\Adapter\Driver\StatementInterface|\Zend\Db\ResultSet\ResultSet
     */
    public function buildTable(AbstractSql $table, $charset = "")
    {
        $connection = $this->schemaManager->getSource()->getConnection();
        $sql = new Sql($connection);

        $tableQuery = $sql->buildSqlString($table);
        $tableQuery = !empty($charset) ? $tableQuery . "charset = " . $charset : $tableQuery;

        // TODO: Allow charset and comment
        return $connection->query(
            $tableQuery,
            $connection::QUERY_MODE_EXECUTE
        );
    }

    /**
     * Creates column based on type
     *
     * @param $name
     * @param $type
     *
     * @return Column
     *
     * @throws UnknownTypeException
     */
    protected function createColumnFromType($name, $type)
    {
        // TODO: Move this to the Schema Source
        switch (strtolower($type)) {
            case 'char':
                $column = new Char($name);
                break;
            case 'varchar':
                $column = new Varchar($name);
                break;
            case 'tinytext':
                $column = new TinyText($name);
                break;
            case 'text':
                $column = new Text($name);
                break;
            case 'mediumtext':
                $column = new MediumText($name);
                break;
            case 'longtext':
                $column = new LongText($name);
                break;
            case 'time':
                $column = new Time($name);
                break;
            case 'date':
                $column = new Date($name);
                break;
            case 'datetime':
                $column = new Datetime($name);
                break;
            case 'timestamp':
                $column = new Timestamp($name);
                break;
            case 'tinyint':
                $column = new TinyInteger($name);
                break;
            case 'smallint':
                $column = new SmallInteger($name);
                break;
            case 'integer':
            case 'int':
                $column = new Integer($name);
                break;
            case 'mediumint':
                $column = new MediumInteger($name);
                break;
            case 'serial':
            case 'bigint':
                $column = new BigInteger($name);
                break;
            case 'float':
                $column = new Floating($name);
                break;
            case 'double':
                $column = new Double($name);
                break;
            case 'decimal':
                $column = new Decimal($name);
                break;
            case 'real':
                $column = new Real($name);
                break;
            case 'numeric':
                $column = new Numeric($name);
                break;
            case 'bit':
                $column = new Bit($name);
                break;
            case 'binary':
                $column = new Binary($name);
                break;
            case 'varbinary':
                $column = new Varbinary($name);
                break;
            case 'tinyblob':
                $column = new TinyBlob($name);
                break;
            case 'blob':
                $column = new Blob($name);
                break;
            case 'mediumblob':
                $column = new MediumBlob($name);
                break;
            case 'longblob':
                $column = new LongBlob($name);
                break;
            case 'set':
                $column = new Set($name);
                break;
            case 'enum':
                $column = new Enum($name);
                break;
            default:
                $column = new Custom($type, $name);
                break;
        }

        return $column;
    }

    /**
     * @param array $columnData
     *
     * @throws InvalidRequestException
     */
    protected function validate(array $columnData)
    {
        $constraints = [
            'field' => ['required', 'string'],
            'type' => ['required', 'string'],
        ];

        // Copied from route
        // TODO: Route needs a restructure to get the utils code like this shared
        $violations = [];
        $data = ArrayUtils::pick($columnData, array_keys($constraints));
        foreach (array_keys($constraints) as $field) {
            $violations[$field] = $this->validator->validate(ArrayUtils::get($data, $field), $constraints[$field]);
        }

        $messages = [];
        /** @var ConstraintViolationList $violation */
        foreach ($violations as $field => $violation) {
            $iterator = $violation->getIterator();

            $errors = [];
            while ($iterator->valid()) {
                $constraintViolation = $iterator->current();
                $errors[] = $constraintViolation->getMessage();
                $iterator->next();
            }

            if ($errors) {
                $messages[] = sprintf('%s: %s', $field, implode(', ', $errors));
            }
        }

        if (count($messages) > 0) {
            throw new InvalidRequestException(implode(' ', $messages));
        }
    }
}
