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

class SqlServerMetadata extends AbstractSource
{
    protected function loadSchemaData()
    {
        if (isset($this->data['schemas'])) {
            return;
        }
        $this->prepareDataHierarchy('schemas');

        $p = $this->adapter->getPlatform();

        $sql = 'SELECT ' . $p->quoteIdentifier('SCHEMA_NAME')
            . ' FROM ' . $p->quoteIdentifierChain(['INFORMATION_SCHEMA', 'SCHEMATA'])
            . ' WHERE ' . $p->quoteIdentifier('SCHEMA_NAME')
            . ' != \'INFORMATION_SCHEMA\'';

        $results = $this->adapter->query($sql, Adapter::QUERY_MODE_EXECUTE);

        $schemas = [];
        foreach ($results->toArray() as $row) {
            $schemas[] = $row['SCHEMA_NAME'];
        }

        $this->data['schemas'] = $schemas;
    }

    protected function loadTableNameData($schema)
    {
        if (isset($this->data['table_names'][$schema])) {
            return;
        }
        $this->prepareDataHierarchy('table_names', $schema);

        $p = $this->adapter->getPlatform();

        $isColumns = [
            ['T', 'TABLE_NAME'],
            ['T', 'TABLE_TYPE'],
            ['V', 'VIEW_DEFINITION'],
            ['V', 'CHECK_OPTION'],
            ['V', 'IS_UPDATABLE'],
        ];

        array_walk($isColumns, function (&$c) use ($p) {
            $c = $p->quoteIdentifierChain($c);
        });

        $sql = 'SELECT ' . implode(', ', $isColumns)
            . ' FROM ' . $p->quoteIdentifierChain(['INFORMATION_SCHEMA', 'TABLES']) . ' t'

            . ' LEFT JOIN ' . $p->quoteIdentifierChain(['INFORMATION_SCHEMA', 'VIEWS']) . ' v'
            . ' ON ' . $p->quoteIdentifierChain(['T', 'TABLE_SCHEMA'])
            . '  = ' . $p->quoteIdentifierChain(['V', 'TABLE_SCHEMA'])
            . ' AND ' . $p->quoteIdentifierChain(['T', 'TABLE_NAME'])
            . '  = ' . $p->quoteIdentifierChain(['V', 'TABLE_NAME'])

            . ' WHERE ' . $p->quoteIdentifierChain(['T', 'TABLE_TYPE'])
            . ' IN (\'BASE TABLE\', \'VIEW\')';

        if ($schema != self::DEFAULT_SCHEMA) {
            $sql .= ' AND ' . $p->quoteIdentifierChain(['T', 'TABLE_SCHEMA'])
                . ' = ' . $p->quoteTrustedValue($schema);
        } else {
            $sql .= ' AND ' . $p->quoteIdentifierChain(['T', 'TABLE_SCHEMA'])
                . ' != \'INFORMATION_SCHEMA\'';
        }

        $results = $this->adapter->query($sql, Adapter::QUERY_MODE_EXECUTE);

        $tables = [];
        foreach ($results->toArray() as $row) {
            $tables[$row['TABLE_NAME']] = [
                'table_type' => $row['TABLE_TYPE'],
                'view_definition' => $row['VIEW_DEFINITION'],
                'check_option' => $row['CHECK_OPTION'],
                'is_updatable' => ('YES' == $row['IS_UPDATABLE']),
            ];
        }

        $this->data['table_names'][$schema] = $tables;
    }

    protected function loadColumnData($table, $schema)
    {
        if (isset($this->data['columns'][$schema][$table])) {
            return;
        }
        $this->prepareDataHierarchy('columns', $schema, $table);
        $p = $this->adapter->getPlatform();

        $isColumns = [
            ['C', 'ORDINAL_POSITION'],
            ['C', 'COLUMN_DEFAULT'],
            ['C', 'IS_NULLABLE'],
            ['C', 'DATA_TYPE'],
            ['C', 'CHARACTER_MAXIMUM_LENGTH'],
            ['C', 'CHARACTER_OCTET_LENGTH'],
            ['C', 'NUMERIC_PRECISION'],
            ['C', 'NUMERIC_SCALE'],
            ['C', 'COLUMN_NAME'],
        ];

        array_walk($isColumns, function (&$c) use ($p) {
            $c = $p->quoteIdentifierChain($c);
        });

        $sql = 'SELECT ' . implode(', ', $isColumns)
            . ' FROM ' . $p->quoteIdentifierChain(['INFORMATION_SCHEMA', 'TABLES']) . 'T'
            . ' INNER JOIN ' . $p->quoteIdentifierChain(['INFORMATION_SCHEMA', 'COLUMNS']) . 'C'
            . ' ON ' . $p->quoteIdentifierChain(['T', 'TABLE_SCHEMA'])
            . '  = ' . $p->quoteIdentifierChain(['C', 'TABLE_SCHEMA'])
            . ' AND ' . $p->quoteIdentifierChain(['T', 'TABLE_NAME'])
            . '  = ' . $p->quoteIdentifierChain(['C', 'TABLE_NAME'])
            . ' WHERE ' . $p->quoteIdentifierChain(['T', 'TABLE_TYPE'])
            . ' IN (\'BASE TABLE\', \'VIEW\')'
            . ' AND ' . $p->quoteIdentifierChain(['T', 'TABLE_NAME'])
            . '  = ' . $p->quoteTrustedValue($table);

        if ($schema != self::DEFAULT_SCHEMA) {
            $sql .= ' AND ' . $p->quoteIdentifierChain(['T', 'TABLE_SCHEMA'])
                . ' = ' . $p->quoteTrustedValue($schema);
        } else {
            $sql .= ' AND ' . $p->quoteIdentifierChain(['T', 'TABLE_SCHEMA'])
                . ' != \'INFORMATION_SCHEMA\'';
        }

        $results = $this->adapter->query($sql, Adapter::QUERY_MODE_EXECUTE);
        $columns = [];
        foreach ($results->toArray() as $row) {
            $columns[$row['COLUMN_NAME']] = [
                'ordinal_position'          => $row['ORDINAL_POSITION'],
                'column_default'            => $row['COLUMN_DEFAULT'],
                'is_nullable'               => ('YES' == $row['IS_NULLABLE']),
                'data_type'                 => $row['DATA_TYPE'],
                'character_maximum_length'  => $row['CHARACTER_MAXIMUM_LENGTH'],
                'character_octet_length'    => $row['CHARACTER_OCTET_LENGTH'],
                'numeric_precision'         => $row['NUMERIC_PRECISION'],
                'numeric_scale'             => $row['NUMERIC_SCALE'],
                'numeric_unsigned'          => null,
                'erratas'                   => [],
            ];
        }

        $this->data['columns'][$schema][$table] = $columns;
    }

    protected function loadConstraintData($table, $schema)
    {
        if (isset($this->data['constraints'][$schema][$table])) {
            return;
        }

        $this->prepareDataHierarchy('constraints', $schema, $table);

        $isColumns = [
            ['T', 'TABLE_NAME'],
            ['TC', 'CONSTRAINT_NAME'],
            ['TC', 'CONSTRAINT_TYPE'],
            ['KCU', 'COLUMN_NAME'],
            ['CC', 'CHECK_CLAUSE'],
            ['RC', 'MATCH_OPTION'],
            ['RC', 'UPDATE_RULE'],
            ['RC', 'DELETE_RULE'],
            ['REFERENCED_TABLE_SCHEMA' => 'KCU2', 'TABLE_SCHEMA'],
            ['REFERENCED_TABLE_NAME' => 'KCU2', 'TABLE_NAME'],
            ['REFERENCED_COLUMN_NAME' => 'KCU2', 'COLUMN_NAME'],
        ];

        $p = $this->adapter->getPlatform();

        array_walk($isColumns, function (&$c) use ($p) {
            $alias = key($c);
            $c = $p->quoteIdentifierChain($c);
            if (is_string($alias)) {
                $c .= ' ' . $p->quoteIdentifier($alias);
            }
        });

        $sql = 'SELECT ' . implode(', ', $isColumns)
             . ' FROM ' . $p->quoteIdentifierChain(['INFORMATION_SCHEMA', 'TABLES']) . ' T'

             . ' INNER JOIN ' . $p->quoteIdentifierChain(['INFORMATION_SCHEMA', 'TABLE_CONSTRAINTS']) . ' TC'
             . ' ON ' . $p->quoteIdentifierChain(['T', 'TABLE_SCHEMA'])
             . '  = ' . $p->quoteIdentifierChain(['TC', 'TABLE_SCHEMA'])
             . ' AND ' . $p->quoteIdentifierChain(['T', 'TABLE_NAME'])
             . '  = ' . $p->quoteIdentifierChain(['TC', 'TABLE_NAME'])

             . ' LEFT JOIN ' . $p->quoteIdentifierChain(['INFORMATION_SCHEMA', 'KEY_COLUMN_USAGE']) . ' KCU'
             . ' ON ' . $p->quoteIdentifierChain(['TC', 'TABLE_SCHEMA'])
             . '  = ' . $p->quoteIdentifierChain(['KCU', 'TABLE_SCHEMA'])
             . ' AND ' . $p->quoteIdentifierChain(['TC', 'TABLE_NAME'])
             . '  = ' . $p->quoteIdentifierChain(['KCU', 'TABLE_NAME'])
             . ' AND ' . $p->quoteIdentifierChain(['TC', 'CONSTRAINT_NAME'])
             . '  = ' . $p->quoteIdentifierChain(['KCU', 'CONSTRAINT_NAME'])

             . ' LEFT JOIN ' . $p->quoteIdentifierChain(['INFORMATION_SCHEMA', 'CHECK_CONSTRAINTS']) . ' CC'
             . ' ON ' . $p->quoteIdentifierChain(['TC', 'CONSTRAINT_SCHEMA'])
             . '  = ' . $p->quoteIdentifierChain(['CC', 'CONSTRAINT_SCHEMA'])
             . ' AND ' . $p->quoteIdentifierChain(['TC', 'CONSTRAINT_NAME'])
             . '  = ' . $p->quoteIdentifierChain(['CC', 'CONSTRAINT_NAME'])

             . ' LEFT JOIN ' . $p->quoteIdentifierChain(['INFORMATION_SCHEMA', 'REFERENTIAL_CONSTRAINTS']) . ' RC'
             . ' ON ' . $p->quoteIdentifierChain(['TC', 'CONSTRAINT_SCHEMA'])
             . '  = ' . $p->quoteIdentifierChain(['RC', 'CONSTRAINT_SCHEMA'])
             . ' AND ' . $p->quoteIdentifierChain(['TC', 'CONSTRAINT_NAME'])
             . '  = ' . $p->quoteIdentifierChain(['RC', 'CONSTRAINT_NAME'])

             . ' LEFT JOIN ' . $p->quoteIdentifierChain(['INFORMATION_SCHEMA', 'KEY_COLUMN_USAGE']) . ' KCU2'
             . ' ON ' . $p->quoteIdentifierChain(['RC', 'UNIQUE_CONSTRAINT_SCHEMA'])
             . '  = ' . $p->quoteIdentifierChain(['KCU2', 'CONSTRAINT_SCHEMA'])
             . ' AND ' . $p->quoteIdentifierChain(['RC', 'UNIQUE_CONSTRAINT_NAME'])
             . '  = ' . $p->quoteIdentifierChain(['KCU2', 'CONSTRAINT_NAME'])
             . ' AND ' . $p->quoteIdentifierChain(['KCU', 'ORDINAL_POSITION'])
             . '  = ' . $p->quoteIdentifierChain(['KCU2', 'ORDINAL_POSITION'])

             . ' WHERE ' . $p->quoteIdentifierChain(['T', 'TABLE_NAME'])
             . ' = ' . $p->quoteTrustedValue($table)
             . ' AND ' . $p->quoteIdentifierChain(['T', 'TABLE_TYPE'])
             . ' IN (\'BASE TABLE\', \'VIEW\')';

        if ($schema != self::DEFAULT_SCHEMA) {
            $sql .= ' AND ' . $p->quoteIdentifierChain(['T', 'TABLE_SCHEMA'])
            . ' = ' . $p->quoteTrustedValue($schema);
        } else {
            $sql .= ' AND ' . $p->quoteIdentifierChain(['T', 'TABLE_SCHEMA'])
            . ' != \'INFORMATION_SCHEMA\'';
        }

        $sql .= ' ORDER BY CASE ' . $p->quoteIdentifierChain(['TC', 'CONSTRAINT_TYPE'])
              . " WHEN 'PRIMARY KEY' THEN 1"
              . " WHEN 'UNIQUE' THEN 2"
              . " WHEN 'FOREIGN KEY' THEN 3"
              . " WHEN 'CHECK' THEN 4"
              . " ELSE 5 END"
              . ', ' . $p->quoteIdentifierChain(['TC', 'CONSTRAINT_NAME'])
              . ', ' . $p->quoteIdentifierChain(['KCU', 'ORDINAL_POSITION']);

        $results = $this->adapter->query($sql, Adapter::QUERY_MODE_EXECUTE);

        $name = null;
        $constraints = [];
        $isFK = false;
        foreach ($results->toArray() as $row) {
            if ($row['CONSTRAINT_NAME'] !== $name) {
                $name = $row['CONSTRAINT_NAME'];
                $constraints[$name] = [
                    'constraint_name' => $name,
                    'constraint_type' => $row['CONSTRAINT_TYPE'],
                    'table_name'      => $row['TABLE_NAME'],
                ];
                if ('CHECK' == $row['CONSTRAINT_TYPE']) {
                    $constraints[$name]['check_clause'] = $row['CHECK_CLAUSE'];
                    continue;
                }
                $constraints[$name]['columns'] = [];
                $isFK = ('FOREIGN KEY' == $row['CONSTRAINT_TYPE']);
                if ($isFK) {
                    $constraints[$name]['referenced_table_schema'] = $row['REFERENCED_TABLE_SCHEMA'];
                    $constraints[$name]['referenced_table_name']   = $row['REFERENCED_TABLE_NAME'];
                    $constraints[$name]['referenced_columns']      = [];
                    $constraints[$name]['match_option']       = $row['MATCH_OPTION'];
                    $constraints[$name]['update_rule']        = $row['UPDATE_RULE'];
                    $constraints[$name]['delete_rule']        = $row['DELETE_RULE'];
                }
            }
            $constraints[$name]['columns'][] = $row['COLUMN_NAME'];
            if ($isFK) {
                $constraints[$name]['referenced_columns'][] = $row['REFERENCED_COLUMN_NAME'];
            }
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

        $isColumns = [
            'TRIGGER_NAME',
            'EVENT_MANIPULATION',
            'EVENT_OBJECT_CATALOG',
            'EVENT_OBJECT_SCHEMA',
            'EVENT_OBJECT_TABLE',
            'ACTION_ORDER',
            'ACTION_CONDITION',
            'ACTION_STATEMENT',
            'ACTION_ORIENTATION',
            'ACTION_TIMING',
            'ACTION_REFERENCE_OLD_TABLE',
            'ACTION_REFERENCE_NEW_TABLE',
            'ACTION_REFERENCE_OLD_ROW',
            'ACTION_REFERENCE_NEW_ROW',
            'CREATED',
        ];

        array_walk($isColumns, function (&$c) use ($p) {
            $c = $p->quoteIdentifier($c);
        });

        $sql = 'SELECT ' . implode(', ', $isColumns)
            . ' FROM ' . $p->quoteIdentifierChain(['INFORMATION_SCHEMA', 'TRIGGERS'])
            . ' WHERE ';

        if ($schema != self::DEFAULT_SCHEMA) {
            $sql .= $p->quoteIdentifier('TRIGGER_SCHEMA')
                . ' = ' . $p->quoteTrustedValue($schema);
        } else {
            $sql .= $p->quoteIdentifier('TRIGGER_SCHEMA')
                . ' != \'INFORMATION_SCHEMA\'';
        }

        $results = $this->adapter->query($sql, Adapter::QUERY_MODE_EXECUTE);

        $data = [];
        foreach ($results->toArray() as $row) {
            $row = array_change_key_case($row, CASE_LOWER);
            if (null !== $row['created']) {
                $row['created'] = new \DateTime($row['created']);
            }
            $data[$row['trigger_name']] = $row;
        }

        $this->data['triggers'][$schema] = $data;
    }
}
