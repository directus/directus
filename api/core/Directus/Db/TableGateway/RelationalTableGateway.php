<?php

namespace Directus\Db\TableGateway;

use Directus\Auth\Provider as AuthProvider;
use Directus\Bootstrap;
use Directus\Db\TableSchema;
use Directus\Db\RowGateway\AclAwareRowGateway;
use Directus\Db\TableGateway\DirectusActivityTableGateway;
use Zend\Db\Sql\Expression;
use Zend\Db\Sql\Sql;
use Zend\Db\Sql\Select;
use Zend\Db\Sql\Where;

class RelationalTableGateway extends AclAwareTableGateway {

    /**
     * NOTE: Equivalent to old DB#set_entry_relational
     * @param  [type] $schema         [description]
     * @param  [type] $requestPayload [description]
     * @param  [type] $userId         [description]
     * @return [type]                 [description]
     */
    public function manageRecordUpdate($tableName, $requestPayload, $parentActivityLogId = null) {
        $log = $this->logger();
        // $log->info(__CLASS__."#".__FUNCTION__.": " . print_r(func_get_args(), true));

        $schemaArray = TableSchema::getSchemaArray($tableName);
        $masterColumn = TableSchema::getMasterColumn($schemaArray);

        $recordIdentifier = null;
        if($masterColumn && isset($requestPayload[$masterColumn['column_name']]))
            $recordIdentifier = $requestPayload[$masterColumn['column_name']];

        // Mock a top-level log entry record & fetch the new ID for reference
        $currentUser = AuthProvider::getUserInfo();
        $logEntryAction = isset($requestPayload['id']) ? DirectusActivityTableGateway::ACTION_UPDATE : DirectusActivityTableGateway::ACTION_ADD;
        $parentLogEntry = AclAwareRowGateway::makeRowGatewayFromTableName($this->aclProvider, "directus_activity", $this->adapter);
        $logData = array(
            'type'          => DirectusActivityTableGateway::makeLogTypeFromTableName($this->table),
            'table_name'    => $tableName,
            'action'        => $logEntryAction,
            'user'          => $currentUser['id'],
            'datetime'      => gmdate('Y-m-d H:i:s'),
            'identifier'    => $recordIdentifier,
            'parent_id'     => $parentActivityLogId
        );
        $parentLogEntry->populate($logData, false);
        $parentLogEntry->save();

        $RecordGateway = $this;
        if($tableName !== $this->table)
            $RecordGateway = new RelationalTableGateway($this->aclProvider, $tableName, $this->adapter);

        // Update/add associations
        $recordWithForeignIds = $RecordGateway->addOrUpdateRelationships($schemaArray, $requestPayload, $parentLogEntry['id']);

        // Update the parent row, w/ any new association fields replaced by their IDs
        $parentRecord = $RecordGateway->addOrUpdateRecordByArray($recordWithForeignIds);

        // $log->info("new parent record data after AATG#addOrUpdateRecordByArray: " . print_r($parentRecord->toArray(), true));

        // Fill out the remainder of the log entry data & update the record
        $parentLogEntry['row_id'] = $parentRecord['id'];
        $parentLogEntry['data'] = json_encode($parentRecord);
        $parentLogEntry->save();

        return $parentRecord;
    }

    /**
     * Relational Setter
     *
     * Given a table schema and a record array, extract the nested association data
     * from the parent record, and apply the changes to the foreign record sets and
     * junction tables. Foreign records may be applied as inserts or updates.
     *
     * The returned copy of the parent row (with Many-to-One fields replaced with
     * their foreign IDs, and *-to-Many fields removed) can be used to directly
     * update the parent record.
     *
     * @param array $schema              The table schema array.
     * @param array $parentRow           The parent record being updated.
     * @param integer $parentActivityLogId The parent activity log entry ID.
     * @return  array The parent record, with updated foreign keys in the
     * Many-to-One fields, and nested collection representations removed.
     */
    public function addOrUpdateRelationships($schema, $parentRow, $parentActivityLogId) {
        $log = $this->logger();
        // $log->info(__CLASS__."#".__FUNCTION__.": " . print_r(func_get_args(), true));

        // Create foreign row and update local column with the data id
        foreach($schema as $column) {
            $colName = $column['id']; // correct var naming?
            // $log->info("Looking at column $colName");

            // Ignore absent values & non-arrays
            if(!isset($parentRow[$colName]) || !is_array($parentRow[$colName])) {
                $log->info("Unset or non-array. Skipping.");
                continue;
            }

            $fieldIsCollectionAssociation = in_array($column['type'], TableSchema::$association_types);
            $lowercaseColumnType = strtolower($column['type']);

            // Ignore empty OneToMany collections
            $fieldIsOneToMany = "onetomany" === $lowercaseColumnType;

            // Ignore non-arrays and empty collections
            if(empty($parentRow[$colName])) {//} || ($fieldIsOneToMany && )) {
                // $log->info("Empty collection association. Skipping.");
                // Once they're managed, remove the foreign collections from the record array
                unset($parentRow[$colName]);
                continue;
            }

            $foreignDataSet = $parentRow[$colName];
            $colUiType = $column['ui'];

            /** Many-to-One */

            if (in_array($colUiType, TableSchema::$many_to_one_uis)) {
                // $log->info("Identified Many-to-One");
                $foreignTableName = null;
                if("single_media" === $colUiType)
                    $foreignTableName = "directus_media";
                else {
                    /**
                     * Transitional workaround, pending bugfix to many to one uis.
                     * @see  https://github.com/RNGR/directus6/issues/188
                     */
                    $foreignTableName = TableSchema::getRelatedTableFromManyToOneColumnName($colName);
                    if(is_null($foreignTableName)) {
                        // $log->warn("Skipping column with name $colName; unresolved related table.");
                        unset($parentRow[$colName]);
                        continue;
                    }
                    // $log->info("TRANSITIONAL. Resolved Many-to-One column with name $colName to table_related value $foreignTableName.");
                }

                // Update/Add foreign record
                $row = $this->addOrUpdateRecordByArray($foreignDataSet, $foreignTableName);
                $parentRow[$colName] = $row['id'];
            }

            /** One-to-Many, Many-to-Many */
            elseif ($fieldIsCollectionAssociation) {
                // $log->info("Field is a non-empty collection association.");

                $foreignTableName = $column['table_related'];
                $foreignJoinColumn = $column['junction_key_right'];
                // $log->info("foreignTableName: $foreignTableName");
                // $log->info("foreignJoinColumn: $foreignJoinColumn");
                switch ($lowercaseColumnType) {

                    /** One-to-Many */
                    case 'onetomany':
                        // $log->info("<Identified:One-to-Many>");
                        foreach ($foreignDataSet as &$foreignRecord) {
                            $foreignRecord[$foreignJoinColumn] = $parentRow['id'];
                            $foreignRecord = $this->manageRecordUpdate($foreignTableName, $foreignRecord, $parentActivityLogId);
                        }
                        // $log->info("</Identified:One-to-Many>");
                        break;

                    /** Many-to-Many */
                    case 'manytomany':
                        // $log->info("<Identified:Many-to-Many>");
                        /**
                         * [+] Many-to-Many payloads declare collection items this way:
                         * $parentRecord['collectionName1'][0-9]['data']; // record key-value array
                         * [+] With optional association metadata:
                         * $parentRecord['collectionName1'][0-9]['id']; // for updating a pre-existing junction row
                         * $parentRecord['collectionName1'][0-9]['active']; // for disassociating a junction via the '0' value
                         */
                        $junctionTableName = $column['junction_table'];
                        $junctionKeyLeft = $column['junction_key_left'];
                        $JunctionTable = new RelationalTableGateway($this->aclProvider, $junctionTableName, $this->adapter);
                        $ForeignTable = new RelationalTableGateway($this->aclProvider, $foreignTableName, $this->adapter);
                        foreach($foreignDataSet as $junctionRow) {
                            /** This association is designated for removal */
                            if (isset($junctionRow['active']) && $junctionRow['active'] == 0) {
                                // $log->info("Association is flagged for removal. Deleting junction record.");
                                $Where = new Where;
                                $Where->equalTo('id', $junctionRow['id']);
                                $JunctionTable->delete($Where);
                                continue;
                            }
                            /** Update foreign record */
                            // $log->info("Updating foreign records...");
                            $foreignRecord = $ForeignTable->manageRecordUpdate($foreignTableName, $junctionRow['data'], $parentActivityLogId);
                            // Junction/Association row
                            $junctionTableRecord = array(
                                $junctionKeyLeft   => $parentRow['id'],
                                $foreignJoinColumn => $foreignRecord['id']
                            );
                            // Optional ID param, to update the junction table record
                            if (isset($junctionRow['id'])) {
                                // $log->info("Specified Junction row ID -- updating existing junction row.");
                                $junctionTableRecord['id'] = $junctionRow['id'];
                            } else {
                                // $log->info("Establishing new junction row.");
                            }

                            // $log->info("Junction row data for table $junctionTableName:");
                            // $log->info(print_r($junctionTableRecord, true));

                            $JunctionTable->addOrUpdateRecordByArray($junctionTableRecord, $junctionTableName);
                        }
                        // $log->info("</Identified:Many-to-Many>");
                        break;

                    // default: $log->warn("Warning: neither One-to-Many nor Many-to-Many");
                }
                // Once they're managed, remove the foreign collections from the record array
                unset($parentRow[$colName]);
            }

            // else $log->info("Column is not an association.");
        }

        // $log->info("\$parentRow post-process");
        // ob_start();
        // var_dump($parentRow);
        // $log->info(ob_get_clean());

        return $parentRow;
    }

    /**
     * Relational Getter
     * NOTE: equivalent to old DB#get_entries
     */
    public function getEntries($params = array()) {
        // tmp transitional.
        $db = Bootstrap::get('olddb');

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

        $sql = new Sql($this->adapter);
        $select = $sql->select()->from($this->table);
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

        $results = $this->selectWith($select);

        // $this->__runDemoTestSuite($results);

        // Note: ensure this is sufficient, in lieu of incrementing within
        // the foreach loop below.
        $foundRows = count($results);

        // Perform data casting based on the column types in our schema array
        $table_entries = array();
        foreach ($results as $row) {
            $item = array();
            foreach ($table_schema as $col) {
                // Run custom data casting.
                $name = $col['column_name'];
                if($row->offsetExists($name))
                    $item[$name] = $this->parseMysqlType($row[$name], $col['type']);
            }
            $table_entries[] = $item;
        }

        // Eager-load related ManyToOne records
        $table_entries = $this->loadManyToOneRelationships($table_schema, $table_entries);

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

        // Separate alias fields from table schema array
        $alias_fields = $this->filterSchemaAliasFields($table_schema); // (fmrly $alias_schema)

        // $log->info(count($alias_fields) . " alias fields:");
        // $log->info(print_r($alias_fields, true));

        $table_entry = $this->loadToManyRelationships($table_entry, $alias_fields);

        return $table_entry;
    }

    /**
     *
     * Association Getter Functions
     *
     **/

    /**
     * Populate alias/relational One-To-Many and Many-To-Many fields with their foreign data.
     * @param  array $entry        [description]
     * @param  [type] $aliasColumns [description]
     * @return [type]               [description]
     */
    public function loadToManyRelationships($entry, $aliasColumns) {
        // $log = $this->logger();
        foreach ($aliasColumns as $alias) {
            $foreign_data = null;
            // $log->info("Looking at alias field {$alias['id']}");
            switch($alias['type']) {
                case 'MANYTOMANY':
                    // $log->info("Many-to-Many");
                    $foreign_data = $this->loadManyToManyRelationships($this->table, $alias['table_related'],
                        $alias['junction_table'], $alias['junction_key_left'], $alias['junction_key_right'],
                        $entry['id']);
                    break;
                case 'ONETOMANY':
                    // $log->info("One-to-Many");
                    // if(!array_key_exists('id', $entry))
                    //     die(var_dump($entry));
                    $foreign_data = $this->loadOneToManyRelationships($alias['table_related'], $alias['junction_key_right'], $entry['id']);
                    break;
            }

            if(!is_null($foreign_data)) {
                // $log->info("\$foreign_data");
                // ob_start();
                // var_dump($foreign_data);
                // $log->info(ob_get_clean());
                $column = $alias['column_name'];
                $entry[$column] = $foreign_data;
            }
            // else $log->info("no \$foreign_data value");
        }
        return $entry;
    }

    /**
     * Fetch related, foreign rows for one record's OneToMany relationships.
     *
     * @param string $table
     * @param string $column_name
     * @param string $column_equals
     */
    public function loadOneToManyRelationships($table, $column_name, $column_equals) {
        // Run query
        $select = new Select($table);
        $select->where->equalTo($column_name, $column_equals);

        // $log = $this->logger();
        // $log->info(__CLASS__ . "#" . __FUNCTION__);
        // $log->info("query: " . $this->dumpSql($select));

        $TableGateway = new RelationalTableGateway($this->aclProvider, $table, $this->adapter);
        $rowset = $TableGateway->selectWith($select);
        $results = $rowset->toArray();
        // Process results
        foreach ($results as &$row)
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
    public function loadManyToOneRelationships($table_schema, $table_entries) {
        // Identify the ManyToOne columns
        foreach ($table_schema as $col) {
            $isManyToOneColumn = in_array($col['ui'], TableSchema::$many_to_one_uis);
            if ($isManyToOneColumn) {
                $foreign_id_column = $col['id'];
                $foreign_table_name = ($col['ui'] == 'single_media') ? 'directus_media' : $col['options']['related_table'];

                // Aggregate all foreign keys for this relationship (for each row, yield the specified foreign id)
                $yield = function($row) use ($foreign_id_column, $table_entries) {
                    if(array_key_exists($foreign_id_column, $row))
                        return $row[$foreign_id_column];
                };
                $ids = array_map($yield, $table_entries);
                if (empty($ids))
                    continue;

                // Fetch the foreign data
                $select = new Select($foreign_table_name);
                $select->where->in('id', $ids);
                $TableGateway = new RelationalTableGateway($this->aclProvider, $foreign_table_name, $this->adapter);
                $rowset = $TableGateway->selectWith($select);
                $results = $rowset->toArray();

                $foreign_table = array();
                foreach ($results as $row) {
                    array_walk($row, array($this, 'castFloatIfNumeric'));
                    $foreign_table[$row['id']] = $row;
                }

                // Replace foreign keys with foreign rows
                foreach ($table_entries as &$parentRow) {
                    if(array_key_exists($foreign_id_column, $parentRow)) {
                        $foreign_id = $parentRow[$foreign_id_column];
                        $parentRow[$foreign_id_column] = null;
                        // "Did we retrieve the foreign row with this foreign ID in our recent query of the foreign table"?
                        if(array_key_exists($foreign_id, $foreign_table))
                            $parentRow[$foreign_id_column] = $foreign_table[$foreign_id];
                    }
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
    public function loadManyToManyRelationships($table_name, $foreign_table, $junction_table, $junction_key_left, $junction_key_right, $column_equals) {
        $foreign_table_pk = "id";
        $foreign_join_column = "$foreign_table.$foreign_table_pk";
        $junction_join_column = "$junction_table.$junction_key_right";
        $junction_comparison_column = "$junction_table.$junction_key_left";

        $junction_id_column = "$junction_table.id";

        // Less likely name collision:
        $junction_id_column_alias = "directus_junction_id_column";

        $sql = new Sql($this->adapter);
        $select = $sql->select()
            ->from($foreign_table)
            ->join($junction_table, "$foreign_join_column = $junction_join_column", array($junction_id_column_alias => 'id'))
            ->where(array($junction_comparison_column => $column_equals))
            ->order("$junction_id_column ASC");

        // $log = $this->logger();
        // $log->info(__CLASS__ . "#" . __FUNCTION__);
        // $log->info("query: " . $this->dumpSql($select));

        $ForeignTable = new RelationalTableGateway($this->aclProvider, $foreign_table, $this->adapter);
        $results = $ForeignTable->selectWith($select);
        $results = $results->toArray();

        // $log->info("results:");
        // $log->info(print_r($results, true));

        $foreign_data = array();
        foreach($results as $row) {
            array_walk($row, array($this, 'castFloatIfNumeric'));

            $junction_table_id = (int) $row[$junction_id_column_alias];
            unset($row[$junction_id_column_alias]);

            $foreign_data[] = array('id' => $junction_table_id, 'data' => $row);
        }
        return array('rows' => $foreign_data);
    }

    /**
     *
     * HELPER FUNCTIONS
     *
     **/

    public function updateCollection($entries) {
        $entries = is_numeric_array($entries) ? $entries : array($entries);
        foreach($entries as $entry) {
            $entry = $this->addOrUpdateRecordByArray($entry);
            $entry->save();
        }
    }

    /**
     * Yield the result-set of a query as record arrays with immediate, foreign
     * relationships populated, ex.
     *
     *   use Zend\Db\Sql\Select;
     *   $select = new Select("instructors");
     *   $InstructorsGateway = new TableGateway($aclProvider, "instructors", $ZendDb);
     *   $instructorsWithRelationships = $InstructorsGateway->selectWithImmediateRelationships($select);
     *
     * @param  Select $select
     * @return array
     */
    public function selectWithImmediateRelationships(Select $select) {
        $resultSet = $this->selectWith($select);
        $entriesWithRelationships = array();
        foreach($resultSet as $rowGateway)
            $entriesWithRelationships[] = $rowGateway->toArrayWithImmediateRelationships($this);
        return $entriesWithRelationships;
    }

    /**
     * Remove Directus-managed virtual/alias fields from the table schema array
     * and return them as a separate array.
     * @param  array $schema Table schema array.
     * @return array         Alias fields
     */
    public function filterSchemaAliasFields(&$schema) {
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

    // public function __runDemoTestSuite($rowset) {
    //     foreach($rowset as $row) {
    //         echo "<h4>\$row->toArray()</h4><pre>";
    //         print_r($row->toArray());
    //         echo "</pre>";

    //         // Doesn't work - so no worries.
    //         // echo "\$row key/value loop\n";
    //         // foreach($row as $key => $value) {
    //         //     echo "\t$key => $value\n";
    //         // }

    //         // Doesn't work - so no worries.
    //         // echo "array_keys(\$row)\n";
    //         // print_r(array_keys($row));

    //         echo "<h4>offset lookups</h4>";
    //         $keys = array_merge(array_keys($row->__getUncensoredDataForTesting()), array("this_is_a_fake_key"));
    //         echo "<ul>";
    //         foreach($keys as $key) {
    //             echo "<li><h5>$key</h5>";

    //             echo "<ul>";
    //             echo "<li>array_key_exists: ";
    //             $keyExists = array_key_exists($key, $row);
    //             var_dump($keyExists);

    //             echo "</li><li>property_exists: ";
    //             $propExists = property_exists($row, $key);
    //             var_dump($propExists);
    //             echo "</li>";

    //             echo "<li>\$row[$key]: ";
    //             try { var_dump($row[$key]); }
    //             catch(\ErrorException $e) { echo "<em>lookup threw ErrorException</em>"; }
    //             echo  "</li>";

    //             echo "<li>\$row->$key: ";
    //             try { var_dump($row->{$key}); }
    //             catch(\ErrorException $e) { echo "<em>lookup threw ErrorException</em>"; }
    //             catch(\InvalidArgumentException $e) { echo "<em>lookup threw InvalidArgumentException</em>"; }

    //             echo "</li>";
    //             echo "</ul>";
    //         }
    //         echo "</ul>";
    //     }
    //     exit;
    // }

}
