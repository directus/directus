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
use Zend\Db\TableGateway\TableGateway;

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
            if($column) {
                $identifierColumnName = $column['column_name'];
            }
        }
        // Yield the column contents
        $identifier = null;
        if(isset($fullRecordData[$identifierColumnName])) {
            $identifier = $fullRecordData[$identifierColumnName];
        }
        return $identifier;
    }

    public function manageRecordUpdate($tableName, $recordData, $activityEntryMode = self::ACTIVITY_ENTRY_MODE_PARENT, &$childLogEntries = null, &$parentCollectionRelationshipsChanged = false) {
        $log = $this->logger();

        $schemaArray = TableSchema::getSchemaArray($tableName);

        $currentUser = AuthProvider::getUserRecord();

        $TableGateway = $this;
        if($tableName !== $this->table) {
            $TableGateway = new RelationalTableGateway($this->acl, $tableName, $this->adapter);
        }

        $recordIsNew = !array_key_exists($TableGateway->primaryKeyFieldName, $recordData);

        //Dont do for directus users since id is pk
        if($recordIsNew && $tableName != 'directus_users') {
          $cmsOwnerColumnName = $this->acl->getCmsOwnerColumnByTable($tableName);
          if($cmsOwnerColumnName) {
            $recordData[$cmsOwnerColumnName] = $currentUser['id'];
          }
        }

        //Dont let non-admins make admins
        if($tableName == 'directus_users' && $currentUser['group'] != 1) {
          if(isset($recordData['group']) && $recordData['group']['id'] == 1) {
            unset($recordData['group']);
          }
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

        // Update and/or Add Many-to-One Associations
        $parentRecordWithForeignKeys = $TableGateway->addOrUpdateManyToOneRelationships($schemaArray, $recordData, $nestedLogEntries, $nestedCollectionRelationshipsChanged);

        // Merge the M21 foreign keys into the recordData array
        $recordData = array_merge($recordData, $parentRecordWithForeignKeys);

        // If more than the record ID is present.
        $newRecordObject = null;
        $parentRecordChanged = $this->recordDataContainsNonPrimaryKeyData($parentRecordWithForeignKeys); // || $recordIsNew;

         if($parentRecordChanged) {
             // Update the parent row, w/ any new association fields replaced by their IDs
             $newRecordObject = $TableGateway
                 ->addOrUpdateRecordByArray($parentRecordWithForeignKeys)
                 ->toArray();
         }

        // Do it this way, because & byref for outcome of ternary operator spells trouble
        $draftRecord = &$parentRecordWithForeignKeys;
        if($recordIsNew) {
            $draftRecord = &$newRecordObject;
        }

        // Restore X2M relationship / alias fields to the record representation & process these relationships.
        $collectionColumns = TableSchema::getAllAliasTableColumns($tableName);
        foreach($collectionColumns as $collectionColumn) {
            $colName = $collectionColumn['id'];
            if(isset($recordData[$colName])) {
                $draftRecord[$colName] = $recordData[$colName];
            }
        }

        $draftRecord = $TableGateway->addOrUpdateToManyRelationships($schemaArray, $draftRecord, $nestedLogEntries, $nestedCollectionRelationshipsChanged);
        $rowId = $draftRecord['id'];

        $columnNames = TableSchema::getAllNonAliasTableColumnNames($tableName);
        $TemporaryTableGateway = new TableGateway($tableName, $this->adapter);
        $fullRecordData= $TemporaryTableGateway->select(function ($select) use ($rowId, $columnNames) {
            $select->where->equalTo('id', $rowId);
            $select->limit(1)->columns($columnNames);
        })->current();

        if(!$fullRecordData) {
            $recordType = $recordIsNew ? "new" : "pre-existing";
            throw new \RuntimeException("Attempted to load $recordType record post-insert with empty result. Lookup via row id: " . print_r($rowId, true));
        }

        $fullRecordData = (array) $fullRecordData;


        $deltaRecordData = $recordIsNew ? array() : array_intersect_key((array) $parentRecordWithForeignKeys, (array) $fullRecordData);

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
                    'identifier'    => null,
                    'logged_ip'         =>$_SERVER['REMOTE_ADDR']
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
                // Produce log if something changed.
                if($parentRecordChanged || $nestedCollectionRelationshipsChanged) {
                    $logEntryAction = $recordIsNew ? DirectusActivityTableGateway::ACTION_ADD : DirectusActivityTableGateway::ACTION_UPDATE;
                    //If we are updating and active is being set to 0 then we are deleting
                    if(!$recordIsNew && array_key_exists(STATUS_COLUMN_NAME, $deltaRecordData)) {
                      if($deltaRecordData[STATUS_COLUMN_NAME] == STATUS_DELETED_NUM) {
                        $logEntryAction = DirectusActivityTableGateway::ACTION_DELETE;
                      }
                    }
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
                        'row_id'            => $rowId,
                        'logged_ip'         =>$_SERVER['REMOTE_ADDR']
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
     * @param array $schema              The table schema array.
     * @param array $parentRow           The parent record being updated.
     * @return  array
     */
    public function addOrUpdateManyToOneRelationships($schema, $parentRow, &$childLogEntries = null, &$parentCollectionRelationshipsChanged = false) {
        $log = $this->logger();

        // Create foreign row and update local column with the data id
        foreach($schema as $column) {
            $colName = $column['id'];

            // Ignore absent values & non-arrays
            if(!isset($parentRow[$colName]) || !is_array($parentRow[$colName])) {
                continue;
            }

            $fieldIsCollectionAssociation = in_array($column['type'], TableSchema::$association_types);
            $lowercaseColumnType = strtolower($column['type']);

            // Ignore empty OneToMany collections
            $fieldIsOneToMany = ("onetomany" === $lowercaseColumnType);

            // Ignore non-arrays and empty collections
            if(empty($parentRow[$colName])) {
                // Once they're managed, remove the foreign collections from the record array
                unset($parentRow[$colName]);
                continue;
            }

            $foreignDataSet = $parentRow[$colName];

            $colUiType = $column['ui'];

            $isManyToOne = (array_key_exists('relationship', $column) &&
                $column['relationship']['type'] == 'MANYTOONE'
            );

            /** Many-to-One */
            if ($isManyToOne) {
                $foreignRow = $foreignDataSet;
                $foreignTableName = null;

                $foreignTableName = $column['relationship']['table_related'];

                // Update/Add foreign record
                if($this->recordDataContainsNonPrimaryKeyData($foreignRow)) {
                    $foreignRow = $this->addOrUpdateRecordByArray($foreignRow, $foreignTableName);
                }
                $parentRow[$colName] = $foreignRow['id'];
            }

            /** One-to-Many, Many-to-Many */
            elseif ($fieldIsCollectionAssociation) {
                unset($parentRow[$colName]);
            }
        }
        return $parentRow;
    }

    /**
     * @param array $schema              The table schema array.
     * @param array $parentRow           The parent record being updated.
     * @return  array
     */
    public function addOrUpdateToManyRelationships($schema, $parentRow, &$childLogEntries = null, &$parentCollectionRelationshipsChanged = false) {
        $log = $this->logger();

        // Create foreign row and update local column with the data id
        foreach($schema as $column) {
            $colName = $column['id'];

            // Ignore absent values & non-arrays
            if(!isset($parentRow[$colName]) || !is_array($parentRow[$colName])) {
                continue;
            }

            $fieldIsCollectionAssociation = in_array($column['type'], TableSchema::$association_types);
            $lowercaseColumnType = strtolower($column['type']);

            // Ignore empty OneToMany collections
            $fieldIsOneToMany = ("onetomany" === $lowercaseColumnType);

            // Ignore non-arrays and empty collections
            if(empty($parentRow[$colName])) {//} || ($fieldIsOneToMany && )) {
                // Once they're managed, remove the foreign collections from the record array
                unset($parentRow[$colName]);
                continue;
            }

            $foreignDataSet = $parentRow[$colName];
            $colUiType = $column['ui'];

            /** One-to-Many, Many-to-Many */
            if ($fieldIsCollectionAssociation) {
                $this->enforceColumnHasNonNullValues($column['relationship'], array('table_related','junction_key_right'), $this->table);
                $foreignTableName = $column['relationship']['table_related'];
                $foreignJoinColumn = $column['relationship']['junction_key_right'];
                switch ($lowercaseColumnType) {

                    /** One-to-Many */
                    case 'onetomany':
                        foreach ($foreignDataSet as &$foreignRecord) {
                            if(empty($foreignRecord)) {
                                continue;
                            }
                            // only add parent id's to items that are lacking the parent column
                            if (!array_key_exists($foreignJoinColumn, $foreignRecord)) {
                                $foreignRecord[$foreignJoinColumn] = $parentRow['id'];
                            }
                            $foreignRecord = $this->manageRecordUpdate($foreignTableName, $foreignRecord, self::ACTIVITY_ENTRY_MODE_CHILD, $childLogEntries, $parentCollectionRelationshipsChanged);
                        }
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
                        $noDuplicates = isset($column['options']['no_duplicates'])?$column['options']['no_duplicates']:0;

                        $this->enforceColumnHasNonNullValues($column['relationship'], array('junction_table','junction_key_left'), $this->table);
                        $junctionTableName = $column['relationship']['junction_table'];
                        $junctionKeyLeft = $column['relationship']['junction_key_left'];
                        $junctionKeyRight = $column['relationship']['junction_key_right'];
                        $JunctionTable = new RelationalTableGateway($this->acl, $junctionTableName, $this->adapter);
                        $ForeignTable = new RelationalTableGateway($this->acl, $foreignTableName, $this->adapter);
                        foreach($foreignDataSet as $junctionRow) {
                            /** This association is designated for removal */
                            if (isset($junctionRow[STATUS_COLUMN_NAME]) && $junctionRow[STATUS_COLUMN_NAME] == STATUS_DELETED_NUM) {
                              $Where = new Where;
                              $Where->equalTo('id', $junctionRow['id']);
                              $JunctionTable->delete($Where);
                              // Flag the top-level record as having been altered.
                              // (disassociating w/ existing M2M collection entry)
                              $parentCollectionRelationshipsChanged = true;
                              continue;
                            } else if (isset($junctionRow['data']['id'])) {
                              // Is this a new element?
                              // if the element `id` exists it's because is not a new element
                              // and already had its id given.
                              $Where = new Where;
                              $Where->equalTo($junctionKeyLeft, $parentRow['id'])
                                      ->equalTo($junctionKeyRight, $junctionRow['data']['id']);

                              // hard-coded check for sort diff
                              // @todo fix this
                              $junctionRowResult = $JunctionTable->select($Where);
                              if ($junctionRowResult->count()) {
                                // we are expecting one.
                                $junctionRowResultArray = $junctionRowResult->toArray();
                                $junctionRowResultArray = end($junctionRowResultArray);
                                if(array_key_exists('sort', $junctionRow) && array_key_exists('sort', $junctionRowResultArray)) {
                                    if($junctionRowResultArray['sort'] === $junctionRow['sort']) {
                                        continue;
                                    }
                                }
                              }
                            }
                            
                            /** Update foreign record */
                            $foreignRecord = $ForeignTable->manageRecordUpdate($foreignTableName, $junctionRow['data'], self::ACTIVITY_ENTRY_MODE_CHILD, $childLogEntries, $parentCollectionRelationshipsChanged);
                            // Junction/Association row
                            $junctionTableRecord = array(
                                $junctionKeyLeft   => $parentRow['id'],
                                $foreignJoinColumn => $foreignRecord['id']
                            );

                            // Update fields on the Junction Record
                            $junctionTableRecord = array_merge($junctionTableRecord, $junctionRow);

                            $foreignRecord = (array) $foreignRecord;

                            $relationshipChanged = $this->recordDataContainsNonPrimaryKeyData($foreignRecord) ||
                                $this->recordDataContainsNonPrimaryKeyData($junctionTableRecord);

                            // Update Foreign Record
                            if($relationshipChanged) {
                                unset($junctionTableRecord['data']);
                                $JunctionTable->addOrUpdateRecordByArray($junctionTableRecord, $junctionTableName);
                            }
                        }
                        break;
                }
                // Once they're managed, remove the foreign collections from the record array
                unset($parentRow[$colName]);
            }

        }

        return $parentRow;
    }

    public static $defaultEntriesSelectParams = array(
        'orderBy' => 'id', // @todo validate $params['order*']
        'orderDirection' => 'ASC',
        'fields' => '*',
        'perPage' => 500,
        'currentPage' => 0,
        'id' => -1,
        'search' => null,
        STATUS_COLUMN_NAME => null
    );

    public function applyDefaultEntriesSelectParams(array $params) {

        if(isset($params['perPage']) && isset($params['current_page']))
            $params['currentPage'] = $params['current_page'] * $params['perPage'];

        if(isset($params['fields']) && is_array($params['fields']))
            $params['fields'] = array_merge(array('id'), $params['fields']);

        $params = array_merge(self::$defaultEntriesSelectParams, $params);

        // Is there a sort column?
        $tableColumns = array_flip(TableSchema::getTableColumns($this->table, null, true));
        if(array_key_exists('sort', $tableColumns)) {
            $params['orderBy'] = 'sort';
        }

        array_walk($params, array($this, 'castFloatIfNumeric'));

        return $params;
    }

    public function applyParamsToTableEntriesSelect(array $params, Select $select, array $schema, $hasActiveColumn = false) {
        $select->group('id')
            ->order(implode(' ', array($params['orderBy'], $params['orderDirection'])));
        if (isset($params['perPage']) && isset($params['currentPage'])) {
            $select->limit($params['perPage'])
                ->offset($params['currentPage'] * $params['perPage']);
        }

        // Note: be sure to explicitly check for null, because the value may be
        // '0' or 0, which is meaningful.
        if (null !== $params[STATUS_COLUMN_NAME] && $hasActiveColumn) {
            $haystack = is_array($params[STATUS_COLUMN_NAME])
                ? $params[STATUS_COLUMN_NAME]
                : explode(",", $params[STATUS_COLUMN_NAME]);
            $select->where->in(STATUS_COLUMN_NAME, $haystack);
        }

        // Where
        $select
            ->where
            ->nest
                ->expression('-1 = ?', $params['id'])
                ->or
                ->equalTo('id', $params['id'])
            ->unnest;

        if(isset($params['adv_search']) && !empty($params['adv_search'])) {
          $select->where($params['adv_search']);
        } else if(isset($params['search']) && !empty($params['search'])) {
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
        }

        return $select;
    }

    /**
     * Relational Getter
     * NOTE: equivalent to old DB#get_entries
     */
    public function getEntries($params = array()) {
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

        // Table has `status` column?
        $hasActiveColumn = $this->schemaHasActiveColumn($schemaArray);

        $params = $this->applyDefaultEntriesSelectParams($params);

        $sql = new Sql($this->adapter);
        $select = $sql->select()->from($this->table);

        // Only select the fields not on the currently authenticated user group's read field blacklist
        $columnNames = TableSchema::getAllNonAliasTableColumnNames($this->table);

        $select->columns($columnNames);

        if(array_key_exists('related_table_filter', $params)) {
          $select->where->equalTo($params['related_table_filter']['column'], $params['related_table_filter']['val']);
        }

        $select = $this->applyParamsToTableEntriesSelect($params, $select, $schemaArray, $hasActiveColumn);

        $currentUserId = null;
        $currentUser = AuthProvider::getUserInfo();
        $currentUserId = intval($currentUser['id']);

        $cmsOwnerId = $this->acl->getCmsOwnerColumnByTable($this->table);

        //If we have user field and do not have big view privileges but have view then only show entries we created
        if($cmsOwnerId && !$this->acl->hasTablePrivilege($this->table, 'bigview') && $this->acl->hasTablePrivilege($this->table, 'view')) {
          $select->where->equalTo($cmsOwnerId, $currentUserId);
        }

        $results = $this->selectWith($select)->toArray();

        // Note: ensure this is sufficient, in lieu of incrementing within
        // the foreach loop below.
        $foundRows = count($results);

        // Perform data casting based on the column types in our schema array
        $columns = TableSchema::getAllNonAliasTableColumns($this->table);
        foreach ($results as &$row) {
            $row = $this->parseRecordValuesByMysqlType($row, $columns);
        }

        // Eager-load related ManyToOne records
        $results = $this->loadManyToOneRelationships($schemaArray, $results);

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
            $set['rows'] = $results;
            return $set;
        }

        /**
         * Fetching one item
         */

        // @todo return null and let controller throw HTTP response
        if (0 == count($results)) {
            // throw new \DirectusException('Item not found!',404);
            // @todo return null and let controller handle HTTP response
            Bootstrap::get('app')->halt(404);
        }

        list($result) = $results;

        // Separate alias fields from table schema array
        $alias_fields = $this->filterSchemaAliasFields($schemaArray); // (fmrly $alias_schema)

        $result = $this->loadToManyRelationships($result, $alias_fields);

        return $result;
    }

    /**
     *
     * Association Getter Functions
     *
     **/

    /**
     * Throws error if column or relation is missing values
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
        foreach ($aliasColumns as $alias) {
            $foreign_data = null;

            if(array_key_exists('relationship', $alias) && $alias['relationship'] && TableSchema::canGroupViewTable($alias['relationship']['table_related'])) {
                switch($alias['type']) {
                    case 'MANYTOMANY':
                        $this->enforceColumnHasNonNullValues($alias['relationship'], array('table_related','junction_table','junction_key_left','junction_key_right'), $this->table);
                        $foreign_data = $this->loadManyToManyRelationships($this->table, $alias['relationship']['table_related'],
                            $alias['relationship']['junction_table'], $alias['relationship']['junction_key_left'], $alias['relationship']['junction_key_right'],
                            $entry['id']);
                        $noDuplicates = isset($alias['options']['no_duplicates'])?$alias['options']['no_duplicates']:0;
                        // @todo: better way to handle this.
                        if ($noDuplicates) {
                            $uniquesID = array();
                            foreach($foreign_data['rows'] as $index => $row) {
                                if (!in_array($row['data']['id'], $uniquesID)) {
                                    array_push($uniquesID, $row['data']['id']);
                                } else {
                                    unset($foreign_data['rows'][$index]);
                                }
                            }
                            unset($uniquesID);
                        }
                        break;
                    case 'ONETOMANY':
                        $this->enforceColumnHasNonNullValues($alias['relationship'], array('table_related','junction_key_right'), $this->table);
                        $foreign_data = $this->loadOneToManyRelationships($alias['relationship']['table_related'], $alias['relationship']['junction_key_right'], $entry['id']);
                        break;
                }
            }

            if(!is_null($foreign_data)) {
                $column = $alias['column_name'];
                $entry[$column] = $foreign_data;
            }
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
        if(!TableSchema::canGroupViewTable($table)) {
            return false;
        }

        // Run query
        $select = new Select($table);
        $select->where->equalTo($column_name, $column_equals);

        // Only select the fields not on the currently authenticated user group's read field blacklist
        $columns = TableSchema::getAllNonAliasTableColumnNames($table);
        $select->columns($columns);

        $TableGateway = new RelationalTableGateway($this->acl, $table, $this->adapter);
        $rowset = $TableGateway->selectWith($select);
        $results = $rowset->toArray();

        $schemaArray = TableSchema::getSchemaArray($table);
        $results = $this->loadManyToOneRelationships($schemaArray, $results);

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

            $isManyToOneColumn = (
                array_key_exists('relationship', $col) &&
                $col['relationship']['type'] == 'MANYTOONE'
            );

            if ($isManyToOneColumn) {

                $foreign_id_column = $col['id'];

                if(array_key_exists('relationship', $col)) {
                    $foreign_table_name = $col['relationship']['table_related'];

                } else {
                    $message = 'Non single_file Many-to-One relationship lacks `table_related` value.';
                    if(array_key_exists('column_name', $col)) {
                        $message .= " Column: " . $col['column_name'];
                    }
                    if(array_key_exists('table_name', $col)) {
                        $message .= " Table: " . $col['table_name'];
                    }
                    throw new Exception\RelationshipMetadataException($message);
                }

                // Aggregate all foreign keys for this relationship (for each row, yield the specified foreign id)
                $yield = function($row) use ($foreign_id_column, $table_entries) {
                    if(array_key_exists($foreign_id_column, $row)) {
                        return $row[$foreign_id_column];
                    }
                };
                $ids = array_map($yield, $table_entries);
                if (empty($ids)) {
                    continue;
                }

                if(!TableSchema::canGroupViewTable($foreign_table_name)) {
                    continue;
                }

                // Fetch the foreign data
                $select = new Select($foreign_table_name);
                $select->where->in('id', $ids);

                $columnNames = TableSchema::getAllNonAliasTableColumnNames($foreign_table_name);
                $select->columns($columnNames);

                $TableGateway = new RelationalTableGateway($this->acl, $foreign_table_name, $this->adapter);
                $rowset = $TableGateway->selectWith($select);
                $results = $rowset->toArray();

                $foreign_table = array();
                $columns = TableSchema::getAllNonAliasTableColumns($foreign_table_name);
                foreach ($results as $row) {
                    $row = $this->parseRecordValuesByMysqlType($row, $columns);
                    $foreign_table[$row['id']] = $row;
                }

                // Replace foreign keys with foreign rows
                foreach ($table_entries as &$parentRow) {
                    if(array_key_exists($foreign_id_column, $parentRow)) {
                        $foreign_id = (int) $parentRow[$foreign_id_column];
                        $parentRow[$foreign_id_column] = null;
                        // "Did we retrieve the foreign row with this foreign ID in our recent query of the foreign table"?
                        if(array_key_exists($foreign_id, $foreign_table)) {
                            $parentRow[$foreign_id_column] = $foreign_table[$foreign_id];
                        }
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

        $ForeignTable = new RelationalTableGateway($this->acl, $foreign_table, $this->adapter);
        $results = $ForeignTable->selectWith($select);
        $results = $results->toArray();

        $foreign_data = array();
        $columns = TableSchema::getAllNonAliasTableColumns($foreign_table);
        foreach($results as $row) {

            $row = $this->parseRecordValuesByMysqlType($row, $columns);

            $junction_table_id = (int) $row[$junction_id_column_alias];
            unset($row[$junction_id_column_alias]);

            $entry = array('id' => $junction_table_id);
            if(in_array('sort', $junctionColumns)) {
                // @TODO: check why is this a string instead of an integer.
                $entry['sort'] = (int)$row[$junction_sort_column_alias];
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
        if(is_subclass_of($record, 'Zend\Db\RowGateway\AbstractRowGateway')) {
            $record = $record->toArray();
        } elseif(!is_array($record)) {
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
        foreach($resultSet as $rowGateway) {
            $entriesWithRelationships[] = $rowGateway->toArrayWithImmediateRelationships($this);
        }
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
     * Does a table schema array contain an `status` column?
     * @param  array $schema Table schema array.
     * @return boolean
     */
    public function schemaHasActiveColumn($schema) {
        foreach($schema as $col) {
            if(STATUS_COLUMN_NAME == $col['column_name']) {
                return true;
            }
        }
        return false;
    }

    public function parseRecordValuesByMysqlType($record, $nonAliasSchemaColumns) {
        foreach($nonAliasSchemaColumns as $column) {
            $col = $column['id'];
            if(array_key_exists($col, $record)) {
                $record[$col] = $this->parseMysqlType($record[$col], $column['type']);
            }
        }
        return $record;
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
                return ($mysql_data == null) ? null : (int) $mysql_data;
            case 'float':
                return (float) $mysql_data;
            case 'date':
            case 'datetime':
                $nullDate = empty($mysql_data) || ("0000-00-00 00:00:00" == $mysql_data) || ('0000-00-00' === $mysql_data);
                if($nullDate) {
                    return null;
                }
                $date = new \DateTime($mysql_data);
                $formatted = $date->format('Y-m-d H:i:s');
                return $formatted;
            case 'char':
            case 'varchar':
            case 'text':
            case 'tinytext':
            case 'mediumtext':
            case 'longtext':
            case 'var_string':
                return $mysql_data;
        }
        return $mysql_data;
    }

    /**
     * Yield total number of rows on a table, irrespective of any status column.
     * @return int
     */
    public function countTotal(PredicateInterface $predicate = null) {
        $select = new Select($this->table);
        $select->columns(array('total' => new Expression('COUNT(*)')));
        if(!is_null($predicate)) {
            $select->where($predicate);
        }
        $sql = new Sql($this->adapter, $this->table);
        $statement = $sql->prepareStatementForSqlObject($select);
        $results = $statement->execute();
        $row = $results->current();
        return (int) $row['total'];
    }

    /**
     * Only run on tables which have an status column.
     * @return array
     */
    public function countActive() {
        $select = new Select($this->table);
        $select
            ->columns(array(STATUS_COLUMN_NAME, 'quantity' => new Expression('COUNT(*)')))
            ->group(STATUS_COLUMN_NAME);
        $sql = new Sql($this->adapter, $this->table);
        $statement = $sql->prepareStatementForSqlObject($select);
        $results = $statement->execute();
        $stats = array();
        $statusMap = Bootstrap::get('status');
        foreach($results as $row) {
          if(isset($row[STATUS_COLUMN_NAME])) {
            $statSlug = $statusMap[$row[STATUS_COLUMN_NAME]];
            $stats[$statSlug['name']] = (int) $row['quantity'];
          }
        }
        $vals = [];
        foreach($statusMap as $value) {
          array_push($vals, $value['name']);
        }
        $possibleValues = array_values($vals);
        $makeMeZero = array_diff($possibleValues, array_keys($stats));
        foreach($makeMeZero as $unsetActiveColumn) {
            $stats[$unsetActiveColumn] = 0;
        }
        $stats['total'] = array_sum($stats);

        return $stats;
    }

    function countActiveOld($no_active=false) {
        $select = new Select($this->table);

        return array(
            'active' => 0,
            'inactive' => 0,
            'trash' => 0
        );

        $result = array('active'=>0);
        if ($no_active) {
          $select->columns(array('count' => new \Zend\Db\Sql\Expression('COUNT(*)'), STATUS_COLUMN_NAME=>STATUS_COLUMN_NAME));
        } else {
          $select->columns(array(
            new \Zend\Db\Sql\Expression('CASE '.STATUS_COLUMN_NAME.'WHEN 0 THEN \'trash\'
              WHEN 1 THEN \'active\'
              WHEN 2 THEN \'active\'
            END AS '.STATUS_COLUMN_NAME), 'count' => new \Zend\Db\Sql\Expression('COUNT(*)')));
          $select->group(STATUS_COLUMN_NAME);
        }

        $rows = $this->selectWith($select)->toArray();

        print_r($rows);die();

        while($row = $sth->fetch(\PDO::FETCH_ASSOC))
            $result[$row[STATUS_COLUMN_NAME]] = (int)$row['count'];
        $total = 0;
        return $result;
    }
}
