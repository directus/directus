<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2014 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace Zend\Db\Metadata\Source;

use Zend\Db\Adapter\Adapter;

class MysqlMetadata extends AbstractSource
{
    protected function loadSchemaData()
    {
        if (isset($this->data['schemas'])) {
            return;
        }
        $this->prepareDataHierarchy('schemas');

        $p = $this->adapter->getPlatform();

        $sql = 'SELECT ' . $p->quoteIdentifier('SCHEMA_NAME')
             . ' FROM ' . $p->quoteIdentifierChain(array('INFORMATION_SCHEMA', 'SCHEMATA'))
             . ' WHERE ' . $p->quoteIdentifier('SCHEMA_NAME')
             . ' != \'INFORMATION_SCHEMA\'';

        $results = $this->adapter->query($sql, Adapter::QUERY_MODE_EXECUTE);

        $schemas = array();
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

        $isColumns = array(
            array('T', 'TABLE_NAME'),
            array('T', 'TABLE_TYPE'),
            array('V', 'VIEW_DEFINITION'),
            array('V', 'CHECK_OPTION'),
            array('V', 'IS_UPDATABLE'),
        );

        array_walk($isColumns, function (&$c) use ($p) { $c = $p->quoteIdentifierChain($c); });

        $sql = 'SELECT ' . implode(', ', $isColumns)
             . ' FROM ' . $p->quoteIdentifierChain(array('INFORMATION_SCHEMA', 'TABLES')) . 'T'

             . ' LEFT JOIN ' . $p->quoteIdentifierChain(array('INFORMATION_SCHEMA', 'VIEWS')) . ' V'
             . ' ON ' . $p->quoteIdentifierChain(array('T', 'TABLE_SCHEMA'))
             . '  = ' . $p->quoteIdentifierChain(array('V', 'TABLE_SCHEMA'))
             . ' AND ' . $p->quoteIdentifierChain(array('T', 'TABLE_NAME'))
             . '  = ' . $p->quoteIdentifierChain(array('V', 'TABLE_NAME'))

             . ' WHERE ' . $p->quoteIdentifierChain(array('T', 'TABLE_TYPE'))
             . ' IN (\'BASE TABLE\', \'VIEW\')';

        if ($schema != self::DEFAULT_SCHEMA) {
            $sql .= ' AND ' . $p->quoteIdentifierChain(array('T', 'TABLE_SCHEMA'))
                  . ' = ' . $p->quoteTrustedValue($schema);
        } else {
            $sql .= ' AND ' . $p->quoteIdentifierChain(array('T', 'TABLE_SCHEMA'))
                  . ' != \'INFORMATION_SCHEMA\'';
        }

        $results = $this->adapter->query($sql, Adapter::QUERY_MODE_EXECUTE);

        $tables = array();
        foreach ($results->toArray() as $row) {
            $tables[$row['TABLE_NAME']] = array(
                'table_type' => $row['TABLE_TYPE'],
                'view_definition' => $row['VIEW_DEFINITION'],
                'check_option' => $row['CHECK_OPTION'],
                'is_updatable' => ('YES' == $row['IS_UPDATABLE']),
            );
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

        $isColumns = array(
            array('C', 'ORDINAL_POSITION'),
            array('C', 'COLUMN_DEFAULT'),
            array('C', 'IS_NULLABLE'),
            array('C', 'DATA_TYPE'),
            array('C', 'CHARACTER_MAXIMUM_LENGTH'),
            array('C', 'CHARACTER_OCTET_LENGTH'),
            array('C', 'NUMERIC_PRECISION'),
            array('C', 'NUMERIC_SCALE'),
            array('C', 'COLUMN_NAME'),
            array('C', 'COLUMN_TYPE'),
        );

        array_walk($isColumns, function (&$c) use ($p) { $c = $p->quoteIdentifierChain($c); });

        $sql = 'SELECT ' . implode(', ', $isColumns)
             . ' FROM ' . $p->quoteIdentifierChain(array('INFORMATION_SCHEMA', 'TABLES')) . 'T'
             . ' INNER JOIN ' . $p->quoteIdentifierChain(array('INFORMATION_SCHEMA', 'COLUMNS')) . 'C'
             . ' ON ' . $p->quoteIdentifierChain(array('T', 'TABLE_SCHEMA'))
             . '  = ' . $p->quoteIdentifierChain(array('C', 'TABLE_SCHEMA'))
             . ' AND ' . $p->quoteIdentifierChain(array('T', 'TABLE_NAME'))
             . '  = ' . $p->quoteIdentifierChain(array('C', 'TABLE_NAME'))
             . ' WHERE ' . $p->quoteIdentifierChain(array('T', 'TABLE_TYPE'))
             . ' IN (\'BASE TABLE\', \'VIEW\')'
             . ' AND ' . $p->quoteIdentifierChain(array('T', 'TABLE_NAME'))
             . '  = ' . $p->quoteTrustedValue($table);

        if ($schema != self::DEFAULT_SCHEMA) {
            $sql .= ' AND ' . $p->quoteIdentifierChain(array('T', 'TABLE_SCHEMA'))
                  . ' = ' . $p->quoteTrustedValue($schema);
        } else {
            $sql .= ' AND ' . $p->quoteIdentifierChain(array('T', 'TABLE_SCHEMA'))
                  . ' != \'INFORMATION_SCHEMA\'';
        }

        $results = $this->adapter->query($sql, Adapter::QUERY_MODE_EXECUTE);
        $columns = array();
        foreach ($results->toArray() as $row) {
            $erratas = array();
            $matches = array();
            if (preg_match('/^(?:enum|set)\((.+)\)$/i', $row['COLUMN_TYPE'], $matches)) {
                $permittedValues = $matches[1];
                if (preg_match_all("/\\s*'((?:[^']++|'')*+)'\\s*(?:,|\$)/", $permittedValues, $matches, PREG_PATTERN_ORDER)) {
                    $permittedValues = str_replace("''", "'", $matches[1]);
                } else {
                    $permittedValues = array($permittedValues);
                }
                $erratas['permitted_values'] = $permittedValues;
            }
            $columns[$row['COLUMN_NAME']] = array(
                'ordinal_position'          => $row['ORDINAL_POSITION'],
                'column_default'            => $row['COLUMN_DEFAULT'],
                'is_nullable'               => ('YES' == $row['IS_NULLABLE']),
                'data_type'                 => $row['DATA_TYPE'],
                'character_maximum_length'  => $row['CHARACTER_MAXIMUM_LENGTH'],
                'character_octet_length'    => $row['CHARACTER_OCTET_LENGTH'],
                'numeric_precision'         => $row['NUMERIC_PRECISION'],
                'numeric_scale'             => $row['NUMERIC_SCALE'],
                'numeric_unsigned'          => (false !== strpos($row['COLUMN_TYPE'], 'unsigned')),
                'erratas'                   => $erratas,
            );
        }

        $this->data['columns'][$schema][$table] = $columns;
    }

    protected function loadConstraintData($table, $schema)
    {
        if (isset($this->data['constraints'][$schema][$table])) {
            return;
        }

        $this->prepareDataHierarchy('constraints', $schema, $table);

        $isColumns = array(
            array('T', 'TABLE_NAME'),
            array('TC', 'CONSTRAINT_NAME'),
            array('TC', 'CONSTRAINT_TYPE'),
            array('KCU', 'COLUMN_NAME'),
            array('RC', 'MATCH_OPTION'),
            array('RC', 'UPDATE_RULE'),
            array('RC', 'DELETE_RULE'),
            array('KCU', 'REFERENCED_TABLE_SCHEMA'),
            array('KCU', 'REFERENCED_TABLE_NAME'),
            array('KCU', 'REFERENCED_COLUMN_NAME'),
        );

        $p = $this->adapter->getPlatform();

        array_walk($isColumns, function (&$c) use ($p) {
            $c = $p->quoteIdentifierChain($c);
        });

        $sql = 'SELECT ' . implode(', ', $isColumns)
             . ' FROM ' . $p->quoteIdentifierChain(array('INFORMATION_SCHEMA', 'TABLES')) . ' T'

             . ' INNER JOIN ' . $p->quoteIdentifierChain(array('INFORMATION_SCHEMA', 'TABLE_CONSTRAINTS')) . ' TC'
             . ' ON ' . $p->quoteIdentifierChain(array('T', 'TABLE_SCHEMA'))
             . '  = ' . $p->quoteIdentifierChain(array('TC', 'TABLE_SCHEMA'))
             . ' AND ' . $p->quoteIdentifierChain(array('T', 'TABLE_NAME'))
             . '  = ' . $p->quoteIdentifierChain(array('TC', 'TABLE_NAME'))

             . ' LEFT JOIN ' . $p->quoteIdentifierChain(array('INFORMATION_SCHEMA', 'KEY_COLUMN_USAGE')) . ' KCU'
             . ' ON ' . $p->quoteIdentifierChain(array('TC', 'TABLE_SCHEMA'))
             . '  = ' . $p->quoteIdentifierChain(array('KCU', 'TABLE_SCHEMA'))
             . ' AND ' . $p->quoteIdentifierChain(array('TC', 'TABLE_NAME'))
             . '  = ' . $p->quoteIdentifierChain(array('KCU', 'TABLE_NAME'))
             . ' AND ' . $p->quoteIdentifierChain(array('TC', 'CONSTRAINT_NAME'))
             . '  = ' . $p->quoteIdentifierChain(array('KCU', 'CONSTRAINT_NAME'))

             . ' LEFT JOIN ' . $p->quoteIdentifierChain(array('INFORMATION_SCHEMA', 'REFERENTIAL_CONSTRAINTS')) . ' RC'
             . ' ON ' . $p->quoteIdentifierChain(array('TC', 'CONSTRAINT_SCHEMA'))
             . '  = ' . $p->quoteIdentifierChain(array('RC', 'CONSTRAINT_SCHEMA'))
             . ' AND ' . $p->quoteIdentifierChain(array('TC', 'CONSTRAINT_NAME'))
             . '  = ' . $p->quoteIdentifierChain(array('RC', 'CONSTRAINT_NAME'))

             . ' WHERE ' . $p->quoteIdentifierChain(array('T', 'TABLE_NAME'))
             . ' = ' . $p->quoteTrustedValue($table)
             . ' AND ' . $p->quoteIdentifierChain(array('T', 'TABLE_TYPE'))
             . ' IN (\'BASE TABLE\', \'VIEW\')';

        if ($schema != self::DEFAULT_SCHEMA) {
            $sql .= ' AND ' . $p->quoteIdentifierChain(array('T', 'TABLE_SCHEMA'))
            . ' = ' . $p->quoteTrustedValue($schema);
        } else {
            $sql .= ' AND ' . $p->quoteIdentifierChain(array('T', 'TABLE_SCHEMA'))
            . ' != \'INFORMATION_SCHEMA\'';
        }

        $sql .= ' ORDER BY CASE ' . $p->quoteIdentifierChain(array('TC', 'CONSTRAINT_TYPE'))
              . " WHEN 'PRIMARY KEY' THEN 1"
              . " WHEN 'UNIQUE' THEN 2"
              . " WHEN 'FOREIGN KEY' THEN 3"
              . " ELSE 4 END"

              . ', ' . $p->quoteIdentifierChain(array('TC', 'CONSTRAINT_NAME'))
              . ', ' . $p->quoteIdentifierChain(array('KCU', 'ORDINAL_POSITION'));

        $results = $this->adapter->query($sql, Adapter::QUERY_MODE_EXECUTE);

        $realName = null;
        $constraints = array();
        foreach ($results->toArray() as $row) {
            if ($row['CONSTRAINT_NAME'] !== $realName) {
                $realName = $row['CONSTRAINT_NAME'];
                $isFK = ('FOREIGN KEY' == $row['CONSTRAINT_TYPE']);
                if ($isFK) {
                    $name = $realName;
                } else {
                    $name = '_zf_' . $row['TABLE_NAME'] . '_' . $realName;
                }
                $constraints[$name] = array(
                    'constraint_name' => $name,
                    'constraint_type' => $row['CONSTRAINT_TYPE'],
                    'table_name'      => $row['TABLE_NAME'],
                    'columns'         => array(),
                );
                if ($isFK) {
                    $constraints[$name]['referenced_table_schema'] = $row['REFERENCED_TABLE_SCHEMA'];
                    $constraints[$name]['referenced_table_name']   = $row['REFERENCED_TABLE_NAME'];
                    $constraints[$name]['referenced_columns']      = array();
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

    protected function loadConstraintDataNames($schema)
    {
        if (isset($this->data['constraint_names'][$schema])) {
            return;
        }

        $this->prepareDataHierarchy('constraint_names', $schema);

        $p = $this->adapter->getPlatform();

        $isColumns = array(
            array('TC', 'TABLE_NAME'),
            array('TC', 'CONSTRAINT_NAME'),
            array('TC', 'CONSTRAINT_TYPE'),
        );

        array_walk($isColumns, function (&$c) use ($p) {
            $c = $p->quoteIdentifierChain($c);
        });

        $sql = 'SELECT ' . implode(', ', $isColumns)
        . ' FROM ' . $p->quoteIdentifierChain(array('INFORMATION_SCHEMA', 'TABLES')) . 'T'
        . ' INNER JOIN ' . $p->quoteIdentifierChain(array('INFORMATION_SCHEMA', 'TABLE_CONSTRAINTS')) . 'TC'
        . ' ON ' . $p->quoteIdentifierChain(array('T', 'TABLE_SCHEMA'))
        . '  = ' . $p->quoteIdentifierChain(array('TC', 'TABLE_SCHEMA'))
        . ' AND ' . $p->quoteIdentifierChain(array('T', 'TABLE_NAME'))
        . '  = ' . $p->quoteIdentifierChain(array('TC', 'TABLE_NAME'))
        . ' WHERE ' . $p->quoteIdentifierChain(array('T', 'TABLE_TYPE'))
        . ' IN (\'BASE TABLE\', \'VIEW\')';

        if ($schema != self::DEFAULT_SCHEMA) {
            $sql .= ' AND ' . $p->quoteIdentifierChain(array('T', 'TABLE_SCHEMA'))
            . ' = ' . $p->quoteTrustedValue($schema);
        } else {
            $sql .= ' AND ' . $p->quoteIdentifierChain(array('T', 'TABLE_SCHEMA'))
            . ' != \'INFORMATION_SCHEMA\'';
        }

        $results = $this->adapter->query($sql, Adapter::QUERY_MODE_EXECUTE);

        $data = array();
        foreach ($results->toArray() as $row) {
            $data[] = array_change_key_case($row, CASE_LOWER);
        }

        $this->data['constraint_names'][$schema] = $data;
    }

    protected function loadConstraintDataKeys($schema)
    {
        if (isset($this->data['constraint_keys'][$schema])) {
            return;
        }

        $this->prepareDataHierarchy('constraint_keys', $schema);

        $p = $this->adapter->getPlatform();

        $isColumns = array(
            array('T', 'TABLE_NAME'),
            array('KCU', 'CONSTRAINT_NAME'),
            array('KCU', 'COLUMN_NAME'),
            array('KCU', 'ORDINAL_POSITION'),
        );

        array_walk($isColumns, function (&$c) use ($p) {
            $c = $p->quoteIdentifierChain($c);
        });

        $sql = 'SELECT ' . implode(', ', $isColumns)
        . ' FROM ' . $p->quoteIdentifierChain(array('INFORMATION_SCHEMA', 'TABLES')) . 'T'

        . ' INNER JOIN ' . $p->quoteIdentifierChain(array('INFORMATION_SCHEMA', 'KEY_COLUMN_USAGE')) . 'KCU'
        . ' ON ' . $p->quoteIdentifierChain(array('T', 'TABLE_SCHEMA'))
        . '  = ' . $p->quoteIdentifierChain(array('KCU', 'TABLE_SCHEMA'))
        . ' AND ' . $p->quoteIdentifierChain(array('T', 'TABLE_NAME'))
        . '  = ' . $p->quoteIdentifierChain(array('KCU', 'TABLE_NAME'))

        . ' WHERE ' . $p->quoteIdentifierChain(array('T', 'TABLE_TYPE'))
        . ' IN (\'BASE TABLE\', \'VIEW\')';

        if ($schema != self::DEFAULT_SCHEMA) {
            $sql .= ' AND ' . $p->quoteIdentifierChain(array('T', 'TABLE_SCHEMA'))
            . ' = ' . $p->quoteTrustedValue($schema);
        } else {
            $sql .= ' AND ' . $p->quoteIdentifierChain(array('T', 'TABLE_SCHEMA'))
            . ' != \'INFORMATION_SCHEMA\'';
        }

        $results = $this->adapter->query($sql, Adapter::QUERY_MODE_EXECUTE);

        $data = array();
        foreach ($results->toArray() as $row) {
            $data[] = array_change_key_case($row, CASE_LOWER);
        }

        $this->data['constraint_keys'][$schema] = $data;
    }

    protected function loadConstraintReferences($table, $schema)
    {
        parent::loadConstraintReferences($table, $schema);

        $p = $this->adapter->getPlatform();

        $isColumns = array(
            array('RC', 'TABLE_NAME'),
            array('RC', 'CONSTRAINT_NAME'),
            array('RC', 'UPDATE_RULE'),
            array('RC', 'DELETE_RULE'),
            array('KCU', 'REFERENCED_TABLE_SCHEMA'),
            array('KCU', 'REFERENCED_TABLE_NAME'),
            array('KCU', 'REFERENCED_COLUMN_NAME'),
        );

        array_walk($isColumns, function (&$c) use ($p) {
            $c = $p->quoteIdentifierChain($c);
        });

        $sql = 'SELECT ' . implode(', ', $isColumns)
        . 'FROM ' . $p->quoteIdentifierChain(array('INFORMATION_SCHEMA', 'TABLES')) . 'T'

        . ' INNER JOIN ' . $p->quoteIdentifierChain(array('INFORMATION_SCHEMA', 'REFERENTIAL_CONSTRAINTS')) . 'RC'
        . ' ON ' . $p->quoteIdentifierChain(array('T', 'TABLE_SCHEMA'))
        . '  = ' . $p->quoteIdentifierChain(array('RC', 'CONSTRAINT_SCHEMA'))
        . ' AND ' . $p->quoteIdentifierChain(array('T', 'TABLE_NAME'))
        . '  = ' . $p->quoteIdentifierChain(array('RC', 'TABLE_NAME'))

        . ' INNER JOIN ' . $p->quoteIdentifierChain(array('INFORMATION_SCHEMA', 'KEY_COLUMN_USAGE')) . 'KCU'
        . ' ON ' . $p->quoteIdentifierChain(array('RC', 'CONSTRAINT_SCHEMA'))
        . '  = ' . $p->quoteIdentifierChain(array('KCU', 'TABLE_SCHEMA'))
        . ' AND ' . $p->quoteIdentifierChain(array('RC', 'TABLE_NAME'))
        . '  = ' . $p->quoteIdentifierChain(array('KCU', 'TABLE_NAME'))
        . ' AND ' . $p->quoteIdentifierChain(array('RC', 'CONSTRAINT_NAME'))
        . '  = ' . $p->quoteIdentifierChain(array('KCU', 'CONSTRAINT_NAME'))

        . 'WHERE ' . $p->quoteIdentifierChain(array('T', 'TABLE_TYPE'))
        . ' IN (\'BASE TABLE\', \'VIEW\')';

        if ($schema != self::DEFAULT_SCHEMA) {
            $sql .= ' AND ' . $p->quoteIdentifierChain(array('T', 'TABLE_SCHEMA'))
            . ' = ' . $p->quoteTrustedValue($schema);
        } else {
            $sql .= ' AND ' . $p->quoteIdentifierChain(array('T', 'TABLE_SCHEMA'))
            . ' != \'INFORMATION_SCHEMA\'';
        }

        $results = $this->adapter->query($sql, Adapter::QUERY_MODE_EXECUTE);

        $data = array();
        foreach ($results->toArray() as $row) {
            $data[] = array_change_key_case($row, CASE_LOWER);
        }

        $this->data['constraint_references'][$schema] = $data;
    }

    protected function loadTriggerData($schema)
    {
        if (isset($this->data['triggers'][$schema])) {
            return;
        }

        $this->prepareDataHierarchy('triggers', $schema);

        $p = $this->adapter->getPlatform();

        $isColumns = array(
//            'TRIGGER_CATALOG',
//            'TRIGGER_SCHEMA',
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
        );

        array_walk($isColumns, function (&$c) use ($p) {
            $c = $p->quoteIdentifier($c);
        });

        $sql = 'SELECT ' . implode(', ', $isColumns)
        . ' FROM ' . $p->quoteIdentifierChain(array('INFORMATION_SCHEMA', 'TRIGGERS'))
        . ' WHERE ';

        if ($schema != self::DEFAULT_SCHEMA) {
            $sql .= $p->quoteIdentifier('TRIGGER_SCHEMA')
            . ' = ' . $p->quoteTrustedValue($schema);
        } else {
            $sql .= $p->quoteIdentifier('TRIGGER_SCHEMA')
            . ' != \'INFORMATION_SCHEMA\'';
        }

        $results = $this->adapter->query($sql, Adapter::QUERY_MODE_EXECUTE);

        $data = array();
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
