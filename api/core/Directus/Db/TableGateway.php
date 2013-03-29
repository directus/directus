<?php

namespace Directus\Db;

use Zend\Db\Sql\Sql;

class TableGateway extends \Zend\Db\TableGateway\TableGateway {

    protected $many_to_one_uis = array('many_to_one', 'single_media');

    public function getEntries($params = array()) {
        // tmp transitional.
        global $db;

        $defaultParams = array(
            'order_column' => 'id', // @todo validate $params['order_*']
            'order_direction' => 'DESC',
            'fields' => '*',
            'per_page' => 500,
            'skip' => 0,
            'id' => -1,
            'search' => null,
            'active' => null
        );

        if(isset($params['per_page']) && isset($params['current_page']))
            $params['skip'] = $params['current_page'] * $params['per_page'];

        if(isset($params['fields']) && is_array($params['fields']))
            $params['fields'] = array_merge(array('id'), $params['fields']);

        $params = array_merge($defaultParams, $params);

        $platform = $this->adapter->platform; // use for quoting

        // Get table column schema
        $table_schema = $db->get_table($this->table);

        // Separate alias fields from table schema array
        $alias_fields = $this->filterSchemaAliasFields($table_schema); // (fmrly $alias_schema)

        $sql = new Sql($this->adapter);
        $select = $sql->select();
        // Where
        $select->where
            ->expression('-1 = ?', $params['id'])
            ->or
            ->equalTo('id', $params['id']);
        // And so on
        $select->from($this->table)
            ->group('id')
            ->order(implode(' ', array($params['order_column'], $params['order_direction'])))
            ->limit($params['per_page'])
            ->offset($params['skip']);


        // Table has `active` column?
        $has_active_column = $this->schemaHasActiveColumn($table_schema);

        if ($params['active'] && $has_active_column)
            $select->where->in('active', $params['active']);

        // var_dump(@$sql->getSqlStringForSqlObject($select)); exit;

        // @todo figure out this warning
        $statement = @$sql->prepareStatementForSqlObject($select);
        $results = $statement->execute();

        // Note: ensure this is sufficient, in lieu of incrementing within
        // the foreach loop below.
        $foundRows = count($results);

        // @todo make comment explaining this loop
        $table_entries = array();
        foreach ($results as $row) {
            $item = array();
            foreach ($table_schema as $col) {
                // Run custom data casting.
                $name = $col['column_name'];
                $item[$name] = $this->parse_mysql_type($row[$name], $col['type']);
            }
            $table_entries[] = $item;
        }

        // var_dump($table_entries);
        // exit;

        $table_entries = $this->loadManyToOneData($table_schema, $table_entries);

        \Directus\View\JsonView::render($table_entries);
        exit;
    }

    /**
     * Remove Directus-managed virtual/alias fields from the table schema array
     * and return them as a separate array,
     * @param  array $schema Table schema array.
     * @return array         Alias fields
     */
    private function filterSchemaAliasFields(&$schema) {
        $alias_fields = array();
        foreach($schema as $i => $col) {
            // Is it a "virtual"/alias column?
            if(in_array($col['type'], array('ALIAS','ONETOMANY','MANYTOMANY'))) {
                // Remove them from the standard schema
                unset($schema[$i]);
                $alias_fields[] = $col;
            }
        }
        return $alias_fields;
    }

    /**
     * Does a table schema array contain an `active` column?
     * @param  array $schema Table schema array.
     * @return boolean
     */
    private function schemaHasActiveColumn($schema) {
        foreach($schema as $col) {
            if('active' == $col['column_name'])
                $has_active = true;
        }
        return false;
    }

    /**
     * Given a table's schema and rows, iterate and replace all of its foreign
     * keys with the contents of these foreign rows.
     * @param  array $schema  Table schema array
     * @param  array $entries Table rows
     * @return array          Revised table rows, now including foreign rows
     */
    private function loadManyToOneData($table_schema, $table_entries) {
        $sql = new Sql($this->adapter);
        // Identify the ManyToOne columns
        foreach ($table_schema as $col) {
        	$isManyToOneColumn = in_array($col['ui'], $this->many_to_one_uis);
            if ($isManyToOneColumn) {
                $foreign_id_column = $col['id'];
                $foreign_table_name = ($col['ui'] == 'single_media') ? 'directus_media' : $col['options']['related_table'];

                // @todo could really use a comment
                $ids = array_map(function($row) use ($foreign_id_column) { return $row[$foreign_id_column]; }, $table_entries);
                if (empty($ids))
                    continue;

                // Fetch the foreign data
                $select = $sql->select()->from($foreign_table_name);
                $select->where->in('id', $ids);
                $statement = @$sql->prepareStatementForSqlObject($select); // @todo figure out this warning
                $results = $statement->execute();

                $foreign_table = array();
                foreach ($results as $row) {
                    // @todo I wonder if all of this looping and casting is necessary
                    foreach ($row as $column => $value)
                        $row[$column] = $this->parse_mysql_type($value);
                    $foreign_table[$row['id']] = $row;
                }

                // Replace foreign keys with foreight rows
                foreach ($table_entries as &$parentRow) {
                    $foreign_id = $parentRow[$foreign_id_column];
                    $parentRow[$foreign_id_column] = null;
                    // "Did we retrieve the foreign row with this foreign ID in our recent query of the foreign table"?
                    if(array_key_exists($foreign_id, $foreign_table))
                        $parentRow[$foreign_id_column] = $foreign_table[$foreign_id];
                }
            }
        }
        return $table_entries;
    }

    /**
     * Cast a php string to the same type as MySQL.
     */
    function parse_mysql_type($string, $type = NULL) {
        $type = strtolower($type);
        switch ($type) {
            case 'blob':
            case 'mediumblob':
                return base64_encode($string);
            case 'year':
            case 'int':
            case 'long':
            case 'tinyint':
                return (int) $string;
            case 'float':
                return (float) $string;
            case 'date':
            case 'datetime':
                return date("r", strtotime($string));
            case 'VAR_STRING':
                return $string;
        }
        // If type is not present & value is numeric, just cast numbers.
        if (is_numeric($string))
            return (float) $string;
        return $string;
    }

}
