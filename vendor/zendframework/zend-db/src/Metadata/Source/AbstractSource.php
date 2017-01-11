<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace Zend\Db\Metadata\Source;

use Zend\Db\Adapter\Adapter;
use Zend\Db\Metadata\MetadataInterface;
use Zend\Db\Metadata\Object;

abstract class AbstractSource implements MetadataInterface
{
    const DEFAULT_SCHEMA = '__DEFAULT_SCHEMA__';

    /**
     *
     * @var Adapter
     */
    protected $adapter = null;

    /**
     *
     * @var string
     */
    protected $defaultSchema = null;

    /**
     *
     * @var array
     */
    protected $data = [];

    /**
     * Constructor
     *
     * @param Adapter $adapter
     */
    public function __construct(Adapter $adapter)
    {
        $this->adapter = $adapter;
        $this->defaultSchema = ($adapter->getCurrentSchema()) ?: self::DEFAULT_SCHEMA;
    }

    /**
     * Get schemas
     *
     */
    public function getSchemas()
    {
        $this->loadSchemaData();

        return $this->data['schemas'];
    }

    /**
     * {@inheritdoc}
     */
    public function getTableNames($schema = null, $includeViews = false)
    {
        if ($schema === null) {
            $schema = $this->defaultSchema;
        }

        $this->loadTableNameData($schema);

        if ($includeViews) {
            return array_keys($this->data['table_names'][$schema]);
        }

        $tableNames = [];
        foreach ($this->data['table_names'][$schema] as $tableName => $data) {
            if ('BASE TABLE' == $data['table_type']) {
                $tableNames[] = $tableName;
            }
        }
        return $tableNames;
    }

    /**
     * {@inheritdoc}
     */
    public function getTables($schema = null, $includeViews = false)
    {
        if ($schema === null) {
            $schema = $this->defaultSchema;
        }

        $tables = [];
        foreach ($this->getTableNames($schema, $includeViews) as $tableName) {
            $tables[] = $this->getTable($tableName, $schema);
        }
        return $tables;
    }

    /**
     * {@inheritdoc}
     */
    public function getTable($tableName, $schema = null)
    {
        if ($schema === null) {
            $schema = $this->defaultSchema;
        }

        $this->loadTableNameData($schema);

        if (!isset($this->data['table_names'][$schema][$tableName])) {
            throw new \Exception('Table "' . $tableName . '" does not exist');
        }

        $data = $this->data['table_names'][$schema][$tableName];
        switch ($data['table_type']) {
            case 'BASE TABLE':
                $table = new Object\TableObject($tableName);
                break;
            case 'VIEW':
                $table = new Object\ViewObject($tableName);
                $table->setViewDefinition($data['view_definition']);
                $table->setCheckOption($data['check_option']);
                $table->setIsUpdatable($data['is_updatable']);
                break;
            default:
                throw new \Exception('Table "' . $tableName . '" is of an unsupported type "' . $data['table_type'] . '"');
        }
        $table->setColumns($this->getColumns($tableName, $schema));
        $table->setConstraints($this->getConstraints($tableName, $schema));
        return $table;
    }

    /**
     * {@inheritdoc}
     */
    public function getViewNames($schema = null)
    {
        if ($schema === null) {
            $schema = $this->defaultSchema;
        }

        $this->loadTableNameData($schema);

        $viewNames = [];
        foreach ($this->data['table_names'][$schema] as $tableName => $data) {
            if ('VIEW' == $data['table_type']) {
                $viewNames[] = $tableName;
            }
        }
        return $viewNames;
    }

    /**
     * {@inheritdoc}
     */
    public function getViews($schema = null)
    {
        if ($schema === null) {
            $schema = $this->defaultSchema;
        }

        $views = [];
        foreach ($this->getViewNames($schema) as $tableName) {
            $views[] = $this->getTable($tableName, $schema);
        }
        return $views;
    }

    /**
     * {@inheritdoc}
     */
    public function getView($viewName, $schema = null)
    {
        if ($schema === null) {
            $schema = $this->defaultSchema;
        }

        $this->loadTableNameData($schema);

        $tableNames = $this->data['table_names'][$schema];
        if (isset($tableNames[$viewName]) && 'VIEW' == $tableNames[$viewName]['table_type']) {
            return $this->getTable($viewName, $schema);
        }
        throw new \Exception('View "' . $viewName . '" does not exist');
    }

    /**
     * {@inheritdoc}
     */
    public function getColumnNames($table, $schema = null)
    {
        if ($schema === null) {
            $schema = $this->defaultSchema;
        }

        $this->loadColumnData($table, $schema);

        if (!isset($this->data['columns'][$schema][$table])) {
            throw new \Exception('"' . $table . '" does not exist');
        }

        return array_keys($this->data['columns'][$schema][$table]);
    }

    /**
     * {@inheritdoc}
     */
    public function getColumns($table, $schema = null)
    {
        if ($schema === null) {
            $schema = $this->defaultSchema;
        }

        $this->loadColumnData($table, $schema);

        $columns = [];
        foreach ($this->getColumnNames($table, $schema) as $columnName) {
            $columns[] = $this->getColumn($columnName, $table, $schema);
        }
        return $columns;
    }

    /**
     * {@inheritdoc}
     */
    public function getColumn($columnName, $table, $schema = null)
    {
        if ($schema === null) {
            $schema = $this->defaultSchema;
        }

        $this->loadColumnData($table, $schema);

        if (!isset($this->data['columns'][$schema][$table][$columnName])) {
            throw new \Exception('A column by that name was not found.');
        }

        $info = $this->data['columns'][$schema][$table][$columnName];

        $column = new Object\ColumnObject($columnName, $table, $schema);
        $props = [
            'ordinal_position', 'column_default', 'is_nullable',
            'data_type', 'character_maximum_length', 'character_octet_length',
            'numeric_precision', 'numeric_scale', 'numeric_unsigned',
            'erratas'
        ];
        foreach ($props as $prop) {
            if (isset($info[$prop])) {
                $column->{'set' . str_replace('_', '', $prop)}($info[$prop]);
            }
        }

        $column->setOrdinalPosition($info['ordinal_position']);
        $column->setColumnDefault($info['column_default']);
        $column->setIsNullable($info['is_nullable']);
        $column->setDataType($info['data_type']);
        $column->setCharacterMaximumLength($info['character_maximum_length']);
        $column->setCharacterOctetLength($info['character_octet_length']);
        $column->setNumericPrecision($info['numeric_precision']);
        $column->setNumericScale($info['numeric_scale']);
        $column->setNumericUnsigned($info['numeric_unsigned']);
        $column->setErratas($info['erratas']);

        return $column;
    }

    /**
     * {@inheritdoc}
     */
    public function getConstraints($table, $schema = null)
    {
        if ($schema === null) {
            $schema = $this->defaultSchema;
        }

        $this->loadConstraintData($table, $schema);

        $constraints = [];
        foreach (array_keys($this->data['constraints'][$schema][$table]) as $constraintName) {
            $constraints[] = $this->getConstraint($constraintName, $table, $schema);
        }

        return $constraints;
    }

    /**
     * {@inheritdoc}
     */
    public function getConstraint($constraintName, $table, $schema = null)
    {
        if ($schema === null) {
            $schema = $this->defaultSchema;
        }

        $this->loadConstraintData($table, $schema);

        if (!isset($this->data['constraints'][$schema][$table][$constraintName])) {
            throw new \Exception('Cannot find a constraint by that name in this table');
        }

        $info = $this->data['constraints'][$schema][$table][$constraintName];
        $constraint = new Object\ConstraintObject($constraintName, $table, $schema);

        foreach ([
            'constraint_type'         => 'setType',
            'match_option'            => 'setMatchOption',
            'update_rule'             => 'setUpdateRule',
            'delete_rule'             => 'setDeleteRule',
            'columns'                 => 'setColumns',
            'referenced_table_schema' => 'setReferencedTableSchema',
            'referenced_table_name'   => 'setReferencedTableName',
            'referenced_columns'      => 'setReferencedColumns',
            'check_clause'            => 'setCheckClause',
        ] as $key => $setMethod) {
            if (isset($info[$key])) {
                $constraint->{$setMethod}($info[$key]);
            }
        }

        return $constraint;
    }

    /**
     * {@inheritdoc}
     */
    public function getConstraintKeys($constraint, $table, $schema = null)
    {
        if ($schema === null) {
            $schema = $this->defaultSchema;
        }

        $this->loadConstraintReferences($table, $schema);

        // organize references first
        $references = [];
        foreach ($this->data['constraint_references'][$schema] as $refKeyInfo) {
            if ($refKeyInfo['constraint_name'] == $constraint) {
                $references[$refKeyInfo['constraint_name']] = $refKeyInfo;
            }
        }

        $this->loadConstraintDataKeys($schema);

        $keys = [];
        foreach ($this->data['constraint_keys'][$schema] as $constraintKeyInfo) {
            if ($constraintKeyInfo['table_name'] == $table && $constraintKeyInfo['constraint_name'] === $constraint) {
                $keys[] = $key = new Object\ConstraintKeyObject($constraintKeyInfo['column_name']);
                $key->setOrdinalPosition($constraintKeyInfo['ordinal_position']);
                if (isset($references[$constraint])) {
                    //$key->setReferencedTableSchema($constraintKeyInfo['referenced_table_schema']);
                    $key->setForeignKeyUpdateRule($references[$constraint]['update_rule']);
                    $key->setForeignKeyDeleteRule($references[$constraint]['delete_rule']);
                    //$key->setReferencedTableSchema($references[$constraint]['referenced_table_schema']);
                    $key->setReferencedTableName($references[$constraint]['referenced_table_name']);
                    $key->setReferencedColumnName($references[$constraint]['referenced_column_name']);
                }
            }
        }

        return $keys;
    }

    /**
     * {@inheritdoc}
     */
    public function getTriggerNames($schema = null)
    {
        if ($schema === null) {
            $schema = $this->defaultSchema;
        }

        $this->loadTriggerData($schema);

        return array_keys($this->data['triggers'][$schema]);
    }

    /**
     * {@inheritdoc}
     */
    public function getTriggers($schema = null)
    {
        if ($schema === null) {
            $schema = $this->defaultSchema;
        }

        $triggers = [];
        foreach ($this->getTriggerNames($schema) as $triggerName) {
            $triggers[] = $this->getTrigger($triggerName, $schema);
        }
        return $triggers;
    }

    /**
     * {@inheritdoc}
     */
    public function getTrigger($triggerName, $schema = null)
    {
        if ($schema === null) {
            $schema = $this->defaultSchema;
        }

        $this->loadTriggerData($schema);

        if (!isset($this->data['triggers'][$schema][$triggerName])) {
            throw new \Exception('Trigger "' . $triggerName . '" does not exist');
        }

        $info = $this->data['triggers'][$schema][$triggerName];

        $trigger = new Object\TriggerObject();

        $trigger->setName($triggerName);
        $trigger->setEventManipulation($info['event_manipulation']);
        $trigger->setEventObjectCatalog($info['event_object_catalog']);
        $trigger->setEventObjectSchema($info['event_object_schema']);
        $trigger->setEventObjectTable($info['event_object_table']);
        $trigger->setActionOrder($info['action_order']);
        $trigger->setActionCondition($info['action_condition']);
        $trigger->setActionStatement($info['action_statement']);
        $trigger->setActionOrientation($info['action_orientation']);
        $trigger->setActionTiming($info['action_timing']);
        $trigger->setActionReferenceOldTable($info['action_reference_old_table']);
        $trigger->setActionReferenceNewTable($info['action_reference_new_table']);
        $trigger->setActionReferenceOldRow($info['action_reference_old_row']);
        $trigger->setActionReferenceNewRow($info['action_reference_new_row']);
        $trigger->setCreated($info['created']);

        return $trigger;
    }

    /**
     * Prepare data hierarchy
     *
     * @param string $type
     * @param string $key ...
     */
    protected function prepareDataHierarchy($type)
    {
        $data = &$this->data;
        foreach (func_get_args() as $key) {
            if (!isset($data[$key])) {
                $data[$key] = [];
            }
            $data = &$data[$key];
        }
    }

    /**
     * Load schema data
     */
    protected function loadSchemaData()
    {
    }

    /**
     * Load table name data
     *
     * @param string $schema
     */
    protected function loadTableNameData($schema)
    {
        if (isset($this->data['table_names'][$schema])) {
            return;
        }

        $this->prepareDataHierarchy('table_names', $schema);
    }

    /**
     * Load column data
     *
     * @param string $table
     * @param string $schema
     */
    protected function loadColumnData($table, $schema)
    {
        if (isset($this->data['columns'][$schema][$table])) {
            return;
        }

        $this->prepareDataHierarchy('columns', $schema, $table);
    }

    /**
     * Load constraint data
     *
     * @param string $table
     * @param string $schema
     */
    protected function loadConstraintData($table, $schema)
    {
        if (isset($this->data['constraints'][$schema])) {
            return;
        }

        $this->prepareDataHierarchy('constraints', $schema);
    }

    /**
     * Load constraint data keys
     *
     * @param string $schema
     */
    protected function loadConstraintDataKeys($schema)
    {
        if (isset($this->data['constraint_keys'][$schema])) {
            return;
        }

        $this->prepareDataHierarchy('constraint_keys', $schema);
    }

    /**
     * Load constraint references
     *
     * @param string $table
     * @param string $schema
     */
    protected function loadConstraintReferences($table, $schema)
    {
        if (isset($this->data['constraint_references'][$schema])) {
            return;
        }

        $this->prepareDataHierarchy('constraint_references', $schema);
    }

    /**
     * Load trigger data
     *
     * @param string $schema
     */
    protected function loadTriggerData($schema)
    {
        if (isset($this->data['triggers'][$schema])) {
            return;
        }

        $this->prepareDataHierarchy('triggers', $schema);
    }
}
