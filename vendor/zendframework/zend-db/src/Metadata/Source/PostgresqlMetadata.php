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

class PostgresqlMetadata extends AbstractSource
{

    protected function loadSchemaData()
    {
        if (isset($this->data['schemas'])) {
            return;
        }
        $this->prepareDataHierarchy('schemas');

        $p = $this->adapter->getPlatform();

        $sql = 'SELECT ' . $p->quoteIdentifier('schema_name')
            . ' FROM ' . $p->quoteIdentifierChain(array('information_schema', 'schemata'))
            . ' WHERE ' . $p->quoteIdentifier('schema_name')
            . ' != \'information_schema\''
            . ' AND ' . $p->quoteIdentifier('schema_name') . " NOT LIKE 'pg_%'";

        $results = $this->adapter->query($sql, Adapter::QUERY_MODE_EXECUTE);

        $schemas = array();
        foreach ($results->toArray() as $row) {
            $schemas[] = $row['schema_name'];
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
            array('t', 'table_name'),
            array('t', 'table_type'),
            array('v', 'view_definition'),
            array('v', 'check_option'),
            array('v', 'is_updatable'),
        );

        array_walk($isColumns, function (&$c) use ($p) { $c = $p->quoteIdentifierChain($c); });

        $sql = 'SELECT ' . implode(', ', $isColumns)
            . ' FROM ' . $p->quoteIdentifierChain(array('information_schema', 'tables')) . ' t'

            . ' LEFT JOIN ' . $p->quoteIdentifierChain(array('information_schema', 'views')) . ' v'
            . ' ON ' . $p->quoteIdentifierChain(array('t', 'table_schema'))
            . '  = ' . $p->quoteIdentifierChain(array('v', 'table_schema'))
            . ' AND ' . $p->quoteIdentifierChain(array('t', 'table_name'))
            . '  = ' . $p->quoteIdentifierChain(array('v', 'table_name'))

            . ' WHERE ' . $p->quoteIdentifierChain(array('t', 'table_type'))
            . ' IN (\'BASE TABLE\', \'VIEW\')';

        if ($schema != self::DEFAULT_SCHEMA) {
            $sql .= ' AND ' . $p->quoteIdentifierChain(array('t', 'table_schema'))
                . ' = ' . $p->quoteTrustedValue($schema);
        } else {
            $sql .= ' AND ' . $p->quoteIdentifierChain(array('t', 'table_schema'))
                . ' != \'information_schema\'';
        }

        $results = $this->adapter->query($sql, Adapter::QUERY_MODE_EXECUTE);

        $tables = array();
        foreach ($results->toArray() as $row) {
            $tables[$row['table_name']] = array(
                'table_type' => $row['table_type'],
                'view_definition' => $row['view_definition'],
                'check_option' => $row['check_option'],
                'is_updatable' => ('YES' == $row['is_updatable']),
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

        $platform = $this->adapter->getPlatform();

        $isColumns = array(
            'table_name',
            'column_name',
            'ordinal_position',
            'column_default',
            'is_nullable',
            'data_type',
            'character_maximum_length',
            'character_octet_length',
            'numeric_precision',
            'numeric_scale',
        );

        array_walk($isColumns, function (&$c) use ($platform) { $c = $platform->quoteIdentifier($c); });

        $sql = 'SELECT ' . implode(', ', $isColumns)
            . ' FROM ' . $platform->quoteIdentifier('information_schema')
            . $platform->getIdentifierSeparator() . $platform->quoteIdentifier('columns')
            . ' WHERE ' . $platform->quoteIdentifier('table_schema')
            . ' != \'information\''
            . ' AND ' . $platform->quoteIdentifier('table_name')
            . ' = ' . $platform->quoteTrustedValue($table);

        if ($schema != '__DEFAULT_SCHEMA__') {
            $sql .= ' AND ' . $platform->quoteIdentifier('table_schema')
                . ' = ' . $platform->quoteTrustedValue($schema);
        }

        $results = $this->adapter->query($sql, Adapter::QUERY_MODE_EXECUTE);
        $columns = array();
        foreach ($results->toArray() as $row) {
            $columns[$row['column_name']] = array(
                'ordinal_position'          => $row['ordinal_position'],
                'column_default'            => $row['column_default'],
                'is_nullable'               => ('YES' == $row['is_nullable']),
                'data_type'                 => $row['data_type'],
                'character_maximum_length'  => $row['character_maximum_length'],
                'character_octet_length'    => $row['character_octet_length'],
                'numeric_precision'         => $row['numeric_precision'],
                'numeric_scale'             => $row['numeric_scale'],
                'numeric_unsigned'          => null,
                'erratas'                   => array(),
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
            array('t', 'table_name'),
            array('tc', 'constraint_name'),
            array('tc', 'constraint_type'),
            array('kcu', 'column_name'),
            array('cc', 'check_clause'),
            array('rc', 'match_option'),
            array('rc', 'update_rule'),
            array('rc', 'delete_rule'),
            array('referenced_table_schema' => 'kcu2', 'table_schema'),
            array('referenced_table_name' => 'kcu2', 'table_name'),
            array('referenced_column_name' => 'kcu2', 'column_name'),
        );

        $p = $this->adapter->getPlatform();

        array_walk($isColumns, function (&$c) use ($p) {
            $alias = key($c);
            $c = $p->quoteIdentifierChain($c);
            if (is_string($alias)) {
                $c .= ' ' . $p->quoteIdentifier($alias);
            }
        });

        $sql = 'SELECT ' . implode(', ', $isColumns)
             . ' FROM ' . $p->quoteIdentifierChain(array('information_schema', 'tables')) . ' t'

             . ' INNER JOIN ' . $p->quoteIdentifierChain(array('information_schema', 'table_constraints')) . ' tc'
             . ' ON ' . $p->quoteIdentifierChain(array('t', 'table_schema'))
             . '  = ' . $p->quoteIdentifierChain(array('tc', 'table_schema'))
             . ' AND ' . $p->quoteIdentifierChain(array('t', 'table_name'))
             . '  = ' . $p->quoteIdentifierChain(array('tc', 'table_name'))

             . ' LEFT JOIN ' . $p->quoteIdentifierChain(array('information_schema', 'key_column_usage')) . ' kcu'
             . ' ON ' . $p->quoteIdentifierChain(array('tc', 'table_schema'))
             . '  = ' . $p->quoteIdentifierChain(array('kcu', 'table_schema'))
             . ' AND ' . $p->quoteIdentifierChain(array('tc', 'table_name'))
             . '  = ' . $p->quoteIdentifierChain(array('kcu', 'table_name'))
             . ' AND ' . $p->quoteIdentifierChain(array('tc', 'constraint_name'))
             . '  = ' . $p->quoteIdentifierChain(array('kcu', 'constraint_name'))

             . ' LEFT JOIN ' . $p->quoteIdentifierChain(array('information_schema', 'check_constraints')) . ' cc'
             . ' ON ' . $p->quoteIdentifierChain(array('tc', 'constraint_schema'))
             . '  = ' . $p->quoteIdentifierChain(array('cc', 'constraint_schema'))
             . ' AND ' . $p->quoteIdentifierChain(array('tc', 'constraint_name'))
             . '  = ' . $p->quoteIdentifierChain(array('cc', 'constraint_name'))

             . ' LEFT JOIN ' . $p->quoteIdentifierChain(array('information_schema', 'referential_constraints')) . ' rc'
             . ' ON ' . $p->quoteIdentifierChain(array('tc', 'constraint_schema'))
             . '  = ' . $p->quoteIdentifierChain(array('rc', 'constraint_schema'))
             . ' AND ' . $p->quoteIdentifierChain(array('tc', 'constraint_name'))
             . '  = ' . $p->quoteIdentifierChain(array('rc', 'constraint_name'))

             . ' LEFT JOIN ' . $p->quoteIdentifierChain(array('information_schema', 'key_column_usage')) . ' kcu2'
             . ' ON ' . $p->quoteIdentifierChain(array('rc', 'unique_constraint_schema'))
             . '  = ' . $p->quoteIdentifierChain(array('kcu2', 'constraint_schema'))
             . ' AND ' . $p->quoteIdentifierChain(array('rc', 'unique_constraint_name'))
             . '  = ' . $p->quoteIdentifierChain(array('kcu2', 'constraint_name'))
             . ' AND ' . $p->quoteIdentifierChain(array('kcu', 'position_in_unique_constraint'))
             . '  = ' . $p->quoteIdentifierChain(array('kcu2', 'ordinal_position'))

             . ' WHERE ' . $p->quoteIdentifierChain(array('t', 'table_name'))
             . ' = ' . $p->quoteTrustedValue($table)
             . ' AND ' . $p->quoteIdentifierChain(array('t', 'table_type'))
             . ' IN (\'BASE TABLE\', \'VIEW\')';

        if ($schema != self::DEFAULT_SCHEMA) {
            $sql .= ' AND ' . $p->quoteIdentifierChain(array('t', 'table_schema'))
            . ' = ' . $p->quoteTrustedValue($schema);
        } else {
            $sql .= ' AND ' . $p->quoteIdentifierChain(array('t', 'table_schema'))
            . ' != \'information_schema\'';
        }

        $sql .= ' ORDER BY CASE ' . $p->quoteIdentifierChain(array('tc', 'constraint_type'))
              . " WHEN 'PRIMARY KEY' THEN 1"
              . " WHEN 'UNIQUE' THEN 2"
              . " WHEN 'FOREIGN KEY' THEN 3"
              . " WHEN 'CHECK' THEN 4"
              . " ELSE 5 END"
              . ', ' . $p->quoteIdentifierChain(array('tc', 'constraint_name'))
              . ', ' . $p->quoteIdentifierChain(array('kcu', 'ordinal_position'));

        $results = $this->adapter->query($sql, Adapter::QUERY_MODE_EXECUTE);

        $name = null;
        $constraints = array();
        foreach ($results->toArray() as $row) {
            if ($row['constraint_name'] !== $name) {
                $name = $row['constraint_name'];
                $constraints[$name] = array(
                    'constraint_name' => $name,
                    'constraint_type' => $row['constraint_type'],
                    'table_name'      => $row['table_name'],
                );
                if ('CHECK' == $row['constraint_type']) {
                    $constraints[$name]['check_clause'] = $row['check_clause'];
                    continue;
                }
                $constraints[$name]['columns'] = array();
                $isFK = ('FOREIGN KEY' == $row['constraint_type']);
                if ($isFK) {
                    $constraints[$name]['referenced_table_schema'] = $row['referenced_table_schema'];
                    $constraints[$name]['referenced_table_name']   = $row['referenced_table_name'];
                    $constraints[$name]['referenced_columns']      = array();
                    $constraints[$name]['match_option']       = $row['match_option'];
                    $constraints[$name]['update_rule']        = $row['update_rule'];
                    $constraints[$name]['delete_rule']        = $row['delete_rule'];
                }
            }
            $constraints[$name]['columns'][] = $row['column_name'];
            if ($isFK) {
                $constraints[$name]['referenced_columns'][] = $row['referenced_column_name'];
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

        $isColumns = array(
            'trigger_name',
            'event_manipulation',
            'event_object_catalog',
            'event_object_schema',
            'event_object_table',
            'action_order',
            'action_condition',
            'action_statement',
            'action_orientation',
            array('action_timing' => 'condition_timing'),
            array('action_reference_old_table' => 'condition_reference_old_table'),
            array('action_reference_new_table' => 'condition_reference_new_table'),
            'created',
        );

        array_walk($isColumns, function (&$c) use ($p) {
            if (is_array($c)) {
                $alias = key($c);
                $c = $p->quoteIdentifierChain($c);
                if (is_string($alias)) {
                    $c .= ' ' . $p->quoteIdentifier($alias);
                }
            } else {
                $c = $p->quoteIdentifier($c);
            }
        });

        $sql = 'SELECT ' . implode(', ', $isColumns)
            . ' FROM ' . $p->quoteIdentifierChain(array('information_schema', 'triggers'))
            . ' WHERE ';

        if ($schema != self::DEFAULT_SCHEMA) {
            $sql .= $p->quoteIdentifier('trigger_schema')
                . ' = ' . $p->quoteTrustedValue($schema);
        } else {
            $sql .= $p->quoteIdentifier('trigger_schema')
                . ' != \'information_schema\'';
        }

        $results = $this->adapter->query($sql, Adapter::QUERY_MODE_EXECUTE);

        $data = array();
        foreach ($results->toArray() as $row) {
            $row = array_change_key_case($row, CASE_LOWER);
            $row['action_reference_old_row'] = 'OLD';
            $row['action_reference_new_row'] = 'NEW';
            if (null !== $row['created']) {
                $row['created'] = new \DateTime($row['created']);
            }
            $data[$row['trigger_name']] = $row;
        }

        $this->data['triggers'][$schema] = $data;
    }


}
