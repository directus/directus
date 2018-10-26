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
use Zend\Db\ResultSet\ResultSetInterface;

class SqliteMetadata extends AbstractSource
{
    protected function loadSchemaData()
    {
        if (isset($this->data['schemas'])) {
            return;
        }
        $this->prepareDataHierarchy('schemas');

        $results = $this->fetchPragma('database_list');
        foreach ($results as $row) {
            $schemas[] = $row['name'];
        }
        $this->data['schemas'] = $schemas;
    }

    protected function loadTableNameData($schema)
    {
        if (isset($this->data['table_names'][$schema])) {
            return;
        }
        $this->prepareDataHierarchy('table_names', $schema);

        // FEATURE: Filename?

        $p = $this->adapter->getPlatform();

        $sql = 'SELECT "name", "type", "sql" FROM ' . $p->quoteIdentifierChain([$schema, 'sqlite_master'])
             . ' WHERE "type" IN (\'table\',\'view\') AND "name" NOT LIKE \'sqlite_%\'';

        $results = $this->adapter->query($sql, Adapter::QUERY_MODE_EXECUTE);
        $tables = [];
        foreach ($results->toArray() as $row) {
            if ('table' == $row['type']) {
                $table = [
                    'table_type' => 'BASE TABLE',
                    'view_definition' => null, // VIEW only
                    'check_option' => null,    // VIEW only
                    'is_updatable' => null,    // VIEW only
                ];
            } else {
                $table = [
                    'table_type' => 'VIEW',
                    'view_definition' => null,
                    'check_option' => 'NONE',
                    'is_updatable' => false,
                ];

                // Parse out extra data
                if (null !== ($data = $this->parseView($row['sql']))) {
                    $table = array_merge($table, $data);
                }
            }
            $tables[$row['name']] = $table;
        }
        $this->data['table_names'][$schema] = $tables;
    }

    protected function loadColumnData($table, $schema)
    {
        if (isset($this->data['columns'][$schema][$table])) {
            return;
        }
        $this->prepareDataHierarchy('columns', $schema, $table);
        $this->prepareDataHierarchy('sqlite_columns', $schema, $table);

        $results = $this->fetchPragma('table_info', $table, $schema);

        $columns = [];

        foreach ($results as $row) {
            $columns[$row['name']] = [
                // cid appears to be zero-based, ordinal position needs to be one-based
                'ordinal_position'          => $row['cid'] + 1,
                'column_default'            => $row['dflt_value'],
                'is_nullable'               => ! ((bool) $row['notnull']),
                'data_type'                 => $row['type'],
                'character_maximum_length'  => null,
                'character_octet_length'    => null,
                'numeric_precision'         => null,
                'numeric_scale'             => null,
                'numeric_unsigned'          => null,
                'erratas'                   => [],
            ];
            // TODO: populate character_ and numeric_values with correct info
        }

        $this->data['columns'][$schema][$table] = $columns;
        $this->data['sqlite_columns'][$schema][$table] = $results;
    }

    protected function loadConstraintData($table, $schema)
    {
        if (isset($this->data['constraints'][$schema][$table])) {
            return;
        }

        $this->prepareDataHierarchy('constraints', $schema, $table);

        $this->loadColumnData($table, $schema);
        $primaryKey = [];

        foreach ($this->data['sqlite_columns'][$schema][$table] as $col) {
            if ((bool) $col['pk']) {
                $primaryKey[] = $col['name'];
            }
        }

        if (empty($primaryKey)) {
            $primaryKey = null;
        }
        $constraints = [];
        $indexes = $this->fetchPragma('index_list', $table, $schema);
        foreach ($indexes as $index) {
            if (! ((bool) $index['unique'])) {
                continue;
            }
            $constraint = [
                'constraint_name' => $index['name'],
                'constraint_type' => 'UNIQUE',
                'table_name'      => $table,
                'columns'         => [],
            ];

            $info = $this->fetchPragma('index_info', $index['name'], $schema);

            foreach ($info as $column) {
                $constraint['columns'][] = $column['name'];
            }
            if ($primaryKey === $constraint['columns']) {
                $constraint['constraint_type'] = 'PRIMARY KEY';
                $primaryKey = null;
            }
            $constraints[$constraint['constraint_name']] = $constraint;
        }

        if (null !== $primaryKey) {
            $constraintName = '_zf_' . $table . '_PRIMARY';
            $constraints[$constraintName] = [
                'constraint_name'  => $constraintName,
                'constraint_type'  => 'PRIMARY KEY',
                'table_name'       => $table,
                'columns' => $primaryKey,
            ];
        }

        $foreignKeys = $this->fetchPragma('foreign_key_list', $table, $schema);

        $id = $name = null;
        foreach ($foreignKeys as $fk) {
            if ($id !== $fk['id']) {
                $id = $fk['id'];
                $name = '_zf_' . $table . '_FOREIGN_KEY_' . ($id + 1);
                $constraints[$name] = [
                    'constraint_name'  => $name,
                    'constraint_type'  => 'FOREIGN KEY',
                    'table_name'       => $table,
                    'columns'          => [],
                    'referenced_table_schema' => $schema,
                    'referenced_table_name'   => $fk['table'],
                    'referenced_columns'      => [],
                    // TODO: Verify match, on_update, and on_delete values conform to SQL Standard
                    'match_option'     => strtoupper($fk['match']),
                    'update_rule'      => strtoupper($fk['on_update']),
                    'delete_rule'      => strtoupper($fk['on_delete']),
                ];
            }
            $constraints[$name]['columns'][] = $fk['from'];
            $constraints[$name]['referenced_columns'][] = $fk['to'];
        }

        $this->data['constraints'][$schema][$table] = $constraints;
    }

    protected function loadTriggerData($schema)
    {
        if (isset($this->data['triggers'][$schema])) {
            return;
        }

        $this->prepareDataHierarchy('triggers', $schema);

        $p = $this->adapter->getPlatform();

        $sql = 'SELECT "name", "tbl_name", "sql" FROM '
             . $p->quoteIdentifierChain([$schema, 'sqlite_master'])
             . ' WHERE "type" = \'trigger\'';

        $results = $this->adapter->query($sql, Adapter::QUERY_MODE_EXECUTE);
        $triggers = [];
        foreach ($results->toArray() as $row) {
            $trigger = [
                'trigger_name'               => $row['name'],
                'event_manipulation'         => null, // in $row['sql']
                'event_object_catalog'       => null,
                'event_object_schema'        => $schema,
                'event_object_table'         => $row['tbl_name'],
                'action_order'               => 0,
                'action_condition'           => null, // in $row['sql']
                'action_statement'           => null, // in $row['sql']
                'action_orientation'         => 'ROW',
                'action_timing'              => null, // in $row['sql']
                'action_reference_old_table' => null,
                'action_reference_new_table' => null,
                'action_reference_old_row'   => 'OLD',
                'action_reference_new_row'   => 'NEW',
                'created'                    => null,
            ];

            // Parse out extra data
            if (null !== ($data = $this->parseTrigger($row['sql']))) {
                $trigger = array_merge($trigger, $data);
            }
            $triggers[$trigger['trigger_name']] = $trigger;
        }

        $this->data['triggers'][$schema] = $triggers;
    }

    protected function fetchPragma($name, $value = null, $schema = null)
    {
        $p = $this->adapter->getPlatform();

        $sql = 'PRAGMA ';

        if (null !== $schema) {
            $sql .= $p->quoteIdentifier($schema) . '.';
        }
        $sql .= $name;

        if (null !== $value) {
            $sql .= '(' . $p->quoteTrustedValue($value) . ')';
        }

        $results = $this->adapter->query($sql, Adapter::QUERY_MODE_EXECUTE);
        if ($results instanceof ResultSetInterface) {
            return $results->toArray();
        }
        return [];
    }

    protected function parseView($sql)
    {
        static $re = null;
        if (null === $re) {
            $identifierChain = $this->getIdentifierChainRegularExpression();
            $re = $this->buildRegularExpression([
                'CREATE',
                ['TEMP|TEMPORARY'],
                'VIEW',
                ['IF', 'NOT', 'EXISTS'],
                $identifierChain,
                'AS',
                '(?<view_definition>.+)',
                [';'],
            ]);
        }

        if (! preg_match($re, $sql, $matches)) {
            return;
        }
        return [
            'view_definition' => $matches['view_definition'],
        ];
    }

    protected function parseTrigger($sql)
    {
        static $re = null;
        if (null === $re) {
            $identifier = $this->getIdentifierRegularExpression();
            $identifierList = $this->getIdentifierListRegularExpression();
            $identifierChain = $this->getIdentifierChainRegularExpression();
            $re = $this->buildRegularExpression([
                'CREATE',
                ['TEMP|TEMPORARY'],
                'TRIGGER',
                ['IF', 'NOT', 'EXISTS'],
                $identifierChain,
                ['(?<action_timing>BEFORE|AFTER|INSTEAD\\s+OF)', ],
                '(?<event_manipulation>DELETE|INSERT|UPDATE)',
                ['OF', '(?<column_usage>' . $identifierList . ')'],
                'ON',
                '(?<event_object_table>' . $identifier . ')',
                ['FOR', 'EACH', 'ROW'],
                ['WHEN', '(?<action_condition>.+)'],
                '(?<action_statement>BEGIN',
                '.+',
                'END)',
                [';'],
            ]);
        }

        if (! preg_match($re, $sql, $matches)) {
            return;
        }
        $data = [];

        foreach ($matches as $key => $value) {
            if (is_string($key)) {
                $data[$key] = $value;
            }
        }

        // Normalize data and populate defaults, if necessary

        $data['event_manipulation'] = strtoupper($data['event_manipulation']);
        if (empty($data['action_condition'])) {
            $data['action_condition'] = null;
        }
        if (! empty($data['action_timing'])) {
            $data['action_timing'] = strtoupper($data['action_timing']);
            if ('I' == $data['action_timing'][0]) {
                // normalize the white-space between the two words
                $data['action_timing'] = 'INSTEAD OF';
            }
        } else {
            $data['action_timing'] = 'AFTER';
        }
        unset($data['column_usage']);

        return $data;
    }

    protected function buildRegularExpression(array $re)
    {
        foreach ($re as &$value) {
            if (is_array($value)) {
                $value = '(?:' . implode('\\s*+', $value) . '\\s*+)?';
            } else {
                $value .= '\\s*+';
            }
        }
        unset($value);
        $re = '/^' . implode('\\s*+', $re) . '$/';
        return $re;
    }

    protected function getIdentifierRegularExpression()
    {
        static $re = null;
        if (null === $re) {
            $re = '(?:' . implode('|', [
                '"(?:[^"\\\\]++|\\\\.)*+"',
                '`(?:[^`]++|``)*+`',
                '\\[[^\\]]+\\]',
                '[^\\s\\.]+',
            ]) . ')';
        }

        return $re;
    }

    protected function getIdentifierChainRegularExpression()
    {
        static $re = null;
        if (null === $re) {
            $identifier = $this->getIdentifierRegularExpression();
            $re = $identifier . '(?:\\s*\\.\\s*' . $identifier . ')*+';
        }
        return $re;
    }

    protected function getIdentifierListRegularExpression()
    {
        static $re = null;
        if (null === $re) {
            $identifier = $this->getIdentifierRegularExpression();
            $re = $identifier . '(?:\\s*,\\s*' . $identifier . ')*+';
        }
        return $re;
    }
}
