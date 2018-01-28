<?php

namespace Directus\Database\TableGateway;

use Directus\Database\Exception;
use Directus\Database\Filters\Filter;
use Directus\Database\Filters\In;
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
        'limit' => 200,
        'offset' => 0,
        'skip' => null,
        'search' => null,
        'meta' => 1,
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

        'nhas' => ['operator' => 'has', 'not' => true],

        'nbetween' => ['operator' => 'between', 'not' => true],
    ];

    public function updateRecord($recordData, $activityEntryMode = self::ACTIVITY_ENTRY_MODE_PARENT)
    {
        return $this->manageRecordUpdate($this->getTable(), $recordData, $activityEntryMode);
    }

    public function manageRecordUpdate($tableName, $recordData, $activityEntryMode = self::ACTIVITY_ENTRY_MODE_PARENT, &$childLogEntries = null, &$parentCollectionRelationshipsChanged = false, $parentData = [])
    {
        $TableGateway = $this;
        if ($tableName !== $this->getTable()) {
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

        // Do not set owner id to directus_users since id is the owner column
        if ($recordIsNew && $tableName != 'directus_users') {
            $cmsOwnerColumnName = $this->acl->getCmsOwnerColumnByTable($tableName);
            if ($cmsOwnerColumnName) {
                $recordData[$cmsOwnerColumnName] = $currentUserId;
            }
        }

        // Do not let non-admins make admins
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
        $recordData = $TableGateway->addOrUpdateManyToOneRelationships($tableSchema, $recordData, $nestedLogEntries, $nestedCollectionRelationshipsChanged);

        $parentRecordWithoutAlias = [];
        foreach ($recordData as $key => $data) {
            $column = $tableSchema->getColumn($key);

            if ($column && !$column->isAlias()) {
                $parentRecordWithoutAlias[$key] = $data;
            }
        }

        // NOTE: set the primary key to null
        // to default the value to whatever increment value is next
        // avoiding the error of inserting nothing
        if (empty($parentRecordWithoutAlias)) {
            $parentRecordWithoutAlias[$tableSchema->getPrimaryColumn()] = null;
        }

        // If more than the record ID is present.
        $newRecordObject = null;
        $parentRecordChanged = $this->recordDataContainsNonPrimaryKeyData($recordData);

        if ($parentRecordChanged) {
            // Update the parent row, w/ any new association fields replaced by their IDs
            $newRecordObject = $TableGateway
                ->addOrUpdateRecordByArray($parentRecordWithoutAlias);

            if (!$newRecordObject) {
                return [];
            }

            if ($newRecordObject) {
                $newRecordObject = $newRecordObject->toArray();
            }
        }

        // Do it this way, because & byref for outcome of ternary operator spells trouble
        $draftRecord = &$parentRecordWithoutAlias;
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

        $fullRecordData = (array) $fullRecordData;
        $deltaRecordData = $recordIsNew ? [] : array_intersect_key((array)$parentRecordWithoutAlias, (array) $fullRecordData);

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
                    $statusColumnName = $tableSchema->getStatusColumn();
                    $logEntryAction = $recordIsNew ? DirectusActivityTableGateway::ACTION_ADD : DirectusActivityTableGateway::ACTION_UPDATE;
                    //If we are updating and active is being set to 0 then we are deleting
                    if (!$recordIsNew && array_key_exists($statusColumnName, $deltaRecordData)) {
                        // Get status delete value
                        $statusColumnObject = $tableSchema->getColumn($statusColumnName);
                        $deletedValue = ArrayUtils::get($statusColumnObject->getOptions(), 'delete_value', STATUS_DELETED_NUM);

                        if ($deltaRecordData[$statusColumnName] == $deletedValue) {
                            $logEntryAction = DirectusActivityTableGateway::ACTION_DELETE;
                        }
                    }
                    // Save parent log entry
                    $parentLogEntry = BaseRowGateway::makeRowGatewayFromTableName('id', 'directus_activity', $this->adapter);
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
                    $ActivityGateway = new DirectusActivityTableGateway($this->adapter);
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
     * @param string $tableName
     * @param array $recordData
     *
     * @return bool
     */
    public function deleteFiles($tableName, $recordData)
    {
        if ($tableName != 'directus_files') {
            return false;
        }

        $statusColumnName = TableSchema::getTableSchema($tableName)->getStatusColumn();

        // Get status delete value
        $tableSchema = $this->getTableSchema();
        $statusColumnObject = $tableSchema->getColumn($statusColumnName);
        $deletedValue = ArrayUtils::get($statusColumnObject->getOptions(), 'delete_value', STATUS_DELETED_NUM);

        if (!isset($recordData[$statusColumnName]) || $recordData[$statusColumnName] != $deletedValue) {
            return false;
        }

        return $this->deleteFile($recordData[$tableSchema->getPrimaryColumn()]);
    }

    public function deleteFile($id)
    {
        $tableName = 'directus_files';
        $tableSchema = $this->getTableSchema();
        $primaryKeyFieldName = $tableSchema->getPrimaryColumn();

        $filesTableGateway = new RelationalTableGateway($tableName, $this->adapter, $this->acl, null, null, null, $primaryKeyFieldName);

        $params = [];
        $params[$primaryKeyFieldName] = $id;
        $file = $filesTableGateway->loadItems($params);

        if ($file) {
            $Files = static::$container->get('files');
            $Files->delete($file);
        }

        return true;
    }

    /**
     * @param string $tableName
     * @param array $recordData
     *
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
            if ($foreignTableName === 'directus_files' && static::$container) {
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

            if (!$column->isManyToOne()) {
                continue;
            }

            // Ignore absent values & non-arrays
            if (!isset($parentRow[$colName]) || !is_array($parentRow[$colName])) {
                continue;
            }

            // Ignore non-arrays and empty collections
            if (empty($parentRow[$colName])) {
                // Once they're managed, remove the foreign collections from the record array
                unset($parentRow[$colName]);
                continue;
            }

            $foreignDataSet = $parentRow[$colName];
            $foreignRow = $foreignDataSet;
            $foreignTableName = $column->getRelationship()->getRelatedTable();
            $foreignTableSchema = $this->getTableSchema($foreignTableName);

            // Update/Add foreign record
            if ($this->recordDataContainsNonPrimaryKeyData($foreignRow, $foreignTableSchema->getPrimaryColumn())) {
                // NOTE: using manageRecordUpdate instead of addOrUpdateRecordByArray to update related data
                $foreignRow = $this->manageRecordUpdate($foreignTableName, $foreignRow);
            }

            $parentRow[$colName] = $foreignRow[$foreignTableSchema->getPrimaryColumn()];
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

            // Ignore non-arrays and empty collections
            if (empty($parentRow[$colName])) {//} || ($fieldIsOneToMany && )) {
                // Once they're managed, remove the foreign collections from the record array
                unset($parentRow[$colName]);
                continue;
            }

            $foreignDataSet = $parentRow[$colName];

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
                            // TODO: Fix a bug when fetching a single column
                            // before fetching all columns from a table
                            // due to our basic "cache" implementation on schema layer
                            $foreignColumn = $foreignSchema->getColumn($foreignJoinColumn);
                            $hasPrimaryKey = isset($foreignRecord[$ForeignTable->primaryKeyFieldName]);
                            $canBeNull = $foreignColumn->isNullable();

                            // Get status delete value
                            $deletedValue = STATUS_DELETED_NUM;
                            if ($hasActiveColumn) {
                                $statusColumnName = $foreignSchema->getStatusColumn();
                                $statusColumnObject = $foreignSchema->getColumn($statusColumnName);
                                $deletedValue = ArrayUtils::get($statusColumnObject->getOptions(), 'delete_value', STATUS_DELETED_NUM);
                            }

                            if ($hasPrimaryKey && isset($foreignRecord[$foreignSchema->getStatusColumn()]) && $foreignRecord[$foreignSchema->getStatusColumn()] === $deletedValue) {
                                if (!$hasActiveColumn && !$canBeNull) {
                                    $Where = new Where();
                                    $Where->equalTo($ForeignTable->primaryKeyFieldName, $foreignRecord[$ForeignTable->primaryKeyFieldName]);
                                    $ForeignTable->delete($Where);

                                    continue;
                                }

                                if (!$hasActiveColumn || $canBeNull) {
                                    unset($foreignRecord[$foreignSchema->getStatusColumn()]);
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
                            $hasPrimaryKey = isset($junctionRow[$JunctionTable->primaryKeyFieldName]);
                            $statusColumnName = TableSchema::getStatusColumn($junctionTableName);

                            if ($statusColumnName) {
                                $statusColumnObject = $JunctionTable->getTableSchema()->getColumn($statusColumnName);
                                $deletedValue = ArrayUtils::get($statusColumnObject->getOptions(), 'delete_value', STATUS_DELETED_NUM);
                            } else {
                                $statusColumnName = STATUS_COLUMN_NAME;
                                $deletedValue = STATUS_DELETED_NUM;
                            }

                            $hasStatus = isset($junctionRow[$statusColumnName]);

                            if ($hasPrimaryKey && $hasStatus && $junctionRow[$statusColumnName] == $deletedValue) {
                                $Where = new Where;
                                $Where->equalTo($JunctionTable->primaryKeyFieldName, $junctionRow[$JunctionTable->primaryKeyFieldName]);
                                $JunctionTable->delete($Where);
                                // Flag the top-level record as having been altered.
                                // (disassociating w/ existing M2M collection entry)
                                $parentCollectionRelationshipsChanged = true;
                                continue;
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
        $rowsPerPage = $this->getSettings('global.rows_per_page');

        // set rows limit from db settings
        if ($rowsPerPage) {
            $defaultParams['limit'] = $rowsPerPage;
        }

        $tableSchema = $this->getTableSchema();
        $sortingColumnName = $tableSchema->getSortColumn();

        if ($sortingColumnName) {
            $defaultParams['order'] = [$sortingColumnName => 'ASC'];
        } else if ($this->primaryKeyFieldName) {
            $defaultParams['order'] = [$this->primaryKeyFieldName => 'ASC'];
        }

        // Is not there a sort column?
        $tableColumns = array_flip(TableSchema::getTableColumns($this->table, null, true));
        if (!$this->primaryKeyFieldName || !array_key_exists($this->primaryKeyFieldName, $tableColumns)) {
            unset($defaultParams['order']);
        }

        if (ArrayUtils::get($params, 'preview')) {
            $defaultParams['status'] = null;
            // Remove the status from param if preview is set
            ArrayUtils::remove($params, 'status');
        } else if (!ArrayUtils::has($params, 'status')) {
            $defaultParams['status'] = $this->getPublishedStatuses();
        }

        $params = array_merge($defaultParams, $params);

        // convert csv columns into array
        $columns = ArrayUtils::get($params, 'columns', []);
        if (!is_array($columns) && is_string($columns)) {
            $columns = StringUtils::csv($columns, true);
        }

        // filter all 'falsy' columns name
        $columns = array_filter($columns);

        // Stripe whitespaces
        $columns = array_map('trim', $columns);

        // ----------------------------------------------------------------------------
        // merge legacy visible columns param
        // ----------------------------------------------------------------------------
        // if both columns and columns_visible are passed columns are prioritized
        // ----------------------------------------------------------------------------
        $visibleColumns = ArrayUtils::get($params, 'columns_visible', []);
        // columns_visible are expected to be an array
        if (!is_array($visibleColumns)) {
            $visibleColumns = StringUtils::csv($visibleColumns, true);
        }

        $columns = array_unique(array_merge($visibleColumns, $columns));

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
        foreach ($params as $type => $argument) {
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

        $single = ArrayUtils::has($params, 'id') || ArrayUtils::has($params, 'single');
        $meta = ArrayUtils::get($params, 'meta', 1);

        return $this->wrapData($entries, $single, $meta);
    }

    /**
     * wrap the query result into the api response format
     *
     * TODO: This will be soon out of TableGateway
     *
     * @param array $data
     * @param bool $single
     * @param bool $meta
     *
     * @return array
     */
    public function wrapData($data, $single = false, $meta = true)
    {
        $result = [];

        if ($meta) {
            $result['meta'] = $this->createMetadata($data, $single);
        }

        $result['data'] = $data;

        return $result;
    }

    public function loadMetadata($data, $single = false)
    {
        return $this->wrapData($data, $single);
    }

    public function createMetadata($entriesData, $single)
    {
        $singleEntry = $single || !ArrayUtils::isNumericKeys($entriesData);
        $metadata = $this->createGlobalMetadata($singleEntry);

        if (!$singleEntry) {
            $metadata = array_merge($metadata, $this->createEntriesMetadata($entriesData));
        }

        return $metadata;
    }

    /**
     * Creates the "global" metadata
     *
     * @param $single
     *
     * @return array
     */
    public function createGlobalMetadata($single)
    {
        return [
            'table' => $this->getTable(),
            'type' => $single ? 'item' : 'collection'
        ];
    }

    /**
     * Create entries metadata
     *
     * @param array $entries
     *
     * @return array
     */
    public function createEntriesMetadata($entries)
    {
        $tableSchema = $this->getTableSchema($this->table);

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

        if(ArrayUtils::has($params, 'single')) {
            $params['limit'] = 1;
        }

        $params = $this->applyDefaultEntriesSelectParams($params);

        // // NOTE: fallback to all columns the user has permission to
        $columns = ArrayUtils::get($params, 'columns', TableSchema::getAllTableColumnsName($tableSchema->getName()));

        // TODO: Create a new TableGateway Query Builder based on Query\Builder
        $builder = new Builder($this->getAdapter());
        $builder->from($this->getTable());
        $builder->columns(ArrayUtils::intersection(
            array_unique(array_merge($tableSchema->getPrimaryKeysName(), get_columns_flat_at($columns, 0))),
            TableSchema::getAllNonAliasTableColumnNames($tableSchema->getName())
        ));
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

        $columnsDepth = ArrayUtils::deepLevel(get_unflat_columns($columns));
        $depth = $columnsDepth > 0
                    ? $columnsDepth + 1
                    : ArrayUtils::get($params, 'depth', 0);

        if ((int)$depth > 0) {
            $relationalColumns = ArrayUtils::intersection(
                get_columns_flat_at($columns, 0),
                $tableSchema->getRelationalColumnsName()
            );

            $relationalColumns = array_filter(get_unflat_columns($columns), function ($key) use ($relationalColumns) {
                return in_array($key, $relationalColumns);
            }, ARRAY_FILTER_USE_KEY);

            $relationalParams = [
                'meta' => ArrayUtils::get($params, 'meta', 1),
                'preview' => ArrayUtils::get($params, 'preview', 0)
            ];

            $results = $this->loadRelationalDataByDepth(
                $results,
                (int)$depth,
                $relationalColumns,
                $relationalParams
            );
        }

        // When the params column list doesn't include the primary key
        // it should be included because each row gateway expects the primary key
        // after all the row gateway are created and initiated it only returns the chosen columns
        if (ArrayUtils::has($params, 'columns')) {
            $visibleColumns = get_columns_flat_at($columns, 0);

            $results = array_map(function ($entry) use ($visibleColumns) {
                foreach ($entry as $key => $value) {
                    if (!in_array($key, $visibleColumns)) {
                        $entry = ArrayUtils::omit($entry, $key);
                    }
                }

                return $entry;
            }, $results);
        }

        // FIXME: This was a bug that was let it live too long
        // it should've been 'id' instead of the actual primary key name
        if (ArrayUtils::get($params, $this->primaryKeyFieldName) || ArrayUtils::has($params, 'single')) {
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
     * @param array $params
     *
     * @return array
     */
    protected function loadRelationalDataByDepth($result, $maxDepth = 0, array $columns = [], array $params = [])
    {
        if ((int) $maxDepth <= 0 || !$columns) {
            return $result;
        }

        $maxDepth--;
        $result = $this->loadManyToOneRelationships($result, $maxDepth, $columns, $params);
        $result = $this->loadOneToManyRelationships($result, $maxDepth, $columns, $params);
        $result = $this->loadManyToManyRelationships($result, $maxDepth, $columns, $params);

        return $result;
    }

    /**
     * Parse Filter "condition" (this is the filter key value)
     *
     * @param $condition
     *
     * @return array
     */
    protected function parseCondition($condition)
    {
        // TODO: Add a simplified option for logical
        // adding an "or_" prefix
        // filters[column][eq]=Value1&filters[column][or_eq]=Value2
        $logical = null;
        if (is_array($condition) && isset($condition['logical'])) {
            $logical = $condition['logical'];
            unset($condition['logical']);
        }

        $operator = is_array($condition) ? key($condition) : '=';
        $value = is_array($condition) ? current($condition) : $condition;
        $not = false;

        return [
            'operator' => $operator,
            'value' => $value,
            'not' => $not,
            'logical' => $logical
        ];
    }

    protected function parseDotFilters(Builder $mainQuery, array $filters)
    {
        foreach ($filters as $column => $condition) {
            if (!is_string($column) || strpos($column, '.') === false) {
                continue;
            }

            $columnList = $columns = explode('.', $column);
            $columnsTable = [
                $this->getTable()
            ];

            $nextColumn = array_shift($columnList);
            $nextTable = $this->getTable();
            $relational = TableSchema::hasRelationship($nextTable, $nextColumn);

            while ($relational) {
                $nextTable = TableSchema::getRelatedTableName($nextTable, $nextColumn);
                $nextColumn = array_shift($columnList);
                $relational = TableSchema::hasRelationship($nextTable, $nextColumn);
                $columnsTable[] = $nextTable;
            }

            // if one of the column in the list has not relationship
            // it will break the loop before going over all the columns
            // which we will call this as column not found
            // TODO: Better error message
            if (!empty($columnList)) {
                throw new Exception\ColumnNotFoundException($nextColumn);
            }

            // Remove the original filter column with dot-notation
            unset($filters[$column]);

            // Reverse all the columns from comments.author.id to id.author.comments
            // To filter from the most deep relationship to their parents
            $columns = explode('.', column_identifier_reverse($column));
            $columnsTable = array_reverse($columnsTable, true);

            // var_dump($columns, $columnsTable);
            $mainColumn = array_pop($columns);
            $mainTable = array_pop($columnsTable);

            // var_dump($mainColumn, $mainTable);
            // the main query column
            // where the filter is going to be applied
            $column = array_shift($columns);
            $table = array_shift($columnsTable);

            $query = new Builder($this->getAdapter());
            $mainTableObject = $this->getTableSchema($table);
            $query->columns([$mainTableObject->getPrimaryColumn()]);
            $query->from($table);

            $this->doFilter($query, $column, $condition, $table);

            $index = 0;
            foreach ($columns as $key => $column) {
                ++$index;

                $oldQuery = $query;
                $query = new Builder($this->getAdapter());
                $tableObject = $this->getTableSchema($columnsTable[$key]);
                $columnObject = $tableObject->getColumn($column);

                $selectColumn = $tableObject->getPrimaryColumn();
                $table = $columnsTable[$key];

                if ($columnObject->isAlias()) {
                    $column = $tableObject->getPrimaryColumn();
                }

                if ($columnObject->isManyToMany()) {
                    $selectColumn = $columnObject->getRelationship()->getJunctionKeyLeft();
                    $column = $columnObject->getRelationship()->getJunctionKeyRight();
                    $table = $columnObject->getRelationship()->getJunctionTable();
                }

                $query->columns([$selectColumn]);
                $query->from($table);
                $query->whereIn($column, $oldQuery);
            }

            $tableObject = $this->getTableSchema($mainTable);
            $columnObject = $tableObject->getColumn($mainColumn);
            $relationship = $columnObject->getRelationship();

            // TODO: Make all this whereIn duplication into a function
            // TODO: Can we make the O2M simpler getting the parent id from itself
            //       right now is creating one unnecessary select
            if ($columnObject->isManyToMany() || $columnObject->isOneToMany()) {
                $mainColumn = $tableObject->getPrimaryColumn();
                $oldQuery = $query;
                $query = new Builder($this->getAdapter());

                if ($columnObject->isManyToMany()) {
                    $selectColumn = $relationship->getJunctionKeyLeft();
                    $table = $relationship->getJunctionTable();
                    $column = $relationship->getJunctionKeyRight();
                } else {
                    $selectColumn = $relationship->getJunctionKeyRight();
                    $table = $relationship->getRelatedTable();
                    $column = $relationship->getJunctionKeyRight();
                }

                $query->columns([$selectColumn]);
                $query->from($table);
                $query->whereIn(
                    $column,
                    $oldQuery
                );
            }

            $this->doFilter(
                $mainQuery,
                $mainColumn,
                [
                    'in' => $query
                ],
                $mainTable
            );
        }

        return $filters;
    }

    protected function doFilter(Builder $query, $column, $condition, $table)
    {
        $columnObject = $this->getColumnSchema(
            // $table will be the default value to get
            // if the column has not identifier format
            $this->getColumnFromIdentifier($column),
            $this->getTableFromIdentifier($column, $table)
        );

        $condition = $this->parseCondition($condition);
        $operator = ArrayUtils::get($condition, 'operator');
        $value = ArrayUtils::get($condition, 'value');
        $not = ArrayUtils::get($condition, 'not');
        $logical = ArrayUtils::get($condition, 'logical');

        // TODO: if there's more, please add a better way to handle all this
        if ($columnObject->isToMany()) {
            // translate some non-x2m relationship filter to x2m equivalent (if exists)
            switch ($operator) {
                case 'empty':
                    // convert x2m empty
                    // to not has at least one record
                    $operator = 'has';
                    $not = true;
                    $value = 1;
                    break;
            }
        }

        // Get information about the operator shorthand
        if (ArrayUtils::has($this->operatorShorthand, $operator)) {
            $operatorShorthand = $this->operatorShorthand[$operator];
            $operator = ArrayUtils::get($operatorShorthand, 'operator', $operator);
            $not = ArrayUtils::get($operatorShorthand, 'not', !$value);
        }

        $operatorName = StringUtils::underscoreToCamelCase(strtolower($operator), true);
        $method = 'where' . ($not === true ? 'Not' : '') . $operatorName;
        if (!method_exists($query, $method)) {
            return false;
        }

        $splitOperators = ['between', 'in'];
        // TODO: Add exception for API 2.0
        if (in_array($operator, $splitOperators) && is_scalar($value)) {
            $value = explode(',', $value);
        }

        $arguments = [$column, $value];

        if (isset($logical)) {
            $arguments[] = null;
            $arguments[] = $logical;
        }

        if (in_array($operator, ['all', 'has']) && $columnObject->isToMany()) {
            if ($operator == 'all' && is_string($value)) {
                $value = array_map(function ($item) {
                    return trim($item);
                }, explode(',', $value));
            } else if ($operator == 'has') {
                $value = (int) $value;
            }

            $primaryKey = $this->getTableSchema($table)->getPrimaryColumn();
            $relationship = $columnObject->getRelationship();
            if ($relationship->getType() == 'ONETOMANY') {
                $arguments = [
                    $primaryKey,
                    $relationship->getRelatedTable(),
                    null,
                    $relationship->getJunctionKeyRight(),
                    $value
                ];
            } else {
                $arguments = [
                    $primaryKey,
                    $relationship->getJunctionTable(),
                    $relationship->getJunctionKeyLeft(),
                    $relationship->getJunctionKeyRight(),
                    $value
                ];
            }
        }

        // TODO: Move this into QueryBuilder if possible
        if (in_array($operator, ['like']) && $columnObject->isManyToOne()) {
            $relatedTable = $columnObject->getRelationship()->getRelatedTable();
            $tableSchema = TableSchema::getTableSchema($relatedTable);
            $relatedTableColumns = $tableSchema->getColumns();
            $relatedPrimaryColumnName = $tableSchema->getPrimaryColumn();
            $query->orWhereRelational($this->getColumnFromIdentifier($column), $relatedTable, $relatedPrimaryColumnName, function (Builder $query) use ($column, $relatedTable, $relatedTableColumns, $value) {
                $query->nestOrWhere(function (Builder $query) use ($relatedTableColumns, $relatedTable, $value) {
                    foreach ($relatedTableColumns as $column) {
                        // NOTE: Only search numeric or string type columns
                        $isNumeric = $this->getSchemaManager()->isNumericType($column->getType());
                        $isString = $this->getSchemaManager()->isStringType($column->getType());
                        if (!$column->isAlias() && ($isNumeric || $isString)) {
                            $query->orWhereLike($column->getName(), $value);
                        }
                    }
                });
            });
        } else {
            call_user_func_array([$query, $method], $arguments);
        }
    }

    /**
     * Process Select Filters (Where conditions)
     *
     * @param Builder $query
     * @param array $filters
     */
    protected function processFilters(Builder $query, array $filters = [])
    {
        // NOTE: The filters are going to be nested as this filters should collapse with the main "AND" conditions
        // any ORs inside filters are not going to be affect the others conditions
        $query->nestWhere(function (Builder $childQuery) use ($filters) {
            $childQuery->from($this->getTable());
            $filters = $this->parseDotFilters($childQuery, $filters);

            foreach ($filters as $column => $condition) {
                if ($condition instanceof Filter) {
                    $column =  $condition->getIdentifier();
                    $condition = $condition->getValue();
                }

                $this->doFilter($childQuery, $column, $condition, $this->getTable());
            }
        });
    }

    /**
     * Process column joins
     *
     * @param Builder $query
     * @param array $joins
     */
    protected function processJoins(Builder $query, array $joins = [])
    {
        // @TODO allow passing columns
        $columns = []; // leave as this and won't get any ambiguous columns
        foreach ($joins as $table => $params) {
            // TODO: Reduce this into a simpler instructions
            // by simpler it means remove the duplicate join() line
            if (isset($params['on'])) {
                // simple joins style
                // 'table' => ['on' => ['col1', 'col2'] ]
                if (!isset($params['type'])) {
                    $params['type'] = 'INNER';
                }

                $params['on'] = implode('=', $params['on']);

                $query->join($table, $params['on'], $columns, $params['type']);
            } else {
                // many join style
                // 'table' => [ ['on' => ['col1', 'col2'] ] ]
                foreach ($params as $method => $options) {
                    if (! isset($options['type'])) {
                        $options['type'] = 'INNER';
                    }
                    $query->join($table, $options['on'], $columns, $options['type']);
                }
            }
        }
    }

    /**
     * Process group-by
     *
     * @param Builder $query
     * @param array|string $columns
     */
    protected function processGroups(Builder $query, $columns = [])
    {
        if (!is_array($columns)) {
            $columns = explode(',', $columns);
        }

        $query->groupBy($columns);
    }

    /**
     * Process Query search
     *
     * @param Builder $query
     * @param $search
     */
    protected function processQ(Builder $query, $search)
    {
        $columns = TableSchema::getAllTableColumns($this->getTable());
        $table = $this->getTable();

        $query->nestWhere(function (Builder $query) use ($columns, $search, $table) {
            foreach ($columns as $column) {
                // NOTE: Only search numeric or string type columns
                $isNumeric = $this->getSchemaManager()->isNumericType($column->getType());
                $isString = $this->getSchemaManager()->isStringType($column->getType());
                if (!$isNumeric && !$isString) {
                    continue;
                }

                if ($column->isManyToOne()) {
                    $relationship = $column->getRelationship();
                    $relatedTable = $relationship->getRelatedTable();
                    $tableSchema = TableSchema::getTableSchema($relatedTable);
                    $relatedTableColumns = $tableSchema->getColumns();
                    $relatedPrimaryColumnName = $tableSchema->getPrimaryColumn();
                    $query->orWhereRelational($column->getName(), $relatedTable, $relatedPrimaryColumnName, function (Builder $query) use ($column, $relatedTable, $relatedTableColumns, $search) {
                        $query->nestOrWhere(function (Builder $query) use ($relatedTableColumns, $relatedTable, $search) {
                            foreach ($relatedTableColumns as $column) {
                                // NOTE: Only search numeric or string type columns
                                $isNumeric = $this->getSchemaManager()->isNumericType($column->getType());
                                $isString = $this->getSchemaManager()->isStringType($column->getType());
                                if (!$column->isAlias() && ($isNumeric || $isString)) {
                                    $query->orWhereLike($column->getName(), $search);
                                }
                            }
                        });
                    });
                } else if ($column->isOneToMany()) {
                    $relationship = $column->getRelationship();
                    $relatedTable = $relationship->getRelatedTable();
                    $relatedRightColumn = $relationship->getJunctionKeyRight();
                    $relatedTableColumns = TableSchema::getAllTableColumns($relatedTable);

                    $query->from($table);
                    // TODO: Test here it may be not setting the proper primary key name
                    $query->orWhereRelational($this->primaryKeyFieldName, $relatedTable, null, $relatedRightColumn, function(Builder $query) use ($column, $relatedTable, $relatedTableColumns, $search) {
                        foreach ($relatedTableColumns as $column) {
                            // NOTE: Only search numeric or string type columns
                            $isNumeric = $this->getSchemaManager()->isNumericType($column->getType());
                            $isString = $this->getSchemaManager()->isStringType($column->getType());
                            if (!$column->isAlias() && ($isNumeric || $isString)) {
                                $query->orWhereLike($column->getName(), $search, false);
                            }
                        }
                    });
                } else if ($column->isManyToMany()) {
                    // @TODO: Implement Many to Many search
                } else if (!$column->isAlias()) {
                    $query->orWhereLike($column->getName(), $search);
                }
            }
        });
    }

    /**
     * Process Select Order
     *
     * @param Builder $query
     * @param array $order
     *
     * @throws Exception\ColumnNotFoundException
     */
    protected function processOrder(Builder $query, array $order)
    {
        foreach($order as $orderBy => $orderDirection) {
            if (!TableSchema::hasTableColumn($this->table, $orderBy, $this->acl === null)) {
                throw new Exception\ColumnNotFoundException($orderBy);
            }

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
     *
     * @throws Exception\ColumnNotFoundException
     */
    protected function applyLegacyParams(Builder $query, array $params = [])
    {
        // @TODO: Clear query order
        // "order" will be replace it with "orderBy", if presented
        if (ArrayUtils::has($params, 'orderBy')) {
            $query->clearOrder();

            if (!TableSchema::hasTableColumn($this->table, $params['orderBy'], $this->acl === null)) {
                throw new Exception\ColumnNotFoundException($params['orderBy']);
            }

            $query->orderBy($params['orderBy'], ArrayUtils::get($params, 'orderDirection', 'ASC'));
        }

        // sort, sort_order will replace "order" and "orderBy", if presented
        if (ArrayUtils::has($params, 'sort')) {
            $query->clearOrder();

            if (!TableSchema::hasTableColumn($this->table, $params['sort'], $this->acl === null)) {
                throw new Exception\ColumnNotFoundException($params['sort']);
            }

            $query->orderBy($params['sort'], ArrayUtils::get($params, 'sort_order', 'ASC'));
        }

        if (ArrayUtils::has($params, $this->primaryKeyFieldName)) {
            $query->whereEqualTo($this->primaryKeyFieldName, $params[$this->primaryKeyFieldName]);
            $query->limit(1);
        }

        $skipAcl = $this->acl === null;
        if (ArrayUtils::get($params, 'status') && TableSchema::hasStatusColumn($this->getTable(), $skipAcl)) {
            $statuses = $params['status'];
            if (!is_array($statuses)) {
                $statuses = array_map(function($item) {
                    return trim($item);
                }, explode(',', $params['status']));
            }

            $statuses = array_filter($statuses);
            if ($statuses) {
                $query->whereIn(TableSchema::getStatusColumn(
                    $this->getTable(),
                    $this->acl === null
                ), $statuses);
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

        if (ArrayUtils::has($params, 'perPage')) {
            $query->limit($params['perPage']);
            $query->offset(ArrayUtils::get($params, 'currentPage', 0) * $params['perPage']);
        }

        if (ArrayUtils::has($params, 'group_by')) {
            $groupBy = $params['group_by'];

            if (!is_array($groupBy)) {
                $groupBy = explode(',', $params['group_by']);
            }

            $query->groupBy($groupBy);
        }

        // Filter entries that match one of these values separated by comma
        // in[field]=value1,value2
        if (ArrayUtils::has($params, 'in') && is_array($params['in'])) {
            foreach($params['in'] as $column => $values) {
                if (! is_array($values)) {
                    $values = array_map(function ($item) {
                        return trim($item);
                    }, explode(',', $values));
                }

                if (count($values) > 0) {
                    $query->whereIn($column, $values);
                }
            }
        }

        if (!ArrayUtils::has($params, 'q') && ArrayUtils::has($params, 'search')) {
            $search = ArrayUtils::get($params, 'search', '');

            if ($search) {
                $columns = TableSchema::getAllNonAliasTableColumns($this->getTable());
                $query->nestWhere(function (Builder $query) use ($columns, $search) {
                    foreach ($columns as $column) {
                        if ($column->getType() === 'VARCHAR' || $column->getType()) {
                            $query->whereLike($column->getName(), $search);
                        }
                    }
                }, 'or');
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
     * @param array $params
     *
     * @return bool|array
     */
    public function loadOneToManyRelationships($entries, $depth = 0, $columns, array $params = [])
    {
        $visibleColumns = $this->getTableSchema()->getColumns(array_keys($columns));
        foreach ($visibleColumns as $alias) {
            if (!$alias->isAlias() || !$alias->isOneToMany()) {
                continue;
            }

            $relatedTableName = $alias->getRelationship()->getRelatedTable();
            if ($this->acl && !TableSchema::canGroupViewTable($relatedTableName)) {
                continue;
            }

            $primaryKey = $this->primaryKeyFieldName;
            $callback = function($row) use ($primaryKey) {
                return ArrayUtils::get($row, $primaryKey, null);
            };

            $ids = array_unique(array_filter(array_map($callback, $entries)));
            if (empty($ids)) {
                continue;
            }

            // Only select the fields not on the currently authenticated user group's read field blacklist
            $relationalColumnName = $alias->getRelationship()->getJunctionKeyRight();
            $tableGateway = new RelationalTableGateway($relatedTableName, $this->adapter, $this->acl);
            $results = $tableGateway->loadEntries(array_merge([
                // Fetch all related data
                'limit' => -1,
                'filters' => [
                    $relationalColumnName => ['in' => $ids]
                ],
                'depth' => $depth
            ], $params));

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
                $parentRow[$relationalColumnName] = $tableGateway->wrapData(
                    $rows,
                    false,
                    ArrayUtils::get($params, 'meta', 1)
                );
                // $hookPayload = new \stdClass();
                // $hookPayload->data = $tableGateway->loadMetadata($rows);
                // $hookPayload->column = $alias;
                // $hookPayload = $this->applyHook('load.relational.onetomany', $hookPayload);
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
     * @param array $params
     *
     * @return bool|array
     */
    public function loadManyToManyRelationships($entries, $depth = 0, $columns, array $params = [])
    {
        $visibleColumns = $this->getTableSchema()->getColumns(array_keys($columns));
        foreach ($visibleColumns as $alias) {
            if (!$alias->isAlias() || !$alias->isManyToMany()) {
                continue;
            }

            $relatedTableName = $alias->getRelationship()->getRelatedTable();
            if ($this->acl && !TableSchema::canGroupViewTable($relatedTableName)) {
                continue;
            }

            $primaryKey = $this->primaryKeyFieldName;
            $callback = function($row) use ($primaryKey) {
                return ArrayUtils::get($row, $primaryKey, null);
            };

            $ids = array_unique(array_filter(array_map($callback, $entries)));
            if (empty($ids)) {
                continue;
            }

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

            // Only select the fields not on the currently authenticated user group's read field blacklist
            $relatedTableColumns = ArrayUtils::get($columns, $alias->getName(), []);
            $visibleColumns = [];
            if (is_array($relatedTableColumns)) {
                $relatedTableColumns = get_array_flat_columns(ArrayUtils::get($columns, $alias->getName()));

                $visibleColumns = array_merge(
                    [$relatedTablePrimaryKey],
                    $relatedTableColumns,
                    array_keys($joinColumns)
                );
            }

            $queryCallBack = function(Builder $query) use ($junctionTableName, $on, $joinColumns, $ids, $joinColumnsPrefix) {
                $query->join($junctionTableName, $on, $joinColumns);

                if (TableSchema::hasTableSortColumn($junctionTableName)) {
                    $sortColumnName = TableSchema::getTableSortColumn($junctionTableName);
                    $query->orderBy($this->getColumnIdentifier($sortColumnName, $junctionTableName), 'ASC');
                }

                return $query;
            };

            $results = $relatedTableGateway->loadEntries(array_merge([
                // Fetch all related data
                'limit' => -1,
                // Add the aliases of the join columns to prevent being removed from array
                // because there aren't part of the "visible" columns list
                'columns' => is_array($visibleColumns) ? $visibleColumns : [],
                'filters' => [
                    new In(
                        $relatedTableGateway->getColumnIdentifier($junctionKeyLeftColumn, $junctionTableName),
                        $ids
                    )
                ],
                'depth' => $depth
            ], $params), $queryCallBack);

            $relationalColumnName = $alias->getName();
            $relatedEntries = [];
            foreach ($results as $row) {
                $relatedEntries[$row[$joinColumnsPrefix . $junctionKeyLeftColumn]][] = $row;
            }

            $uiOptions = $alias->getOptions();
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

                // Sorting junction data by its sorting column or ID column
                // NOTE: All the junction table are fetched all together from all the rows IDs
                // After all junction IDs are attached to an specific parent row, it must sort.
                $junctionTableSchema = $junctionTableGateway->getTableSchema();
                $sortColumnName = $junctionTableSchema->getPrimaryColumn();
                if ($junctionTableSchema->hasSortColumn()) {
                    $sortColumnName = $junctionTableSchema->getSortColumn();
                }

                // NOTE: usort doesn't maintain the array key
                usort($junctionData, sorting_by_key($sortColumnName, 'ASC'));

                // NOTE: Sort the related data by its junction sorting order
                $tempRow = $row;
                $_byId = [];
                foreach ($tempRow as $item) {
                    $_byId[$item[$relatedTablePrimaryKey]] = $item;

                    if ($relatedTableColumns && !ArrayUtils::contains($relatedTableColumns, $relatedTablePrimaryKey)) {
                        ArrayUtils::remove($item, $relatedTablePrimaryKey);
                    }
                }

                $row = [];
                foreach ($junctionData as $item) {
                    $row[] = $_byId[$item[$junctionKeyRightColumn]];
                }

                $junctionData = $junctionTableGateway->wrapData(
                    $junctionData,
                    false,
                    ArrayUtils::get($params, 'meta', 1)
                );

                $row = $relatedTableGateway->wrapData(
                    $row,
                    false,
                    ArrayUtils::get($params, 'meta', 1)
                );
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
     * @param array $params
     *
     * @return array Revised table rows, now including foreign rows
     *
     * @throws Exception\RelationshipMetadataException
     */
    public function loadManyToOneRelationships($entries, $depth = 0, $columns, array $params = [])
    {
        // Identify the ManyToOne columns
        $visibleColumns = $this->getTableSchema()->getColumns(array_keys($columns));
        foreach ($visibleColumns as $column) {
            if (!$column->isManyToOne()) {
                continue;
            }

            $relatedTable = $column->getRelationship()->getRelatedTable();

            // if user doesn't have permission to view the related table
            // fill the data with only the id, which the user has permission to
            if ($this->acl && !TableSchema::canGroupViewTable($relatedTable)) {
                $tableGateway = new RelationalTableGateway($relatedTable, $this->adapter, null);
                $primaryKeyName = $tableGateway->primaryKeyFieldName;

                foreach ($entries as $i => $entry) {
                    $entries[$i][$column->getName()] = [
                        'data' => [
                            $primaryKeyName => $entry[$column->getName()]
                        ]
                    ];
                }

                continue;
            }

            $tableGateway = new RelationalTableGateway($relatedTable, $this->adapter, $this->acl);
            $primaryKeyName = $tableGateway->primaryKeyFieldName;

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
            $yield = function ($row) use ($relationalColumnName, $entries, $primaryKeyName) {
                if (array_key_exists($relationalColumnName, $row)) {
                    $value = $row[$relationalColumnName];
                    if (is_array($value)) {
                        $value = isset($value[$primaryKeyName]) ? $value[$primaryKeyName] : 0;
                    }

                    return $value;
                }
            };

            $ids = array_unique(array_filter(array_map($yield, $entries)));
            if (empty($ids)) {
                continue;
            }

            // Fetch the foreign data
            $results = $tableGateway->loadEntries(array_merge([
                // Fetch all related data
                'limit' => -1,
                'columns' => ArrayUtils::get($columns, $column->getName())
                    ? array_merge([$primaryKeyName], get_array_flat_columns(ArrayUtils::get($columns, $column->getName())))
                    : [],
                'filters' => [
                    $primaryKeyName => ['in' => $ids]
                ],
                'depth' => (int) $depth
            ], $params));

            $relatedEntries = [];
            foreach ($results as $row) {
                $relatedEntries[$row[$primaryKeyName]] = $tableGateway->wrapData(
                    $row,
                    true,
                    ArrayUtils::get($params, 'meta', 1)
                );
            }

            // Replace foreign keys with foreign rows
            foreach ($entries as &$parentRow) {
                if (array_key_exists($relationalColumnName, $parentRow)) {
                    $foreign_id = $parentRow[$relationalColumnName];
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
            $entry = $this->updateRecord($entry);
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

        $statusColumnName = $tableSchema->getStatusColumn();

        $select = new Select($this->getTable());
        $select
            ->columns([$statusColumnName, 'quantity' => new Expression('COUNT(*)')])
            ->group($statusColumnName);

        $sql = new Sql($this->adapter, $this->table);
        $statement = $sql->prepareStatementForSqlObject($select);
        $results = $statement->execute();

        $statusMap = TableSchema::getStatusMap($this->getTable());
        $stats = [];
        foreach ($results as $row) {
            if (isset($row[$statusColumnName])) {
                foreach ($statusMap as $status) {
                    if ($status['id'] == $row[$statusColumnName]) {
                        $statSlug = $statusMap[$row[$statusColumnName]];
                        $stats[$statSlug['name']] = (int) $row['quantity'];
                    }
                }
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
}
