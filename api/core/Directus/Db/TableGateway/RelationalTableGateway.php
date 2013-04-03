<?php

namespace Directus\Db\TableGateway;

use Zend\Db\Sql\Expression;
use Zend\Db\Sql\Sql;

class RelationalTableGateway extends AclAwareTableGateway {

    protected $many_to_one_uis = array('many_to_one', 'single_media');

    public function getEntries($params = array()) {
        // tmp transitional.
        global $db;

        $logger = $this->logger();

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
        $select = $sql->select()->from($this->table);
        // And so on
        $select->group('id')
            ->order(implode(' ', array($params['order_column'], $params['order_direction'])))
            ->limit($params['per_page'])
            ->offset($params['skip']);

        // @todo incorporate search

        // Table has `active` column?
        $has_active_column = $this->schemaHasActiveColumn($table_schema);

        // Note: be sure to explicitly check for null, because the value may be
        // '0' or 0, which is meaningful.
        if (null !== $params['active'] && $has_active_column) {
            $haystack = is_array($params['active'])
                ? $params['active']
                : explode(",", $params['active']);
            $select->where->in('active', $haystack);
        }

        // Where
        $select->where
            ->expression('-1 = ?', $params['id'])
            ->or
            ->equalTo('id', $params['id']);

        // $logger->info($this->dumpSql($select));

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
                $item[$name] = $this->parseMysqlType($row[$name], $col['type']);
            }
            $table_entries[] = $item;
        }

        // Eager-load related ManyToOne records
        $table_entries = $this->loadManyToOneData($table_schema, $table_entries);

        /**
         * Fetching a set of data
         */

        if (-1 == $params['id']) {
            $countActive = $this->count_active($this->table, !$has_active_column);

            $set = array_merge($countActive, array(
                'total'=> $foundRows,
                'rows'=> $table_entries
            ));
            return $set;
        }

        /**
         * Fetching one item
         */

        // @todo return null and let controller throw HTTP response
        if (0 == count($table_entries))
            throw new \DirectusException('Item not found!', 404);

        list($table_entry) = $table_entries;

        foreach ($alias_fields as $alias) {
            switch($alias['type']) {
                case 'MANYTOMANY':
                    $foreign_data = $this->loadManyToManyData($this->table, $alias['table_related'],
                        $alias['junction_table'], $alias['junction_key_left'], $alias['junction_key_right'],
                        $params['id']);
                    break;
                case 'ONETOMANY':
                    $foreign_data = $this->loadOneToManyData($alias['table_related'], $alias['junction_key_right'], $params['id']);
                    break;
            }
            if(isset($foreign_data)) {
                $column = $alias['column_name'];
                $table_entry[$column] = $foreign_data;
            }
        }

        return $table_entry;
    }

    /**
     *
     * ASSOCIATION FUNCTIONS
     *
     **/

    /**
     * Fetch related, foreign rows for one record's OneToMany relationships.
     *
     * @param string $table
     * @param string $column_name
     * @param string $column_equals
     */
    private function loadOneToManyData($table, $column_name, $column_equals) {
        // Run query
        $sql = new Sql($this->adapter);
        $select = $sql->select()->from($table);
        $select->where->equalTo($column_name, $column_equals);
        $statement = @$sql->prepareStatementForSqlObject($select); // @todo figure out this warning
        $results = $statement->execute();
        // Process results
        foreach ($results as $row)
            array_walk($row, array($this, 'castFloatIfNumeric'));
        return array('rows' => $results);
    }

    /**
     * Fetch related, foreign rows for a whole rowset's ManyToOne relationships.
     * (Given a table's schema and rows, iterate and replace all of its foreign
     * keys with the contents of these foreign rows.)
     * @param  array $schema  Table schema array
     * @param  array $entries Table rows
     * @return array          Revised table rows, now including foreign rows
     */
    private function loadManyToOneData($table_schema, $table_entries) {
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
                $sql = new Sql($this->adapter);
                $select = $sql->select()->from($foreign_table_name);
                $select->where->in('id', $ids);
                $statement = @$sql->prepareStatementForSqlObject($select); // @todo figure out this warning
                $results = $statement->execute();

                $foreign_table = array();
                foreach ($results as $row) {
                    // @todo I wonder if all of this looping and casting is necessary
                    array_walk($row, array($this, 'castFloatIfNumeric'));
                    $foreign_table[$row['id']] = $row;
                }

                // Replace foreign keys with foreign rows
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
     * Fetch related, foreign rows for one record's ManyToMany relationships.
     * @param  string $table_name
     * @param  string $foreign_table
     * @param  string $junction_table
     * @param  string $junction_key_left
     * @param  string $junction_key_right
     * @param  string $column_equals
     * @return array                      Foreign rowset
     */
    private function loadManyToManyData($table_name, $foreign_table, $junction_table, $junction_key_left, $junction_key_right, $column_equals) {
        $foreign_join_column = "$junction_table.$junction_key_right";
        $join_column = "$table.$junction_key_left";

        $sql = new Sql($this->adapter);
        $select = $sql->select()
            ->from($this->table)
            ->join($junction_table, "$foreign_join_column = $join_column")
            ->where(array($join_column => $column_equals));
        $statement = @$sql->prepareStatementForSqlObject($select); // @todo figure out this warning
        $results = $statement->execute();

        $foreign_data = array();
        foreach($results as $row) {
            array_walk($row, array($this, 'castFloatIfNumeric'));
            $foreign_data[] = array('id' => $row['id'], 'data' => $row);
        }
        return array('rows' => $foreign_data);
        /**
         * @todo  Is it necessary to retain this old way of guessing the PK of the table?
         * The old (& new) version #get_entries already assumes that every table has an 'id'
         * field. Perhaps we should use table introspection to identify PK?
         */
        // $data_set = array();
        // $sql = "SELECT JT.id, FT.* FROM $junction_table JT
        //     LEFT JOIN $foreign_table FT
        //     ON (JT.$junction_key_right = FT.id)
        //     WHERE JT.$junction_key_left = $column_equals";
        // $sth = $this->dbh->prepare($sql);
        // $sth->execute();
        // while($row = $sth->fetch(PDO::FETCH_NUM)){
        //     $junction_id = $row[0];
        //     $data = array();
        //     foreach ($row as $i => $value) {
        //         $columnMeta = $sth->getColumnMeta($i);
        //         $data[$columnMeta['name']] = is_numeric($value) ? (float)$value : $value;
        //     }
        //     array_push($data_set, array('id'=>$junction_id, 'data' => $data));
        // }
        // return array('rows' => $data_set);
    }

    /**
     *
     * HELPER FUNCTIONS
     *
     **/

    /**
     * Remove Directus-managed virtual/alias fields from the table schema array
     * and return them as a separate array.
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
                return true;
        }
        return false;
    }

    /**
     * Cast a php string to the same type as MySQL
     * @param  string $mysql_data MySQL result data
     * @param  string $mysql_type MySQL field type
     * @return mixed              Value cast to PHP type
     */
    private function parseMysqlType($mysql_data, $mysql_type = null) {
        $mysql_type = strtolower($mysql_type);
        switch ($mysql_type) {
            case null:
                break;
            case 'blob':
            case 'mediumblob':
                return base64_encode($mysql_data);
            case 'year':
            case 'int':
            case 'long':
            case 'tinyint':
                return (int) $mysql_data;
            case 'float':
                return (float) $mysql_data;
            case 'date':
            case 'datetime':
                return date("r", strtotime($mysql_data));
            case 'var_string':
                return $mysql_data;
        }
        // If type is null & value is numeric, cast to integer.
        if (is_numeric($mysql_data))
            return (float) $mysql_data;
        return $mysql_data;
    }

    /**
     * @refactor
     */
    function count_active($tbl_name, $no_active=false) {
        $result = array('active'=>0);
        if ($no_active) {
            $sql = "SELECT COUNT(*) as count, 'active' as active FROM $tbl_name";
        } else {
            $sql = "SELECT
                CASE active
                    WHEN 0 THEN 'trash'
                    WHEN 1 THEN 'active'
                    WHEN 2 THEN 'inactive'
                END AS active,
                COUNT(*) as count
            FROM $tbl_name
            GROUP BY active";
        }
        // tmp transitional
        global $db;
        $sth = $db->dbh->prepare($sql);
        // Test if there is an active column!
        try {
            $sth->execute();
        } catch(Exception $e) {
            if ($e->getCode() == "42S22" && strpos(strtolower($e->getMessage()),"unknown column")) {
                return $this->count_active($tbl_name, true);
            } else {
                throw $e;
            }
        }
        while($row = $sth->fetch(\PDO::FETCH_ASSOC))
            $result[$row['active']] = (int)$row['count'];
        $total = 0;
        return $result;
    }

}
