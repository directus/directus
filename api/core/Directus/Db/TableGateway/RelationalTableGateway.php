<?php

namespace Directus\Db\TableGateway;

use Directus\Auth\Provider as AuthProvider;
use Directus\Bootstrap;
use Directus\Db\Exception;
use Directus\Db\RowGateway\AclAwareRowGateway;
use Directus\Db\TableGateway\DirectusActivityTableGateway;
use Directus\Db\TableSchema;
use Directus\Util\Formatting;
use Zend\Db\RowGateway\AbstractRowGateway;
use Zend\Db\Sql\Expression;
use Zend\Db\Sql\Predicate;
use Zend\Db\Sql\Predicate\PredicateInterface;
use Zend\Db\Sql\Select;
use Zend\Db\Sql\Sql;
use Zend\Db\Sql\Where;

class RelationalTableGateway extends AclAwareTableGateway {

    const ACTIVITY_ENTRY_MODE_DISABLED = 0;
    const ACTIVITY_ENTRY_MODE_PARENT = 1;
    const ACTIVITY_ENTRY_MODE_CHILD = 2;

    /**
     * Find the identifying string to effectively represent a record in the activity log.
     * @param  array $schemaArray
     * @param  array|AclAwareRowGateway $fulRecordData
     * @return string
     */
    public function findRecordIdentifier($schemaArray, $fullRecordData) {
        // Decide on the correct column name
        $masterColumn = TableSchema::getMasterColumn($schemaArray);
        $identifierColumnName = null;
        if($masterColumn)
            $identifierColumnName = $masterColumn['column_name'];
        else {
            $column = TableSchema::getFirstNonSystemColumn($schemaArray);
            if($column)
                $identifierColumnName = $column['column_name'];
        }
        // Yield the column contents
        $identifier = null;
        if(isset($fullRecordData[$identifierColumnName])) {
            $identifier = $fullRecordData[$identifierColumnName];
        }
        return $identifier;
    }

    /**
     * NOTE: Equivalent to old DB#set_entry_relational
     * @param  [type] $schema         [description]
     * @param  [type] $recordData [description]
     * @param  [type] $userId         [description]
     * @return [type]                 [description]
     */
    public function manageRecordUpdate($tableName, $recordData, $activityEntryMode = self::ACTIVITY_ENTRY_MODE_PARENT, &$childLogEntries = null, &$parentCollectionRelationshipsChanged = false) {
        $log = $this->logger();
        // $log->info(__CLASS__."#".__FUNCTION__);
        // $log->info(__CLASS__."#".__FUNCTION__.": " . print_r(func_get_args(), true));
        // if($tableName === "classes") {
            // $log->info("recordData: " . print_r($recordData, true));
        // }

        $schemaArray = TableSchema::getSchemaArray($tableName);

        $currentUser = AuthProvider::getUserInfo();

        $TableGateway = $this;
        if($tableName !== $this->table) {
            $TableGateway = new RelationalTableGateway($this->acl, $tableName, $this->adapter);
        }

        $thisIsNested = ($activityEntryMode == self::ACTIVITY_ENTRY_MODE_CHILD);

        // Recursive functions will change this value (by reference) as necessary
        // $nestedCollectionRelationshipsChanged = $thisIsNested ? $parentCollectionRelationshipsChanged : false;
        $nestedCollectionRelationshipsChanged = false;
        if($thisIsNested) {
            $nestedCollectionRelationshipsChanged = &$parentCollectionRelationshipsChanged;
        }

        // Recursive functions will append to this array by reference
        // $nestedLogEntries = $thisIsNested ? $childLogEntries : array();
        $nestedLogEntries = array();
        if($thisIsNested) {
            $nestedLogEntries = &$childLogEntries;
        }

        // Update/add associations
        $parentRecordWithForeignKeys = $TableGateway->addOrUpdateRelationships($schemaArray, $recordData, $nestedLogEntries, $nestedCollectionRelationshipsChanged);
        // $log->info("Parent record with foreign keys: ".print_r((array) $parentRecordWithForeignKeys, true));

        $recordIsNew = !array_key_exists($TableGateway->primaryKeyFieldName, $recordData);  

        // If more than the record ID is present.
        $newRecordObject = null;
        $parentRecordChanged = $this->recordDataContainsNonPrimaryKeyData($parentRecordWithForeignKeys); // || $recordIsNew;
        if($parentRecordChanged) {

            // Run Custom UI Processing
            $customUis = Bootstrap::get('uis');
            $aliasColumns = TableSchema::getAllAliasTableColumns($TableGateway->getTable());
            foreach($aliasColumns as $aliasColumn) {
                if($aliasColumn['ui'] && array_key_exists($aliasColumn['ui'], $customUis)) {
                    $formClassName = '\\' . Formatting::underscoreToCamelCase($aliasColumn['ui']) . 'Form';
                    if(!class_exists($formClassName)) {
                        $classFilePath = APPLICATION_PATH . '/ui/' . $aliasColumn['ui'] . '/form.php';
                        if(!file_exists($classFilePath)) {
                            continue;
                        }
                        require $classFilePath;
                        if(!class_exists($formClassName)) {
                            throw new \RuntimeError("Expected class $formClassName to be defined in $classFilePath for custom UI processing.");
                        }
                        $form = new $formClassName($recordData, $parentRecordWithForeignKeys);
                        if(!$form->isValid()) {
                            $failedField = $TableGateway->getTable() . "[" . $aliasColumn['id'] . "]";
                            throw new Exception\CustomUiValidationError("Custom UI Form validation failed for field $failedField via $formClassName");
                        }
                        $form->submit();
                    }
                }
            }

            // After UI processing, do we still have non-PK data?
            $parentRecordChanged = $this->recordDataContainsNonPrimaryKeyData($parentRecordWithForeignKeys);
            if($parentRecordChanged) {
                // Update the parent row, w/ any new association fields replaced by their IDs
                $newRecordObject = $TableGateway->addOrUpdateRecordByArray($parentRecordWithForeignKeys);
                // $log->info("Parent record with foreign keys (post-#addOrUpdateRecordByArray): " . print_r($newRecordObject->toArray(), true));
            }
        }

        // Load full record post-facto, for:
        // - loading record identifier
        // - storing a full representation in the activity log
        $rowId = $recordIsNew ? $newRecordObject['id'] : $parentRecordWithForeignKeys['id'];

        $fullRecordData = $TableGateway->find($rowId);

        if(!$fullRecordData) {
            $recordType = $recordIsNew ? "new" : "pre-existing";
            throw new \RuntimeException("Attempted to load $recordType record post-insert with empty result. Lookup via row id: " . print_r($rowId, true));
        }

        $deltaRecordData = $recordIsNew ? array() : array_intersect_key((array) $parentRecordWithForeignKeys, (array) $fullRecordData);

        // if(false === $newRecordObject)
        //     $log->info('newRecordObject is false');
        // elseif(null === $newRecordObject)
        //     $log->info('newRecordObject is null');
        // elseif(!is_object($newRecordObject))
        //     $log->info('newRecordObject ' . print_r($newRecordObject, true));
        // else
        //     $log->info('newRecordObject ' . print_r($newRecordObject->toArray(), true));

        // if(false === $fullRecordData)
        //     $log->info('fullRecordData is false');
        // else
        //     $log->info('fullRecordData ' . print_r($fullRecordData, true));

        switch($activityEntryMode) {

            // Activity logging is enabled, and I am a nested action
            case self::ACTIVITY_ENTRY_MODE_CHILD:
                $logEntryAction = $recordIsNew ? DirectusActivityTableGateway::ACTION_ADD : DirectusActivityTableGateway::ACTION_UPDATE;
                $childLogEntries[] = array(
                    'type'          => DirectusActivityTableGateway::makeLogTypeFromTableName($this->table),
                    'table_name'    => $tableName,
                    'action'        => $logEntryAction,
                    'user'          => $currentUser['id'],
                    'datetime'      => gmdate('Y-m-d H:i:s'),
                    'data'          => json_encode($fullRecordData),
                    'delta'         => json_encode($deltaRecordData),
                    'row_id'        => $rowId,
                    'identifier'    => null
                );
                if($recordIsNew) {
                    /**
                     * This is a nested call, creating a new record w/in a foreign collection.
                     * Indicate by reference that the top-level record's relationships have changed.
                     */
                    $parentCollectionRelationshipsChanged = true;
                }
                break;

            case self::ACTIVITY_ENTRY_MODE_PARENT:
                // Does this act deserve a log?
                $parentRecordNeedsLog = $nestedCollectionRelationshipsChanged || $parentRecordChanged;
                /**
                 * NESTED QUESTIONS!
                 * @todo  what do we do if the foreign record OF a foreign record changes?
                 * is that activity entry also directed towards this parent activity entry?
                 * @todo  how should nested activity entries relate to the revision histories of foreign items?
                 * @todo  one day: treat children as parents if this top-level record was not modified.
                 */
                $recordIdentifier = $this->findRecordIdentifier($schemaArray, $fullRecordData);
                // $log->info("ACTIVITY_ENTRY_MODE_PARENT");
                // $log->info("\$parentRecordChanged:".print_r($parentRecordChanged,true));
                // $log->info("\$nestedCollectionRelationshipsChanged:".print_r($nestedCollectionRelationshipsChanged,true));
                // $log->info("\$nestedLogEntries:".print_r($nestedCollectionRelationshipsChanged,true));
                // Produce log if something changed.
                if($parentRecordChanged || $nestedCollectionRelationshipsChanged) {
                    $logEntryAction = $recordIsNew ? DirectusActivityTableGateway::ACTION_ADD : DirectusActivityTableGateway::ACTION_UPDATE;
                    // Save parent log entry
                    $parentLogEntry = AclAwareRowGateway::makeRowGatewayFromTableName($this->acl, "directus_activity", $this->adapter);
                    $logData = array(
                        'type'              => DirectusActivityTableGateway::makeLogTypeFromTableName($this->table),
                        'table_name'        => $tableName,
                        'action'            => $logEntryAction,
                        'user'              => $currentUser['id'],
                        'datetime'          => gmdate('Y-m-d H:i:s'),
                        'parent_id'         => null,
                        'data'              => json_encode($fullRecordData),
                        'delta'             => json_encode($deltaRecordData),
                        'parent_changed'    => (int) $parentRecordChanged,
                        'identifier'        => $recordIdentifier,
                        'row_id'            => $rowId
                    );
                    $parentLogEntry->populate($logData, false);
                    $parentLogEntry->save();
                    // Update & insert nested activity entries
                    $ActivityGateway = new DirectusActivityTableGateway($this->acl, $this->adapter);
                    foreach($nestedLogEntries as $entry) {
                        $entry['parent_id'] = $rowId;
                        // @todo ought to insert these in one batch
                        $ActivityGateway->insert($entry);
                    }
                }
                break;
        }

        // Yield record object
        $recordGateway = new AclAwareRowGateway($this->acl, $TableGateway->primaryKeyFieldName, $tableName, $this->adapter);
        $recordGateway->populate($fullRecordData, true);
        return $recordGateway;
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
     * @return  array The parent record, with updated foreign keys in the
     * Many-to-One fields, and nested collection representations removed.
     */
    public function addOrUpdateRelationships($schema, $parentRow, &$childLogEntries = null, &$parentCollectionRelationshipsChanged = false) {
        $log = $this->logger();
        // $log->info(__CLASS__."#".__FUNCTION__.": " . print_r(func_get_args(), true));
        // $log->info(__CLASS__."#".__FUNCTION__);

        // Create foreign row and update local column with the data id
        foreach($schema as $column) {
            $colName = $column['id']; // correct var naming?
            // $log->info("Looking at column $colName");

            // Ignore absent values & non-arrays
            if(!isset($parentRow[$colName]) || !is_array($parentRow[$colName])) {
                // $log->info("Unset or non-array. Skipping.");
                continue;
            }

            $fieldIsCollectionAssociation = in_array($column['type'], TableSchema::$association_types);
            $lowercaseColumnType = strtolower($column['type']);

            // Ignore empty OneToMany collections
            $fieldIsOneToMany = ("onetomany" === $lowercaseColumnType);

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
                $foreignRow = $foreignDataSet;
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
                if($this->recordDataContainsNonPrimaryKeyData($foreignRow)) {
                    $foreignRow = $this->addOrUpdateRecordByArray($foreignRow, $foreignTableName);
                }
                $parentRow[$colName] = $foreignRow['id'];
            }

            /** One-to-Many, Many-to-Many */
            elseif ($fieldIsCollectionAssociation) {
                // $log->info("Field is a non-empty collection association.");
                $this->enforceColumnHasNonNullValues($column, array('table_related','junction_key_right'), $this->table);
                $foreignTableName = $column['table_related'];
                $foreignJoinColumn = $column['junction_key_right'];
                // $log->info("Field is a non-empty collection association.");
                // $log->info("foreignTableName: $foreignTableName");
                // $log->info("foreignJoinColumn: $foreignJoinColumn");
                switch ($lowercaseColumnType) {

                    /** One-to-Many */
                    case 'onetomany':
                        // $log->info("<Identified:One-to-Many>");
                        foreach ($foreignDataSet as &$foreignRecord) {
                            if(empty($foreignRecord)) {
                                // $log->info("(Skipping empty foreign record declaration.)");
                                continue;
                            }

                            // only add parent id's to items that are lacking the parent column
                            if (!array_key_exists($foreignJoinColumn, $foreignRecord)) {
                                $foreignRecord[$foreignJoinColumn] = $parentRow['id'];
                            }

                            $foreignRecord = $this->manageRecordUpdate($foreignTableName, $foreignRecord, self::ACTIVITY_ENTRY_MODE_CHILD, $childLogEntries, $parentCollectionRelationshipsChanged);
                        }
                        // $log->info("</Identified:One-to-Many>");
                        break;

                    /** Many-to-Many */
                    case 'manytomany':
                        /**
                         * [+] Many-to-Many payloads declare collection items this way:
                         * $parentRecord['collectionName1'][0-9]['data']; // record key-value array
                         * [+] With optional association metadata:
                         * $parentRecord['collectionName1'][0-9]['id']; // for updating a pre-existing junction row
                         * $parentRecord['collectionName1'][0-9]['active']; // for disassociating a junction via the '0' value
                         */
                        // $log->info("<Identified:Many-to-Many>");
                        $this->enforceColumnHasNonNullValues($column, array('junction_table','junction_key_left'), $this->table);
                        $junctionTableName = $column['junction_table'];
                        $junctionKeyLeft = $column['junction_key_left'];
                        $JunctionTable = new RelationalTableGateway($this->acl, $junctionTableName, $this->adapter);
                        $ForeignTable = new RelationalTableGateway($this->acl, $foreignTableName, $this->adapter);
                        foreach($foreignDataSet as $junctionRow) {
                            /** This association is designated for removal */
                            if (isset($junctionRow['active']) && $junctionRow['active'] == 0) {
                                // $log->info("Association is flagged for removal. Deleting junction record.");
                                $Where = new Where;
                                $Where->equalTo('id', $junctionRow['id']);
                                $JunctionTable->delete($Where);
                                // Flag the top-level record as having been altered.
                                // (disassociating w/ existing M2M collection entry)
                                $parentCollectionRelationshipsChanged = true;
                                continue;
                            }
                            /** Update foreign record */
                            // $log->info("Updating foreign records...");
                            $foreignRecord = $ForeignTable->manageRecordUpdate($foreignTableName, $junctionRow['data'], self::ACTIVITY_ENTRY_MODE_CHILD, $childLogEntries, $parentCollectionRelationshipsChanged);
                            // Junction/Association row
                            $junctionTableRecord = array(
                                $junctionKeyLeft   => $parentRow['id'],
                                $foreignJoinColumn => $foreignRecord['id']
                            );

                            // Update fields on the Junction Record
                            $junctionTableRecord = array_merge($junctionTableRecord, $junctionRow);

                            // $log->info("Junction row data for table $junctionTableName:");
                            // $log->info(print_r($junctionTableRecord, true));

                            $foreignRecord = (array) $foreignRecord;

                            $relationshipChanged = $this->recordDataContainsNonPrimaryKeyData($foreignRecord) ||
                                $this->recordDataContainsNonPrimaryKeyData($junctionTableRecord);

                            // Update Foreign Record
                            if($relationshipChanged) {
                                unset($junctionTableRecord['data']);
                                $JunctionTable->addOrUpdateRecordByArray($junctionTableRecord, $junctionTableName);
                            }
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

    public static $defaultEntriesSelectParams = array(
        'orderBy' => 'id', // @todo validate $params['order*']
        'orderDirection' => 'DESC',
        'fields' => '*',
        'perPage' => 500,
        'currentPage' => 0,
        'id' => -1,
        'search' => null,
        'active' => null
    );

    public function applyDefaultEntriesSelectParams(array $params) {

        if(isset($params['perPage']) && isset($params['current_page']))
            $params['currentPage'] = $params['current_page'] * $params['perPage'];

        if(isset($params['fields']) && is_array($params['fields']))
            $params['fields'] = array_merge(array('id'), $params['fields']);

        $params = array_merge(self::$defaultEntriesSelectParams, $params);

        array_walk($params, array($this, 'castFloatIfNumeric'));

        return $params;
    }

    public function applyParamsToTableEntriesSelect(array $params, Select $select, array $schema, $hasActiveColumn = false) {
        $select->group('id')
            ->order(implode(' ', array($params['orderBy'], $params['orderDirection'])))
            ->limit($params['perPage'])
            ->offset($params['currentPage'] * $params['perPage']);

        // Note: be sure to explicitly check for null, because the value may be
        // '0' or 0, which is meaningful.
        if (null !== $params['active'] && $hasActiveColumn) {
            $haystack = is_array($params['active'])
                ? $params['active']
                : explode(",", $params['active']);
            $select->where->in('active', $haystack);
        }

        // Where
        $select
            ->where
            ->nest
                ->expression('-1 = ?', $params['id'])
                ->or
                ->equalTo('id', $params['id'])
            ->unnest;

        if(isset($params['search']) && !empty($params['search'])) {
            $params['search'] = "%" . $params['search'] . "%";
            $where = $select->where->nest;
            foreach ($schema as $col) {
                if ($col['type'] == 'VARCHAR' || $col['type'] == 'INT') {
                    $columnName = $this->adapter->platform->quoteIdentifier($col['column_name']);
                    $like = new Predicate\Expression("LOWER($columnName) LIKE ?", strtolower($params['search']));
                    $where->addPredicate($like, Predicate\Predicate::OP_OR);
                }
            }
            $where->unnest;
            // $log = Bootstrap::get('log');
            // $log->info(__CLASS__.'#'.__FUNCTION__);
            // $log->info("New search query: " . $this->dumpSql($select));
        }

        return $select;
    }

    /**
     * Relational Getter
     * NOTE: equivalent to old DB#get_entries
     */
    public function getEntries($params = array()) {
        // tmp transitional.
        $db = Bootstrap::get('olddb');

        // @todo this is for backwards compatibility, make sure this doesn't happen and ditch the following 2 if-blocks
        if (!array_key_exists('orderBy',$params) && array_key_exists('sort',$params)) {
            $params['orderBy'] = $params['sort'];
        }
        if (!array_key_exists('orderDirection',$params) && array_key_exists('sort_order',$params)) {
            $params['orderDirection'] = $params['sort_order'];
        }
        // end @todo

        $logger = $this->logger();

        $platform = $this->adapter->platform; // use for quoting

        // Get table column schema
        $schemaArray = TableSchema::getSchemaArray($this->table);
        // $schemaArray = $db->get_table($this->table);

        // Table has `active` column?
        $hasActiveColumn = $this->schemaHasActiveColumn($schemaArray);

        $params = $this->applyDefaultEntriesSelectParams($params);

        $sql = new Sql($this->adapter);
        $select = $sql->select()->from($this->table);

        // Only select the fields not on the currently authenticated user group's read field blacklist
        $columns = TableSchema::getAllNonAliasTableColumnNames($this->table);
        $select->columns($columns);

        $select = $this->applyParamsToTableEntriesSelect($params, $select, $schemaArray, $hasActiveColumn);

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
            foreach ($schemaArray as $col) {
                // Run custom data casting.
                $name = $col['column_name'];
                if($row->offsetExists($name))
                    $item[$name] = $this->parseMysqlType($row[$name], $col['type']);
            }
            $table_entries[] = $item;
        }

        // Eager-load related ManyToOne records
        $table_entries = $this->loadManyToOneRelationships($schemaArray, $table_entries);

        /**
         * Fetching a set of data
         */

        if (-1 == $params['id']) {
            $set = array();
            if($hasActiveColumn) {
                $countActive = $this->countActive($hasActiveColumn);
                $set = array_merge($set, $countActive);
            } else {
                $set['total'] = $this->countTotal();
            }
            $set['rows'] = $table_entries;
            return $set;
        }

        /**
         * Fetching one item
         */

        // @todo return null and let controller throw HTTP response
        if (0 == count($table_entries)) {
            // throw new \DirectusException('Item not found!',404);
            // @todo return null and let controller handle HTTP response
            Bootstrap::get('app')->halt(404);
        }

        list($table_entry) = $table_entries;

        // Separate alias fields from table schema array
        $alias_fields = $this->filterSchemaAliasFields($schemaArray); // (fmrly $alias_schema)

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
     * @param  array $column       One schema column representation.
     * @param  array $requiredKeys Values requiring definition.
     * @param  string $tableName
     * @return void
     * @throws  \Directus\Db\Exception\RelationshipMetadataException If the required values are undefined.
     */
    private function enforceColumnHasNonNullValues($column, $requiredKeys, $tableName) {
        $erroneouslyNullKeys = array();
        foreach($requiredKeys as $key) {
            if(!isset($column[$key]) || (strlen(trim($column[$key])) === 0)) {
                $erroneouslyNullKeys[] = $key;
            }
        }
        if(!empty($erroneouslyNullKeys)) {
            $msg = "Required column/ui metadata columns on table $tableName lack values: ";
            $msg .= implode(" ", $requiredKeys);
            throw new Exception\RelationshipMetadataException($msg);
        }
    }

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
                    $this->enforceColumnHasNonNullValues($alias, array('table_related','junction_table','junction_key_left','junction_key_right'), $this->table);
                    $foreign_data = $this->loadManyToManyRelationships($this->table, $alias['table_related'],
                        $alias['junction_table'], $alias['junction_key_left'], $alias['junction_key_right'],
                        $entry['id']);
                    break;
                case 'ONETOMANY':
                    // $log->info("One-to-Many");
                    $this->enforceColumnHasNonNullValues($alias, array('table_related','junction_key_right'), $this->table);
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

        // Only select the fields not on the currently authenticated user group's read field blacklist
        $columns = TableSchema::getAllNonAliasTableColumnNames($table);
        $select->columns($columns);

        $TableGateway = new RelationalTableGateway($this->acl, $table, $this->adapter);
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
    public function loadManyToOneRelationships($schemaArray, $table_entries) {
        // Identify the ManyToOne columns
        foreach ($schemaArray as $col) {
            $isManyToOneColumn = in_array($col['ui'], TableSchema::$many_to_one_uis);
            if ($isManyToOneColumn) {
                $foreign_id_column = $col['id'];

                if('single_media' === $col['ui'])
                    $foreign_table_name = 'directus_media';
                elseif(array_key_exists('table_related', $col['options']))
                    $foreign_table_name = $col['options']['table_related'];
                elseif(array_key_exists('table_related', $col))
                    $foreign_table_name = $col['table_related'];
                else {
                    $message = 'Non single_media Many-to-One relationship lacks `table_related` value.';
                    if(array_key_exists('column_name', $col))
                        $message .= " Column: " . $col['column_name'];
                    if(array_key_exists('table_name', $col))
                        $message .= " Table: " . $col['table_name'];
                    throw new Exception\RelationshipMetadataException($message);
                }

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

                $columns = TableSchema::getAllNonAliasTableColumnNames($foreign_table_name);
                $select->columns($columns);

                $TableGateway = new RelationalTableGateway($this->acl, $foreign_table_name, $this->adapter);
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
                        $foreign_id = (int) $parentRow[$foreign_id_column];
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
        $junction_id_column_alias = "directus_junction_id_column_518d31856e131";
        $junction_sort_column_alias = "directus_junction_sort_column_518d318e3f0f5";

        $junctionSelectColumns = array($junction_id_column_alias => 'id');

        $sql = new Sql($this->adapter);
        $select = $sql->select();

        // If the Junction Table has a Sort column, do eet.
        // @todo is this the most efficient way?
        // @hint TableSchema#getUniqueColumnName
        $junctionColumns = TableSchema::getAllNonAliasTableColumnNames($junction_table);
        if(in_array('sort', $junctionColumns)) {
            $junctionSelectColumns[$junction_sort_column_alias] = "sort";
            $select->order($junction_sort_column_alias);
        }

        $select
            ->from($foreign_table)
            ->join($junction_table, "$foreign_join_column = $junction_join_column", $junctionSelectColumns)
            ->where(array($junction_comparison_column => $column_equals))
            ->order("$junction_id_column ASC");

        // Only select the fields not on the currently authenticated user group's read field blacklist
        $columns = TableSchema::getAllNonAliasTableColumnNames($foreign_table);
        $select->columns($columns);

        // $log = $this->logger();
        // $log->info(__CLASS__ . "#" . __FUNCTION__);
        // $log->info("query: " . $this->dumpSql($select));

        $ForeignTable = new RelationalTableGateway($this->acl, $foreign_table, $this->adapter);
        $results = $ForeignTable->selectWith($select);
        $results = $results->toArray();

        // $log->info("results:");
        // $log->info(print_r($results, true));

        $foreign_data = array();
        foreach($results as $row) {

            array_walk($row, array($this, 'castFloatIfNumeric'));

            $junction_table_id = (int) $row[$junction_id_column_alias];
            unset($row[$junction_id_column_alias]);

            $entry = array('id' => $junction_table_id);
            if(in_array('sort', $junctionColumns)) {
                $entry['sort'] = $row[$junction_sort_column_alias];
                unset($row[$junction_sort_column_alias]);
            }
            $entry['data'] = $row;

            $foreign_data[] = $entry;


        }
        return array('rows' => $foreign_data);
    }

    /**
     *
     * HELPER FUNCTIONS
     *
     **/

    /**
     * Does this record representation contain non-primary-key information?
     * Used to determine whether or not to update a foreign record, above and
     * beyond simply assigning it to a parent.
     * @param  array|RowGateway $record
     * @param  string $pkFieldName
     * @return boolean
     */
    public function recordDataContainsNonPrimaryKeyData($record, $pkFieldName = 'id') {
        if(is_subclass_of($record, 'Zend\Db\RowGateway\AbstractRowGateway'))
            $record = $record->toArray();
        elseif(!is_array($record)) {
            throw new \InvalidArgumentException("\$record must an array or a subclass of AbstractRowGateway");
        }
        $keyCount = count($record);
        return array_key_exists($pkFieldName, $record) ? $keyCount > 1 : $keyCount > 0;
    }

    /**
     * Update a collection of records within this table.
     * @param  array $entries Array of records.
     * @return void
     */
    public function updateCollection($entries) {
        $entries = is_numeric_array($entries) ? $entries : array($entries);
        foreach($entries as $entry) {
            $entry = $this->manageRecordUpdate($this->table, $entry);
            $entry->save();
        }
    }

    /**
     * Yield the result-set of a query as record arrays with immediate, foreign
     * relationships populated, ex.
     *
     *   use Zend\Db\Sql\Select;
     *   $select = new Select("instructors");
     *   $InstructorsGateway = new TableGateway($acl, "instructors", $ZendDb);
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
    public function schemaHasActiveColumn($schema) {
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
            case 'bigint':
            case 'smallint':
            case 'mediumint':
            case 'int':
            case 'long':
            case 'tinyint':
                return (int) $mysql_data;
            case 'float':
                return (float) $mysql_data;
            case 'date':
            case 'datetime':
                $nullDate = empty($mysql_data) || ("0000-00-00 00:00:00" == $mysql_data);
                return $nullDate ? null : date("r", strtotime($mysql_data));
            case 'var_string':
                return $mysql_data;
        }
        // If type is null & value is numeric, cast to integer.
        if (is_numeric($mysql_data))
            return (float) $mysql_data;
        return $mysql_data;
    }

    /**
     * Yield total number of rows on a table, irrespective of any active column.
     * @return int
     */
    public function countTotal(PredicateInterface $predicate = null) {
        $select = new Select($this->table);
        $select->columns(array('total' => new Expression('COUNT(*)')));
        if(!is_null($predicate))
            $select->where($predicate);
        $sql = new Sql($this->adapter, $this->table);
        $statement = $sql->prepareStatementForSqlObject($select);
        $results = $statement->execute();
        $row = $results->current();
        return (int) $row['total'];
    }

    /**
     * Only run on tables which have an active column.
     * @return array
     */
    public function countActive() {
        $select = new Select($this->table);
        $select
            ->columns(array('active', 'quantity' => new Expression('COUNT(*)')))
            ->group('active');
        $sql = new Sql($this->adapter, $this->table);
        $statement = $sql->prepareStatementForSqlObject($select);
        $results = $statement->execute();
        $stats = array();
        foreach($results as $row) {
            $statSlug = AclAwareRowGateway::$activeStateSlugs[$row['active']];
            $stats[$statSlug] = (int) $row['quantity'];
        }
        $possibleValues = array_values(AclAwareRowGateway::$activeStateSlugs);
        $makeMeZero = array_diff($possibleValues, array_keys($stats));
        foreach($makeMeZero as $unsetActiveColumn)
            $stats[$unsetActiveColumn] = 0;
        $stats['total'] = array_sum($stats);
        return $stats;
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
