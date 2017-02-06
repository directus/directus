<?php

namespace Directus\Database\TableGateway;

use Directus\Database\Exception;
use Directus\Database\Object\Column;
use Directus\Database\Object\Table;
use Directus\Database\Query\Builder;
use Directus\Database\RowGateway\BaseRowGateway;
use Directus\Database\TableSchema;
use Directus\Util\ArrayUtils;
use Directus\Util\DateUtils;
use Directus\Util\StringUtils;
use Zend\Db\Sql\Expression;
use Zend\Db\Sql\Predicate\PredicateInterface;
use Zend\Db\Sql\Select;
use Zend\Db\Sql\Sql;
use Zend\Db\Sql\Where;
use Zend\Db\TableGateway\TableGateway;

class RelationalTableGateway extends BaseTableGateway
{
    const ACTIVITY_ENTRY_MODE_DISABLED = 0;
    const ACTIVITY_ENTRY_MODE_PARENT = 1;
    const ACTIVITY_ENTRY_MODE_CHILD = 2;

    protected $toManyCallStack = [];

    /**
     * @var array
     */
    protected $defaultEntriesSelectParams = [
        'order' => ['sort' => 'ASC'],
        'limit' => 200,
        'offset' => 0,
        'skip' => null,
        'search' => null,
        'depth' => 1,
        'status' => null
    ];

    protected $operatorShorthand = [
        'eq' => ['operator' => 'equal_to', 'not' => false],
        '='  => ['operator' => 'equal_to', 'not' => false],
        'neq' => ['operator' => 'equal_to', 'not' => true],
        '!='  => ['operator' => 'equal_to', 'not' => true],
        '<>'  => ['operator' => 'equal_to', 'not' => true],
        'in' => ['operator' => 'in', 'not' => false],
        'nin' => ['operator' => 'in', 'not' => true],
        'lt' => ['operator' => 'less_than', 'not' => false],
        'lte' => ['operator' => 'less_than_or_equal', 'not' => false],
        'gt' => ['operator' => 'greater_than', 'not' => false],
        'gte' => ['operator' => 'greater_than_or_equal', 'not' => false],

        'nlike' => ['operator' => 'like', 'not' => true],
        'contains' => ['operator' => 'like'],
        'ncontains' => ['operator' => 'like', 'not' => true],

        '<' => ['operator' => 'less_than', 'not' => false],
        '<=' => ['operator' => 'less_than_or_equal', 'not' => false],
        '>' => ['operator' => 'greater_than', 'not' => false],
        '>=' => ['operator' => 'greater_than_or_equal', 'not' => false],

        'nnull' => ['operator' => 'null', 'not' => true],

        'nempty' => ['operator' => 'empty', 'not' => true],

        'nbetween' => ['operator' => 'between', 'not' => true],
    ];

    public function manageRecordUpdate($tableName, $recordData, $activityEntryMode = self::ACTIVITY_ENTRY_MODE_PARENT, &$childLogEntries = null, &$parentCollectionRelationshipsChanged = false, $parentData = [])
    {
        $TableGateway = $this;
        if ($tableName !== $this->table) {
            $TableGateway = new RelationalTableGateway($tableName, $this->adapter, $this->acl);
        }

        $recordIsNew = !array_key_exists($TableGateway->primaryKeyFieldName, $recordData);

        $tableSchema = TableSchema::getTableSchema($tableName);

        $currentUserId = $this->acl ? $this->acl->getUserId() : null;
        $currentUserGroupId = $this->acl ? $this->acl->getGroupId() : null;

        // Upload file if necessary
        $TableGateway->copyFiles($tableName, $recordData);
        // Delete file if necessary
        $TableGateway->deleteFiles($tableName, $recordData);

        //Dont do for directus users since id is pk
        if ($recordIsNew && $tableName != 'directus_users') {
            $cmsOwnerColumnName = $this->acl->getCmsOwnerColumnByTable($tableName);
            if ($cmsOwnerColumnName) {
                $recordData[$cmsOwnerColumnName] = $currentUserId;
            }
        }

        //Dont let non-admins make admins
        if ($tableName == 'directus_users' && $currentUserGroupId != 1) {
            if (isset($recordData['group']) && $recordData['group']['id'] == 1) {
                unset($recordData['group']);
            }
        }

        $thisIsNested = ($activityEntryMode == self::ACTIVITY_ENTRY_MODE_CHILD);

        // Recursive functions will change this value (by reference) as necessary
        // $nestedCollectionRelationshipsChanged = $thisIsNested ? $parentCollectionRelationshipsChanged : false;
        $nestedCollectionRelationshipsChanged = false;
        if ($thisIsNested) {
            $nestedCollectionRelationshipsChanged = &$parentCollectionRelationshipsChanged;
        }

        // Recursive functions will append to this array by reference
        // $nestedLogEntries = $thisIsNested ? $childLogEntries : [];
        $nestedLogEntries = [];
        if ($thisIsNested) {
            $nestedLogEntries = &$childLogEntries;
        }

        // Update and/or Add Many-to-One Associations
        $parentRecordWithForeignKeys = $TableGateway->addOrUpdateManyToOneRelationships($tableSchema, $recordData, $nestedLogEntries, $nestedCollectionRelationshipsChanged);

        // Merge the M21 foreign keys into the recordData array
        $recordData = array_merge($recordData, $parentRecordWithForeignKeys);

        // If more than the record ID is present.
        $newRecordObject = null;
        $parentRecordChanged = $this->recordDataContainsNonPrimaryKeyData($parentRecordWithForeignKeys); // || $recordIsNew;

        if ($parentRecordChanged) {
            // Update the parent row, w/ any new association fields replaced by their IDs
            $newRecordObject = $TableGateway
                ->addOrUpdateRecordByArray($parentRecordWithForeignKeys);

            if (!$newRecordObject) {
                return [];
            }

            if ($newRecordObject) {
                $newRecordObject = $newRecordObject->toArray();
            }
        }

        // Do it this way, because & byref for outcome of ternary operator spells trouble
        $draftRecord = &$parentRecordWithForeignKeys;
        if ($recordIsNew) {
            $draftRecord = &$newRecordObject;
        }

        // Restore X2M relationship / alias fields to the record representation & process these relationships.
        $collectionColumns = $tableSchema->getAliasColumns();
        foreach ($collectionColumns as $collectionColumn) {
            $colName = $collectionColumn->getId();
            if (isset($recordData[$colName])) {
                $draftRecord[$colName] = $recordData[$colName];
            }
        }

        // parent
        if ($activityEntryMode === self::ACTIVITY_ENTRY_MODE_PARENT) {
            $parentData = [
                'id' => array_key_exists($this->primaryKeyFieldName, $recordData) ? $recordData[$this->primaryKeyFieldName] : null,
                'table_name' => $tableName
            ];
        }

        $draftRecord = $TableGateway->addOrUpdateToManyRelationships($tableSchema, $draftRecord, $nestedLogEntries, $nestedCollectionRelationshipsChanged, $parentData);
        $rowId = $draftRecord[$this->primaryKeyFieldName];

        $columnNames = TableSchema::getAllNonAliasTableColumnNames($tableName);
        $TemporaryTableGateway = new TableGateway($tableName, $this->adapter);
        $fullRecordData = $TemporaryTableGateway->select(function ($select) use ($rowId, $columnNames) {
            $select->where->equalTo($this->primaryKeyFieldName, $rowId);
            $select->limit(1)->columns($columnNames);
        })->current();

        if (!$fullRecordData) {
            $recordType = $recordIsNew ? 'new' : 'pre-existing';
            throw new \RuntimeException('Attempted to load ' . $recordType . ' record post-insert with empty result. Lookup via row id: ' . print_r($rowId, true));
        }

        $fullRecordData = (array)$fullRecordData;


        $deltaRecordData = $recordIsNew ? [] : array_intersect_key((array)$parentRecordWithForeignKeys, (array)$fullRecordData);

        switch ($activityEntryMode) {
            // Activity logging is enabled, and I am a nested action
            case self::ACTIVITY_ENTRY_MODE_CHILD:
                $logEntryAction = $recordIsNew ? DirectusActivityTableGateway::ACTION_ADD : DirectusActivityTableGateway::ACTION_UPDATE;
                $childLogEntries[] = [
                    'type' => DirectusActivityTableGateway::makeLogTypeFromTableName($this->table),
                    'table_name' => $tableName,
                    'action' => $logEntryAction,
                    'user' => $currentUserId,
                    'datetime' => DateUtils::now(),
                    'parent_id' => isset($parentData['id']) ? $parentData['id'] : null,
                    'parent_table' => isset($parentData['table_name']) ? $parentData['table_name'] : null,
                    'data' => json_encode($fullRecordData),
                    'delta' => json_encode($deltaRecordData),
                    'parent_changed' => (int)$parentRecordChanged,
                    'row_id' => $rowId,
                    'identifier' => $this->findRecordIdentifier($tableSchema, $fullRecordData),
                    'logged_ip' => get_request_ip(),// isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : '',
                    'user_agent' => isset($_SERVER['HTTP_USER_AGENT']) ? $_SERVER['HTTP_USER_AGENT'] : ''
                ];
                if ($recordIsNew) {
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
                $recordIdentifier = $this->findRecordIdentifier($tableSchema, $fullRecordData);
                // Produce log if something changed.
                if ($parentRecordChanged || $nestedCollectionRelationshipsChanged) {
                    $logEntryAction = $recordIsNew ? DirectusActivityTableGateway::ACTION_ADD : DirectusActivityTableGateway::ACTION_UPDATE;
                    //If we are updating and active is being set to 0 then we are deleting
                    if (!$recordIsNew && array_key_exists(STATUS_COLUMN_NAME, $deltaRecordData)) {
                        if ($deltaRecordData[STATUS_COLUMN_NAME] == STATUS_DELETED_NUM) {
                            $logEntryAction = DirectusActivityTableGateway::ACTION_DELETE;
                        }
                    }
                    // Save parent log entry
                    $parentLogEntry = BaseRowGateway::makeRowGatewayFromTableName('id', 'directus_activity', $this->adapter, $this->acl);
                    $logData = [
                        'type' => DirectusActivityTableGateway::makeLogTypeFromTableName($this->table),
                        'table_name' => $tableName,
                        'action' => $logEntryAction,
                        'user' => $currentUserId,
                        'datetime' => DateUtils::now(),
                        'parent_id' => null,
                        'data' => json_encode($fullRecordData),
                        'delta' => json_encode($deltaRecordData),
                        'parent_changed' => (int)$parentRecordChanged,
                        'identifier' => $recordIdentifier,
                        'row_id' => $rowId,
                        'logged_ip' => get_request_ip(),// isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : '',
                        'user_agent' => isset($_SERVER['HTTP_USER_AGENT']) ? $_SERVER['HTTP_USER_AGENT'] : ''
                    ];
                    $parentLogEntry->populate($logData, false);
                    $parentLogEntry->save();
                    // Update & insert nested activity entries
                    $ActivityGateway = new DirectusActivityTableGateway($this->adapter, $this->acl);
                    foreach ($nestedLogEntries as $entry) {
                        $entry['parent_id'] = $rowId;
                        // @todo ought to insert these in one batch
                        $ActivityGateway->insert($entry);
                    }
                }
                break;
        }

        // Yield record object
        $recordGateway = new BaseRowGateway($TableGateway->primaryKeyFieldName, $tableName, $this->adapter, $this->acl);
        $fullRecordData = $this->schemaManager->castRecordValues($fullRecordData, $tableSchema->getColumns());
        $recordGateway->populate($fullRecordData, true);

        return $recordGateway;
    }

    /**
     * @param string $table
     * @param array $recordData
     * @return bool
     */
    public function deleteFiles($tableName, $recordData)
    {
        if ($tableName != 'directus_files') {
            return false;
        }

        if (!isset($recordData[STATUS_COLUMN_NAME]) || $recordData[STATUS_COLUMN_NAME] != STATUS_DELETED_NUM) {
            return false;
        }

        $filesTableGateway = new RelationalTableGateway($tableName, $this->adapter, $this->acl);
        $primaryKeyFieldName = $filesTableGateway->primaryKeyFieldName;

        $params = [];
        $params[$primaryKeyFieldName] = $recordData[$primaryKeyFieldName];
        $file = $filesTableGateway->getEntries($params);

        $Files = static::$container->get('files');
        $Files->delete($file);

        return true;
    }

    /**
     * @param string $table
     * @param array $recordData
     * @return bool
     */
    public function copyFiles($tableName, &$recordData)
    {
        $schemaArray = TableSchema::getSchemaArray($tableName);
        foreach ($schemaArray as $column) {
            $colName = $column['id'];

            // Ignore absent values & non-arrays
            if (!isset($recordData[$colName]) || !is_array($recordData[$colName])) {
                continue;
            }

            $foreignRow = $recordData[$colName];

            $colUiType = $column['ui'];

            // $isManyToOne = (array_key_exists('relationship', $column) &&
            //     $column['relationship']['type'] == 'MANYTOONE'
            // );
            // $isManyToMany = (array_key_exists('relationship', $column) &&
            //     $column['relationship']['type'] == 'MANYTOMANY'
            // );

            $foreignTableName = $column['relationship']['related_table'];
            // @todo: rewrite this
            if ($foreignTableName === 'directus_files') {
                // Update/Add foreign record
                $Files = static::$container->get('files');
                if (count(array_filter($foreignRow, 'is_array')) == count($foreignRow)) {
                    $index = 0;
                    foreach ($foreignRow as $row) {
                        if (!isset($row['data'][$this->primaryKeyFieldName]) && isset($row['data']['data'])) {
                            if (array_key_exists('type', $row['data']) && strpos($row['data']['type'], 'embed/') === 0) {
                                $recordData[$colName][$index]['data'] = $Files->saveEmbedData($row['data']);
                            } else {
                                $recordData[$colName][$index]['data'] = $Files->saveData($row['data']['data'], $row['data']['name']);
                                // @NOTE: this is duplicate code from the upload file endpoint
                                //        to maintain the file title.
                                $recordData[$colName][$index]['data'] = array_merge(
                                    $recordData[$colName][$index]['data'],
                                    ArrayUtils::omit($row['data'], ['data', 'name'])
                                );
                            }
                        }

                        unset($recordData[$colName][$index]['data']['data']);
                        $index++;
                    }
                } else {
                    if (!isset($foreignRow[$this->primaryKeyFieldName]) && isset($foreignRow['data'])) {
                        if (array_key_exists('type', $foreignRow) && strpos($foreignRow['type'], 'embed/') === 0) {
                            $recordData[$colName] = $Files->saveEmbedData($foreignRow);
                        } else {
                            $recordData[$colName] = $Files->saveData($foreignRow['data'], $foreignRow['name']);
                            // @NOTE: this is duplicate code from the upload file endpoint
                            //        to maintain the file title.
                            $recordData[$colName] = array_merge($recordData[$colName], ArrayUtils::omit($foreignRow, ['data', 'name']));
                        }
                    }
                    unset($recordData[$colName]['data']);
                }
            }
        }

        return true;
    }

    /**
     * @param Table $schema The table schema array.
     * @param array $parentRow The parent record being updated.
     * @return  array
     */
    public function addOrUpdateManyToOneRelationships($schema, $parentRow, &$childLogEntries = null, &$parentCollectionRelationshipsChanged = false)
    {
        // Create foreign row and update local column with the data id
        foreach ($schema->getColumns() as $column) {
            $colName = $column['id'];

            if (!$column->hasRelationship()) {
                continue;
            }

            // Ignore absent values & non-arrays
            if (!isset($parentRow[$colName]) || !is_array($parentRow[$colName])) {
                continue;
            }

            $relationship = $column['relationship'];
            $fieldIsCollectionAssociation = in_array($relationship['type'], TableSchema::$association_types);
            $lowercaseColumnType = strtolower($relationship['type']);

            // Ignore empty OneToMany collections
            $fieldIsOneToMany = ('onetomany' === $lowercaseColumnType);

            // Ignore non-arrays and empty collections
            if (empty($parentRow[$colName])) {
                // Once they're managed, remove the foreign collections from the record array
                unset($parentRow[$colName]);
                continue;
            }

            $foreignDataSet = $parentRow[$colName];

            $colUiType = $column['ui'];
            // @TODO: create isManyToOne, etc helpers in Relationship and Column
            $isManyToOne = $column->hasRelationship() && $column->getRelationship()->getType() === 'MANYTOONE';

            /** Many-to-One */
            if ($isManyToOne) {
                $foreignRow = $foreignDataSet;
                $foreignTableName = null;

                $foreignTableName = $column['relationship']['related_table'];

                // Update/Add foreign record
                if ($this->recordDataContainsNonPrimaryKeyData($foreignRow)) {
                    $foreignRow = $this->addOrUpdateRecordByArray($foreignRow, $foreignTableName);
                }
                $parentRow[$colName] = $foreignRow['id'];
            } /** One-to-Many, Many-to-Many */
            elseif ($fieldIsCollectionAssociation) {
                unset($parentRow[$colName]);
            }
        }
        return $parentRow;
    }

    /**
     * @param Table $schema The table schema array.
     * @param array $parentRow The parent record being updated.
     * @return  array
     */
    public function addOrUpdateToManyRelationships($schema, $parentRow, &$childLogEntries = null, &$parentCollectionRelationshipsChanged = false, $parentData = [])
    {
        // Create foreign row and update local column with the data id
        foreach ($schema->getColumns() as $column) {
            $colName = $column['id'];

            if (!$column->hasRelationship()) {
                continue;
            }

            // Ignore absent values & non-arrays
            if (!isset($parentRow[$colName]) || !is_array($parentRow[$colName])) {
                continue;
            }

            $relationship = $column['relationship'];
            $fieldIsCollectionAssociation = in_array($relationship['type'], TableSchema::$association_types);
            $lowercaseColumnType = strtolower($relationship['type']);

            // Ignore empty OneToMany collections
            $fieldIsOneToMany = ('onetomany' === $lowercaseColumnType);

            // Ignore non-arrays and empty collections
            if (empty($parentRow[$colName])) {//} || ($fieldIsOneToMany && )) {
                // Once they're managed, remove the foreign collections from the record array
                unset($parentRow[$colName]);
                continue;
            }

            $foreignDataSet = $parentRow[$colName];
            $colUiType = $column['ui'];

            /** One-to-Many, Many-to-Many */
            if ($fieldIsCollectionAssociation) {
                $this->enforceColumnHasNonNullValues($column['relationship'], ['related_table', 'junction_key_right'], $this->table);
                $foreignTableName = $column['relationship']['related_table'];
                $foreignJoinColumn = $column['relationship']['junction_key_right'];
                switch ($lowercaseColumnType) {

                    /** One-to-Many */
                    case 'onetomany':
                        $ForeignTable = new RelationalTableGateway($foreignTableName, $this->adapter, $this->acl);
                        foreach ($foreignDataSet as &$foreignRecord) {
                            if (empty($foreignRecord)) {
                                continue;
                            }

                            $foreignSchema = TableSchema::getTableSchema($ForeignTable->getTable());
                            $hasActiveColumn = $foreignSchema->hasStatusColumn();
                            $foreignColumn = TableSchema::getColumnSchemaArray($ForeignTable->getTable(), $foreignJoinColumn);
                            $hasPrimaryKey = isset($foreignRecord[$ForeignTable->primaryKeyFieldName]);
                            $canBeNull = $foreignColumn->isNullable();

                            if ($hasPrimaryKey && isset($foreignRecord[STATUS_COLUMN_NAME]) && $foreignRecord[STATUS_COLUMN_NAME] === STATUS_DELETED_NUM) {
                                if (!$hasActiveColumn && !$canBeNull) {
                                    $Where = new Where();
                                    $Where->equalTo($ForeignTable->primaryKeyFieldName, $foreignRecord[$ForeignTable->primaryKeyFieldName]);
                                    $ForeignTable->delete($Where);

                                    continue;
                                }

                                if (!$hasActiveColumn || $canBeNull) {
                                    unset($foreignRecord[STATUS_COLUMN_NAME]);
                                }

                                if (!$canBeNull) {
                                    $foreignRecord[$foreignJoinColumn] = $parentRow['id'];
                                }
                            }

                            // only add parent id's to items that are lacking the parent column
                            if (!array_key_exists($foreignJoinColumn, $foreignRecord)) {
                                $foreignRecord[$foreignJoinColumn] = $parentRow['id'];
                            }

                            $foreignRecord = $this->manageRecordUpdate($foreignTableName, $foreignRecord, self::ACTIVITY_ENTRY_MODE_CHILD, $childLogEntries, $parentCollectionRelationshipsChanged, $parentData);
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
                        $noDuplicates = isset($column['options']['no_duplicates']) ? $column['options']['no_duplicates'] : 0;

                        $this->enforceColumnHasNonNullValues($column['relationship'], ['junction_table', 'junction_key_left'], $this->table);
                        $junctionTableName = $column['relationship']['junction_table'];
                        $junctionKeyLeft = $column['relationship']['junction_key_left'];
                        $junctionKeyRight = $column['relationship']['junction_key_right'];
                        $JunctionTable = new RelationalTableGateway($junctionTableName, $this->adapter, $this->acl);
                        $ForeignTable = new RelationalTableGateway($foreignTableName, $this->adapter, $this->acl);
                        foreach ($foreignDataSet as $junctionRow) {
                            /** This association is designated for removal */
                            if (isset($junctionRow[STATUS_COLUMN_NAME]) && $junctionRow[STATUS_COLUMN_NAME] == STATUS_DELETED_NUM) {
                                $Where = new Where;
                                $Where->equalTo($JunctionTable->primaryKeyFieldName, $junctionRow[$JunctionTable->primaryKeyFieldName]);
                                $JunctionTable->delete($Where);
                                // Flag the top-level record as having been altered.
                                // (disassociating w/ existing M2M collection entry)
                                $parentCollectionRelationshipsChanged = true;
                                continue;
                            } else if (isset($junctionRow['data'][$JunctionTable->primaryKeyFieldName])) {
                                // Is this a new element?
                                // if the element `id` exists it's because is not a new element
                                // and already had its id given.
                                $Where = new Where;
                                $Where->equalTo($junctionKeyLeft, $parentRow[$this->primaryKeyFieldName])
                                    ->equalTo($junctionKeyRight, $junctionRow['data'][$JunctionTable->primaryKeyFieldName]);

                                // hard-coded check for sort diff
                                // @todo fix this
                                $junctionRowResult = $JunctionTable->select($Where);
                                if ($junctionRowResult->count()) {
                                    // we are expecting one.
                                    $junctionRowResultArray = $junctionRowResult->toArray();
                                    $junctionRowResultArray = end($junctionRowResultArray);
                                    if (array_key_exists('sort', $junctionRow) && array_key_exists('sort', $junctionRowResultArray)) {
                                        if ($junctionRowResultArray['sort'] === $junctionRow['sort']) {
                                            continue;
                                        }
                                    }
                                }
                            }

                            /** Update foreign record */
                            $foreignRecord = $ForeignTable->manageRecordUpdate($foreignTableName, $junctionRow['data'], self::ACTIVITY_ENTRY_MODE_CHILD, $childLogEntries, $parentCollectionRelationshipsChanged, $parentData);
                            // Junction/Association row
                            $junctionTableRecord = [
                                $junctionKeyLeft => $parentRow[$this->primaryKeyFieldName],
                                $foreignJoinColumn => $foreignRecord[$ForeignTable->primaryKeyFieldName]
                            ];

                            // Update fields on the Junction Record
                            $junctionTableRecord = array_merge($junctionTableRecord, $junctionRow);

                            $foreignRecord = (array)$foreignRecord;

                            $relationshipChanged = $this->recordDataContainsNonPrimaryKeyData($foreignRecord, $ForeignTable->primaryKeyFieldName) ||
                                $this->recordDataContainsNonPrimaryKeyData($junctionTableRecord, $JunctionTable->primaryKeyFieldName);

                            // Update Foreign Record
                            if ($relationshipChanged) {
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

    public function applyDefaultEntriesSelectParams(array $params)
    {
        $defaultParams = $this->defaultEntriesSelectParams;
        // Is not there a sort column?
        $tableColumns = array_flip(TableSchema::getTableColumns($this->table, null, true));
        if (!array_key_exists('sort', $tableColumns)) {
            unset($defaultParams['order']);
        }

        $params = array_merge($defaultParams, $params);

        // convert csv columns into array
        $columns = ArrayUtils::get($params, 'columns', []);
        if (!is_array($columns)) {
            $columns = StringUtils::csv($columns, true);
        }

        // filter all 'falsy' columns name
        $columns = array_filter($columns);

        // Stripe whitespaces
        $columns = array_map('trim', $columns);

        // Add columns to params if it's not empty.
        // otherwise remove from params
        if (!empty($columns)) {
            $params['columns'] = $columns;
        } else {
            ArrayUtils::remove($params, 'columns');
        }

        if ($params['limit'] === null) {
            ArrayUtils::remove($params, 'limit');
        }

        array_walk($params, [$this, 'castFloatIfNumeric']);

        return $params;
    }

    /**
     * @param array $params
     * @param Builder $builder
     * @param Table $schema
     * @param bool $hasActiveColumn
     *
     * @return Builder
     */
    public function applyParamsToTableEntriesSelect(array $params, Builder $builder, Table $schema, $hasActiveColumn = false)
    {
        // @TODO: Query Builder Object
        foreach($params as $type => $argument) {
            $method = 'process' . ucfirst($type);
            if (method_exists($this, $method)) {
                call_user_func_array([$this, $method], [$builder, $argument]);
            }
        }

        $this->applyLegacyParams($builder, $params);

        return $builder;
    }

    /**
     * Relational Getter
     * NOTE: equivalent to old DB#get_entries
     */
    public function getEntries($params = [])
    {
        if (!is_array($params)) {
            $params = [];
        }

        return $this->getItems($params);
    }

    /**
     * Get table items
     *
     * @param array $params
     *
     * @return array|mixed
     */
    public function getItems(array $params = [])
    {
        $entries = $this->loadItems($params);
        // @NOTE: it should has another name
        //        this evolved into something else
        $entries = $this->loadMetadata($entries);

        return $entries;
    }

    public function loadMetadata($entriesData)
    {
        return [
            'meta' => $this->createMetadata($entriesData),
            'data' => $entriesData
        ];
    }

    public function createMetadata($entriesData)
    {
        $singleEntry = !ArrayUtils::isNumericKeys($entriesData);
        $tableSchema = TableSchema::getTableSchema($this->table);
        $metadata = [
            'table' => $tableSchema->getTableName(),
            'type' => $singleEntry ? 'item' : 'collection'
        ];

        if (!$singleEntry) {
            $metadata = array_merge($metadata, $this->createEntriesMetadata($entriesData, $tableSchema));
        }

        return $metadata;
    }

    /**
     * Create entries metadata
     *
     * @param array $entries
     * @param Table $tableSchema
     * @return array
     */
    public function createEntriesMetadata($entries, Table $tableSchema)
    {
        $metadata = [
            'table' => $tableSchema->getTableName(),
            'total' => count($entries)
        ];

        if ($tableSchema->hasStatusColumn()) {
            $statusCount = $this->countByStatus();
            $metadata = array_merge($metadata, $statusCount);
        } else {
            $metadata['total_entries'] = $this->countTotal();
        }

        return $metadata;
    }

    /**
     * Load Table entries
     *
     * @param array $params
     * @param \Closure|null $queryCallback
     *
     * @return mixed
     */
    public function loadItems(array $params = [], \Closure $queryCallback = null)
    {
        // Get table column schema
        $tableSchema = $this->getTableSchema();

        // table only has one column
        // return an empty array
        if ($tableSchema === false || count($tableSchema->getColumns()) <= 1) {
            return [];
        }

        $hasActiveColumn = $tableSchema->hasStatusColumn();

        // when preview is passed was true, it means returns everything! active, draft and soft-delete.
        if (ArrayUtils::has($params, 'preview') && ArrayUtils::get($params, 'preview', false) === true) {
            $params['status'] = null;
        }

        $params = $this->applyDefaultEntriesSelectParams($params);
        // @TODO: Create a new TableGateway Query Builder based on Query\Builder
        $builder = new Builder($this->getAdapter());
        $builder->from($this->getTable());

        if (ArrayUtils::has($params, 'columns')) {
            $columns = array_unique(array_merge($tableSchema->getPrimaryKeysName(), $params['columns']));
        } else {
            $columns = $tableSchema->getColumnsName();
        }

        $nonAliasColumns = ArrayUtils::intersection($columns, $tableSchema->getNonAliasColumnsName());
        $builder->columns($nonAliasColumns);
        $builder = $this->applyParamsToTableEntriesSelect($params, $builder, $tableSchema, $hasActiveColumn);

        // If we have user field and do not have big view privileges but have view then only show entries we created
        $cmsOwnerId = $this->acl ? $this->acl->getCmsOwnerColumnByTable($this->table) : null;
        $currentUserId = $this->acl ? $this->acl->getUserId() : null;
        if ($cmsOwnerId && !$this->acl->hasTablePrivilege($this->table, 'bigview') && $this->acl->hasTablePrivilege($this->table, 'view')) {
            $builder->whereEqualTo($cmsOwnerId, $currentUserId);
        }

        if ($queryCallback !== null) {
            $builder = $queryCallback($builder);
        }

        // Run the builder Select with this tablegateway
        // to run all the hooks against the result
        $results = $this->selectWith($builder->buildSelect())->toArray();

        // ==========================================================================
        // Perform data casting based on the column types in our schema array
        // and Convert dates into ISO 8601 Format
        // ==========================================================================
        $results = $this->parseRecord($results);

        $depth = ArrayUtils::get($params, 'depth', null);
        if ($depth !== null) {
            $paramColumns = ArrayUtils::get($params, 'columns', []);
            $relationalColumns = $tableSchema->getRelationalColumnsName();

            if ($paramColumns) {
                $relationalColumns = ArrayUtils::intersection($paramColumns, $relationalColumns);
            }

            $results = $this->loadRelationalDataByDepth($results, (int) $depth, $relationalColumns);
        }

        // When the params column list doesn't include the primary key
        // it should be included because each row gateway expects the primary key
        // after all the row gateway are created and initiated it only returns the chosen columns
        if (ArrayUtils::has($params, 'columns')) {
            $primaryKeysName = $tableSchema->getPrimaryKeysName();
            if (!ArrayUtils::contains(array_flip(ArrayUtils::get($params, 'columns')), $primaryKeysName)) {
                $results = array_map(function ($entry) use ($primaryKeysName) {
                    return ArrayUtils::omit($entry, $primaryKeysName);
                }, $results);
            }
        }

        if (ArrayUtils::get($params, $this->primaryKeyFieldName)) {
            $results = reset($results);
        }

        return $results ? $results : [];
    }

    /**
     * Load Table entries
     *
     * Alias of loadItems
     *
     * @param array $params
     * @param \Closure|null $queryCallback
     *
     * @return mixed
     */
    public function loadEntries(array $params = [], \Closure $queryCallback = null)
    {
        return $this->loadItems($params, $queryCallback);
    }

    /**
     * Loads all relational data by depth level
     *
     * @param $result
     * @param int $maxDepth
     * @param array|null $columns
     *
     * @return array
     */
    protected function loadRelationalDataByDepth($result, $maxDepth = 0, array $columns = [])
    {
        if ((int) $maxDepth <= 0 || !$columns) {
            return $result;
        }

        $columns = $this->getTableSchema()->getColumns($columns);

        $maxDepth--;
        $result = $this->loadManyToOneRelationships($result, $maxDepth, $columns);
        $result = $this->loadOneToManyRelationships($result, $maxDepth, $columns);
        $result = $this->loadManyToManyRelationships($result, $maxDepth, $columns);

        return $result;
    }

    /**
     * Process Select Filters (Where conditions)
     *
     * @param Builder $query
     * @param array $filters
     */
    protected function processFilters(Builder $query, array $filters = [])
    {
        foreach($filters as $column => $condition) {
            $operator = is_array($condition) ? key($condition) : '=';
            $value = is_array($condition) ? current($condition) : $condition;
            $not = false;

            // Get information about the operator shorthand
            if (ArrayUtils::has($this->operatorShorthand, $operator)) {
                $operatorShorthand = $this->operatorShorthand[$operator];
                $operator = ArrayUtils::get($operatorShorthand, 'operator', $operator);
                $not = ArrayUtils::get($operatorShorthand, 'not', !$value);
            }

            $operatorName = StringUtils::underscoreToCamelCase(strtolower($operator), true);
            $method = 'where' . ($not === true ? 'Not' : '') . $operatorName;
            if (!method_exists($query, $method)) {
                continue;
            }

            if ($operator === 'between' && !is_array($value)) {
                $value = explode(',', $value);
            }

            $arguments = [$column, $value];
            $relationship = TableSchema::getColumnRelationship($this->getTable(), $column);
            if (in_array($operator, ['all', 'has']) && in_array($relationship->getType(), ['ONETOMANY', 'MANYTOMANY'])) {
                if ($operator == 'all' && is_string($value)) {
                    $value = array_map(function ($item) {
                        return trim($item);
                    }, explode(',', $value));
                } else if ($operator == 'has') {
                    $value = (int) $value;
                }

                if ($relationship->getType() == 'ONETOMANY') {
                    $arguments = [
                        $this->primaryKeyFieldName,
                        $relationship->getRelatedTable(),
                        null,
                        $relationship->getJunctionKeyRight(),
                        $value
                    ];
                } else {
                    $arguments = [
                        $this->primaryKeyFieldName,
                        $relationship->getJunctionTable(),
                        $relationship->getJunctionKeyLeft(),
                        $relationship->getJunctionKeyRight(),
                        $value
                    ];
                }
            }

            call_user_func_array([$query, $method], $arguments);
        }
    }

    /**
     * Process Select Order
     *
     * @param Builder $query
     * @param array $order
     */
    protected function processOrder(Builder $query, array $order)
    {
        foreach($order as $orderBy => $orderDirection) {
            $query->orderBy($orderBy, $orderDirection);
        }
    }

    /**
     * Process Select Limit
     *
     * @param Builder $query
     * @param int $limit
     */
    protected function processLimit(Builder $query, $limit)
    {
        $query->limit((int) $limit);
    }

    /**
     * Process Select offset
     *
     * @param Builder $query
     * @param int $offset
     */
    protected function processOffset(Builder $query, $offset)
    {
        $query->offset((int) $offset);
    }

    /**
     * Apply legacy params to support old api requests
     *
     * @param Builder $query
     * @param array $params
     */
    protected function applyLegacyParams(Builder $query, array $params = [])
    {
        // @TODO: Clear query order
        // "order" will be replace it with "orderBy", if presented
        if (ArrayUtils::has($params, 'orderBy')) {
            $query->clearOrder();
            $query->orderBy($params['orderBy'], ArrayUtils::get($params, 'orderDirection', 'ASC'));
        }

        // sort, sort_order will replace "order" and "orderBy", if presented
        if (ArrayUtils::has($params, 'sort')) {
            $query->clearOrder();
            $query->orderBy($params['sort'], ArrayUtils::get($params, 'sort_order', 'ASC'));
        }

        if (ArrayUtils::has($params, $this->primaryKeyFieldName)) {
            $query->whereEqualTo($this->primaryKeyFieldName, $params[$this->primaryKeyFieldName]);
            $query->limit(1);
        }

        if (ArrayUtils::has($params, 'status') && TableSchema::hasStatusColumn($this->getTable())) {
            $statuses = $params['status'];
            if (!is_array($statuses)) {
                $statuses = array_map(function($item) {
                    return trim($item);
                }, explode(',', $params['status']));
            }

            $statuses = array_filter($statuses);
            if ($statuses) {
                $query->whereIn(STATUS_COLUMN_NAME, $statuses);
            }
        }

        if (ArrayUtils::has($params, 'adv_where') && is_array($params['adv_where'])) {
            $query->where(key($params['adv_where']), '=', current($params['adv_where']));
        }

        if (ArrayUtils::has($params, 'ids')) {
            $entriesIds = array_map(function($item) {
                return trim($item);
            }, explode(',', $params['ids']));
            if (count($entriesIds) > 0) {
                $query->whereIn($this->primaryKeyFieldName, $entriesIds);
            }
        }

        if (ArrayUtils::has($params, 'perPage') && ArrayUtils::has($params, 'currentPage')) {
            $query->limit($params['perPage']);
            $query->offset($params['currentPage'] * $params['perPage']);
        }

        if (ArrayUtils::has($params, 'group_by')) {
            $query->groupBy($params['group_by']);
        }

        // Filter entries that match one of these values separated by comma
        // in[field]=value1,value2
        if (ArrayUtils::has($params, 'in') && is_array($params['in'])) {
            foreach($params['in'] as $column => $values) {
                $values = array_map(function($item) {
                    return trim($item);
                }, explode(',', $values));

                if (count($values) > 0) {
                    $query->whereIn($this->primaryKeyFieldName, $values);
                }
            }
        }
    }

    /**
     * Throws error if column or relation is missing values
     * @param  array $column One schema column representation.
     * @param  array $requiredKeys Values requiring definition.
     * @param  string $tableName
     * @return void
     * @throws  \Directus\Database\Exception\RelationshipMetadataException If the required values are undefined.
     */
    private function enforceColumnHasNonNullValues($column, $requiredKeys, $tableName)
    {
        $erroneouslyNullKeys = [];
        foreach ($requiredKeys as $key) {
            if (!isset($column[$key]) || (strlen(trim($column[$key])) === 0)) {
                $erroneouslyNullKeys[] = $key;
            }
        }
        if (!empty($erroneouslyNullKeys)) {
            $msg = 'Required column/ui metadata columns on table ' . $tableName . ' lack values: ';
            $msg .= implode(' ', $requiredKeys);
            throw new Exception\RelationshipMetadataException($msg);
        }
    }

    /**
     * Load one to many relational data
     *
     * @param array $entries
     * @param int $depth
     * @param Column[] $columns
     *
     * @return bool|array
     */
    public function loadOneToManyRelationships($entries, $depth = 0, $columns)
    {
        foreach ($columns as $alias) {
            if (!$alias->isAlias() || !$alias->isOneToMany()) {
                continue;
            }

            $relatedTableName = $alias->getRelationship()->getRelatedTable();
            if (!TableSchema::canGroupViewTable($relatedTableName)) {
                return false;
            }

            $primaryKey = $this->primaryKeyFieldName;
            $callback = function($row) use ($primaryKey) {
                return ArrayUtils::get($row, $primaryKey, null);
            };

            $ids = array_filter(array_map($callback, $entries));
            if (empty($ids)) {
                continue;
            }

            // Only select the fields not on the currently authenticated user group's read field blacklist
            $columns = TableSchema::getAllNonAliasTableColumnNames($relatedTableName);
            $relationalColumnName = $alias->getRelationship()->getJunctionKeyRight();
            $tableGateway = new RelationalTableGateway($relatedTableName, $this->adapter, $this->acl);
            $results = $tableGateway->loadEntries([
                'columns' => $columns,
                'filters' => [
                    $relationalColumnName => ['in' => $ids]
                ],
                'depth' => $depth
            ]);

            $relatedEntries = [];
            foreach ($results as $row) {
                // Quick fix
                // @NOTE: When fetching a column that also has another relational field
                // the value is not a scalar value but an array with all the data associated to it.
                // @TODO: Make this result a object so it can be easy to interact.
                // $row->getId(); RowGateway perhaps?
                $relationalColumnId = $row[$relationalColumnName];
                if (is_array($relationalColumnId)) {
                    $relationalColumnId = $relationalColumnId['data']['id'];
                }

                $relatedEntries[$relationalColumnId][] = $row;
            }

            // Replace foreign keys with foreign rows
            $relationalColumnName = $alias->getName();
            foreach ($entries as &$parentRow) {
                $rows = ArrayUtils::get($relatedEntries, $parentRow[$primaryKey], []);
                $parentRow[$relationalColumnName] = $tableGateway->loadMetadata($rows);
                $hookPayload = new \stdClass();
                $hookPayload->data = $tableGateway->loadMetadata($rows);
                $hookPayload->column = $alias;
                $hookPayload = $this->applyHook('load.relational.onetomany', $hookPayload);

                $parentRow[$relationalColumnName] = $hookPayload->data;
            }
        }

        return $entries;
    }

    /**
     * Load many to many relational data
     *
     * @param array $entries
     * @param int $depth
     * @param Column[] $columns
     *
     * @return bool|array
     */
    public function loadManyToManyRelationships($entries, $depth = 0, $columns)
    {
        foreach ($columns as $alias) {
            if (!$alias->isAlias() || !$alias->isManyToMany()) {
                continue;
            }

            $relatedTableName = $alias->getRelationship()->getRelatedTable();
            if (!TableSchema::canGroupViewTable($relatedTableName)) {
                return false;
            }

            $primaryKey = $this->primaryKeyFieldName;
            $callback = function($row) use ($primaryKey) {
                return ArrayUtils::get($row, $primaryKey, null);
            };

            $ids = array_filter(array_map($callback, $entries));
            if (empty($ids)) {
                continue;
            }

            // Only select the fields not on the currently authenticated user group's read field blacklist
            $relatedTableColumns = TableSchema::getAllTableColumnsName($relatedTableName);
            $junctionKeyRightColumn = $alias->getRelationship()->getJunctionKeyRight();
            $junctionKeyLeftColumn = $alias->getRelationship()->getJunctionKeyLeft();
            $junctionTableName = $alias->getRelationship()->getJunctionTable();

            $relatedTableGateway = new RelationalTableGateway($relatedTableName, $this->adapter, $this->acl);
            $relatedTablePrimaryKey = TableSchema::getTablePrimaryKey($relatedTableName);

            $on = $this->getColumnIdentifier($junctionKeyRightColumn, $junctionTableName) . ' = ' . $this->getColumnIdentifier($relatedTablePrimaryKey, $relatedTableName);
            $junctionColumns = TableSchema::getAllNonAliasTableColumnNames($junctionTableName);
            if (in_array('sort', $junctionColumns)) {
                $joinColumns[] = 'sort';
            }

            $joinColumns = [];
            $joinColumnsPrefix = StringUtils::randomString() . '_';
            foreach($junctionColumns as $junctionColumn) {
                $joinColumns[$joinColumnsPrefix . $junctionColumn] = $junctionColumn;
            }

            $queryCallBack = function(Builder $query) use ($junctionTableName, $on, $joinColumns, $ids, $joinColumnsPrefix) {
                $query->join($junctionTableName, $on, $joinColumns);
                if (in_array('sort', $joinColumns)) {
                    $query->orderBy($joinColumnsPrefix . 'sort', 'ASC');
                }

                return $query;
            };

            $results = $relatedTableGateway->loadEntries([
                'columns' => $relatedTableColumns,
                'filters' => [
                    $junctionKeyLeftColumn => ['in' => $ids]
                ],
                'depth' => $depth
            ], $queryCallBack);

            $relationalColumnName = $alias->getName();
            $relatedEntries = [];
            foreach ($results as $row) {
                $relatedEntries[$row[$joinColumnsPrefix . $junctionKeyLeftColumn]][] = $row;
            }

            $uiOptions = $alias->getUIOptions();
            $noDuplicates = (bool) ArrayUtils::get($uiOptions, 'no_duplicates', false);
            if ($noDuplicates) {
                foreach($relatedEntries as $key => $rows) {
                    $uniquesID = [];
                    foreach ($rows as $index => $row) {
                        if (!in_array($row[$relatedTablePrimaryKey], $uniquesID)) {
                            array_push($uniquesID, $row[$relatedTablePrimaryKey]);
                        } else {
                            unset($relatedEntries[$key][$index]);
                        }
                    }

                    unset($uniquesID);
                    // =========================================================
                    // Reset keys
                    // ---------------------------------------------------------
                    // This prevent json output using numeric ids as key
                    // Ex:
                    // {
                    //      rows: {
                    //          "1": {
                    //              data: {id: 1}
                    //          },
                    //          "3" {
                    //              data: {id: 2}
                    //          }
                    //      }
                    // }
                    // Instead of:
                    // {
                    //      rows: [
                    //          {
                    //              data: {id: 1}
                    //          },
                    //          {
                    //              data: {id: 2}
                    //          }
                    //      ]
                    // }
                    // =========================================================
                    $relatedEntries[$key] = array_values($relatedEntries[$key]);
                }
            }

            // Replace foreign keys with foreign rows
            foreach ($entries as &$parentRow) {
                $data = ArrayUtils::get($relatedEntries, $parentRow[$primaryKey], []);
                $row = array_map(function($row) use ($joinColumns) {
                    return ArrayUtils::omit($row, array_keys($joinColumns));
                }, $data);

                $junctionData = array_map(function($row) use ($joinColumns, $joinColumnsPrefix) {
                    $row = ArrayUtils::pick($row, array_keys($joinColumns));
                    $newRow = [];
                    foreach($row as $column => $value) {
                        $newRow[substr($column, strlen($joinColumnsPrefix))] = $value;
                    }

                    return $newRow;
                }, $data);

                $junctionTableGateway = new RelationalTableGateway($junctionTableName, $this->getAdapter(), $this->acl);
                $junctionData = $this->schemaManager->castRecordValues($junctionData, TableSchema::getTableSchema($junctionTableName)->getColumns());
                $junctionData = $junctionTableGateway->loadMetadata($junctionData);

                $row = $relatedTableGateway->loadMetadata($row);
                $row['junction'] = $junctionData;
                $parentRow[$relationalColumnName] = $row;
            }
        }

        return $entries;
    }

    /**
     * Fetch related, foreign rows for a whole rowset's ManyToOne relationships.
     * (Given a table's schema and rows, iterate and replace all of its foreign
     * keys with the contents of these foreign rows.)
     *
     * @param array $entries Table rows
     * @param int $depth
     * @param Column[] $columns
     *
     * @return array Revised table rows, now including foreign rows
     *
     * @throws Exception\RelationshipMetadataException
     */
    public function loadManyToOneRelationships($entries, $depth = 0, $columns)
    {
        $tableSchema = TableSchema::getTableSchema($this->getTable());
        // Identify the ManyToOne columns
        foreach ($columns as $column) {
            if (!$column->isManyToOne()) {
                continue;
            }

            $relatedTable = $column->getRelationship()->getRelatedTable();
            if (!$relatedTable) {
                $message = 'Non single_file Many-to-One relationship lacks `related_table` value.';
                if ($column->getName()) {
                    $message .= ' Column: ' . $column->getName();
                }

                if ($column->getTableName()) {
                    $message .= ' Table: ' . $column->getTableName();
                }

                throw new Exception\RelationshipMetadataException($message);
            }

            // Aggregate all foreign keys for this relationship (for each row, yield the specified foreign id)
            $relationalColumnName = $column->getName();
            $yield = function ($row) use ($relationalColumnName, $entries) {
                if (array_key_exists($relationalColumnName, $row)) {
                    $value = $row[$relationalColumnName];
                    if (is_array($value)) {
                        // @TODO: Dynamic primary key
                        $value = isset($value['id']) ? $value['id'] : 0;
                    }

                    return $value;
                }
            };

            $ids = array_filter(array_map($yield, $entries));
            if (empty($ids)) {
                continue;
            }

            if (!TableSchema::canGroupViewTable($relatedTable)) {
                continue;
            }

            // Fetch the foreign data
            $tableGateway = new RelationalTableGateway($relatedTable, $this->adapter, $this->acl);
            $columnNames = TableSchema::getAllNonAliasTableColumnNames($relatedTable);

            $results = $tableGateway->loadEntries([
                'columns' => $columnNames,
                'filters' => [
                    'id' => ['in' => $ids]
                ],
                'depth' => (int) $depth
            ]);

            $relatedEntries = [];
            foreach ($results as $row) {
                $relatedEntries[$row['id']] = $tableGateway->loadMetadata($row);
            }

            // Replace foreign keys with foreign rows
            foreach ($entries as &$parentRow) {
                if (array_key_exists($relationalColumnName, $parentRow)) {
                    // @NOTE: Not always will be a integer
                    $foreign_id = (int)$parentRow[$relationalColumnName];
                    $parentRow[$relationalColumnName] = null;
                    // "Did we retrieve the foreign row with this foreign ID in our recent query of the foreign table"?
                    if (array_key_exists($foreign_id, $relatedEntries)) {
                        $parentRow[$relationalColumnName] = $relatedEntries[$foreign_id];
                    }
                }
            }
        }

        return $entries;
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
    public function recordDataContainsNonPrimaryKeyData($record, $pkFieldName = 'id')
    {
        if (is_subclass_of($record, 'Zend\Db\RowGateway\AbstractRowGateway')) {
            $record = $record->toArray();
        } elseif (!is_array($record)) {
            throw new \InvalidArgumentException('$record must an array or a subclass of AbstractRowGateway');
        }
        $keyCount = count($record);
        return array_key_exists($pkFieldName, $record) ? $keyCount > 1 : $keyCount > 0;
    }

    /**
     * Update a collection of records within this table.
     * @param  array $entries Array of records.
     * @return void
     */
    public function updateCollection($entries)
    {
        $entries = ArrayUtils::isNumericKeys($entries) ? $entries : [$entries];
        foreach ($entries as $entry) {
            $entry = $this->manageRecordUpdate($this->table, $entry);
            $entry->save();
        }
    }

    /**
     * Get the total entries count
     *
     * @param PredicateInterface|null $predicate
     *
     * @return int
     */
    public function countTotal(PredicateInterface $predicate = null)
    {
        $select = new Select($this->table);
        $select->columns(['total' => new Expression('COUNT(*)')]);
        if (!is_null($predicate)) {
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
    public function countActive()
    {
        return $this->countByStatus();
    }

    public function countByStatus()
    {
        $tableSchema = TableSchema::getTableSchema($this->getTable());
        if (!$tableSchema->hasStatusColumn()) {
            return ['total_entries' => $this->countTotal()];
        }

        $select = new Select($this->getTable());
        $select
            ->columns([STATUS_COLUMN_NAME, 'quantity' => new Expression('COUNT(*)')])
            ->group(STATUS_COLUMN_NAME);
        $sql = new Sql($this->adapter, $this->table);
        $statement = $sql->prepareStatementForSqlObject($select);
        $results = $statement->execute();

        $statusMap = TableSchema::getStatusMap();
        $stats = [];
        foreach ($results as $row) {
            if (isset($row[STATUS_COLUMN_NAME])) {
                $statSlug = $statusMap[$row[STATUS_COLUMN_NAME]];
                $stats[$statSlug['name']] = (int) $row['quantity'];
            }
        }

        $vals = [];
        foreach ($statusMap as $value) {
            array_push($vals, $value['name']);
        }

        $possibleValues = array_values($vals);
        $makeMeZero = array_diff($possibleValues, array_keys($stats));
        foreach ($makeMeZero as $unsetActiveColumn) {
            $stats[$unsetActiveColumn] = 0;
        }

        $stats['total_entries'] = array_sum($stats);

        return $stats;
    }

    function countActiveOld($no_active = false)
    {
        $select = new Select($this->table);

        return [
            'active' => 0,
            'inactive' => 0,
            'trash' => 0
        ];

        $result = ['active' => 0];
        if ($no_active) {
            $select->columns(['count' => new \Zend\Db\Sql\Expression('COUNT(*)'), STATUS_COLUMN_NAME => STATUS_COLUMN_NAME]);
        } else {
            $select->columns([
                new \Zend\Db\Sql\Expression('CASE ' . STATUS_COLUMN_NAME . 'WHEN 0 THEN \'trash\'
              WHEN 1 THEN \'active\'
              WHEN 2 THEN \'active\'
            END AS ' . STATUS_COLUMN_NAME), 'count' => new \Zend\Db\Sql\Expression('COUNT(*)')
            ]);
            $select->group(STATUS_COLUMN_NAME);
        }

        $rows = $this->selectWith($select)->toArray();

        print_r($rows);
        die();

        while ($row = $sth->fetch(\PDO::FETCH_ASSOC))
            $result[$row[STATUS_COLUMN_NAME]] = (int)$row['count'];
        $total = 0;
        return $result;
    }
}
