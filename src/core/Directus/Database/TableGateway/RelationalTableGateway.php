<?php

namespace Directus\Database\TableGateway;

use Directus\Database\Exception;
use Directus\Database\Filters\Filter;
use Directus\Database\Schema\DataTypes;
use Directus\Database\Schema\Object\Field;
use Directus\Database\Schema\Object\Collection;
use Directus\Database\Query\Builder;
use Directus\Database\RowGateway\BaseRowGateway;
use Directus\Database\Schema\SchemaManager;
use Directus\Database\SchemaService;
use Directus\Exception\ErrorException;
use Directus\Exception\UnprocessableEntityException;
use Directus\Permissions\Exception\ForbiddenCollectionReadException;
use Directus\Exception\ErrorCodes;
use Directus\Permissions\Exception\PermissionException;
use Directus\Permissions\Exception\UnableFindOwnerItemsException;
use Directus\Util\ArrayUtils;
use Directus\Util\DateTimeUtils;
use Directus\Util\StringUtils;
use Zend\Db\Sql\Expression;
use Zend\Db\Sql\Predicate\In;
use Zend\Db\Sql\Predicate\PredicateInterface;
use Zend\Db\Sql\Select;
use Zend\Db\Sql\Sql;
use Zend\Db\Sql\Where;

class RelationalTableGateway extends BaseTableGateway
{
    const ACTIVITY_ENTRY_MODE_DISABLED = 0;
    const ACTIVITY_ENTRY_MODE_PARENT = 1;
    const ACTIVITY_ENTRY_MODE_CHILD = 2;

    protected $exceptionMessages = [];
    protected $toManyCallStack = [];

    /**
     * @var array
     */
    protected $defaultEntriesSelectParams = [
        'limit' => 20,
        'offset' => 0,
        'search' => null,
        'meta' => 0,
        'status' => null
    ];

    // TODO: Improve this as list of operators
    // Instead of shorthands, it could be a list of filters that maps to a method
    protected $operatorShorthand = [
        'eq' => ['operator' => 'equal_to', 'not' => false],
        '='  => ['operator' => 'equal_to', 'not' => false],
        'neq' => ['operator' => 'equal_to', 'not' => true],
        '!='  => ['operator' => 'equal_to', 'not' => true],
        '<>'  => ['operator' => 'equal_to', 'not' => true],
        'lt' => ['operator' => 'less_than', 'not' => false],
        '<' => ['operator' => 'less_than', 'not' => false],
        'lte' => ['operator' => 'less_than_or_equal', 'not' => false],
        '<=' => ['operator' => 'less_than_or_equal', 'not' => false],
        'gt' => ['operator' => 'greater_than', 'not' => false],
        '>' => ['operator' => 'greater_than', 'not' => false],
        'gte' => ['operator' => 'greater_than_or_equal', 'not' => false],
        '>=' => ['operator' => 'greater_than_or_equal', 'not' => false],
        'in' => ['operator' => 'in', 'not' => false],
        'nin' => ['operator' => 'in', 'not' => true],

        'nlike' => ['operator' => 'like', 'not' => true],
        'contains' => ['operator' => 'like'],
        'ncontains' => ['operator' => 'like', 'not' => true],

        'rlike' => ['operator' => 'like'],
        'nrlike' => ['operator' => 'like', 'not' => true],

        'nnull' => ['operator' => 'null', 'not' => true],

        'nempty' => ['operator' => 'empty', 'not' => true],

        'nhas' => ['operator' => 'has', 'not' => true],

        'nbetween' => ['operator' => 'between', 'not' => true],
    ];

    public function deleteRecord($id, array $params = [])
    {
        $conditions = [
            $this->primaryKeyFieldName => $id
        ];

        // TODO: Add "item" hook, different from "table" hook
        $success = $this->delete($conditions);

        if (!$success) {
            throw new ErrorException(
                sprintf('Error deleting a record in %s with id %s', $this->table, $id)
            );
        }

        $this->recordActivity(
            DirectusActivityTableGateway::ACTION_DELETE,
            null,
            $conditions,
            [],
            $params
        );
    }

    /**
     * @param mixed $id
     * @param array $data
     * @param array $params
     *
     * @return BaseRowGateway
     */
    public function revertRecord($id, array $data, array $params = [])
    {
        return $this->updateRecord($id, $data, array_merge($params, ['revert' => true]));
    }

    /**
     * @param string $tableName
     * @param array $recordData
     * @param array $params
     * @param null $childLogEntries
     * @param bool $parentCollectionRelationshipsChanged
     * @param array $parentData
     *
     * @return BaseRowGateway
     */
    public function manageRecordUpdate($tableName, $recordData, array $params = [], &$childLogEntries = null, &$parentCollectionRelationshipsChanged = false, $parentData = [])
    {
        $TableGateway = $this;
        if ($tableName !== $this->getTable()) {
            $TableGateway = new RelationalTableGateway($tableName, $this->adapter, $this->acl);
        }

        $activityEntryMode = ArrayUtils::get($params, 'activity_mode', static::ACTIVITY_ENTRY_MODE_PARENT);
        $recordIsNew = !array_key_exists($TableGateway->primaryKeyFieldName, $recordData);

        $tableSchema = SchemaService::getCollection($tableName);

        $currentUserId = $this->acl ? $this->acl->getUserId() : null;
        $isAdmin = $this->acl ? $this->acl->isAdmin() : false;

        // Do not let non-admins make admins
        // TODO: Move to hooks
        if ($tableName == 'directus_users' && !$isAdmin) {
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
            $column = $tableSchema->getField($key);

            // NOTE: Each interface or the API should handle the `alias` type
            //Ignore all the alias fields except file interface > data
            if ($column && (($column->isAlias() && $this->getTable() !== SchemaManager::COLLECTION_FILES)) || $column->isOneToMany()) {
                continue;
            }

            $parentRecordWithoutAlias[$key] = $data;
        }

        // NOTE: set the primary key to null
        // to default the value to whatever increment value is next
        // avoiding the error of inserting nothing
        if (empty($parentRecordWithoutAlias)) {
            $parentRecordWithoutAlias[$tableSchema->getPrimaryKeyName()] = null;
        }

        // If more than the record ID is present.
        $newRecordObject = null;
        $parentRecordChanged = $this->recordDataContainsNonPrimaryKeyData($recordData);

        if ($parentRecordChanged || $recordIsNew) {
            // Update the parent row, w/ any new association fields replaced by their IDs
            $newRecordObject = $TableGateway->addOrUpdateRecordByArray($parentRecordWithoutAlias);
            if (!$newRecordObject) {
                return [];
            }

            $newRecordObject = $newRecordObject->toArray();
        }

        // Do it this way, because & byref for outcome of ternary operator spells trouble
        $draftRecord = &$parentRecordWithoutAlias;
        if ($recordIsNew) {
            $draftRecord = &$newRecordObject;
        }

        // Restore X2M relationship / alias fields to the record representation & process these relationships.
        $collectionColumns = $tableSchema->getAliasFields();
        foreach ($collectionColumns as $collectionColumn) {
            $colName = $collectionColumn->getName();
            if (isset($recordData[$colName])) {
                $draftRecord[$colName] = $recordData[$colName];
            }
        }

        // parent
        if ($activityEntryMode === self::ACTIVITY_ENTRY_MODE_PARENT) {
            $parentData = [
                'item' => array_key_exists($this->primaryKeyFieldName, $recordData) ? $recordData[$this->primaryKeyFieldName] : null,
                'collection' => $tableName
            ];
        }

        $draftRecord = $TableGateway->addOrUpdateToManyRelationships($tableSchema, $draftRecord, $nestedLogEntries, $nestedCollectionRelationshipsChanged, $parentData);
        $rowId = $draftRecord[$this->primaryKeyFieldName];

        $columnNames = SchemaService::getAllNonAliasCollectionFieldNames($tableName);
        // TODO: Do not run user-specific hooks
        $TemporaryTableGateway = new self($tableName, $this->adapter, null, null, null, null, $this->primaryKeyFieldName);
        $fullRecordData = $TemporaryTableGateway->select(function (Select $select) use ($rowId, $columnNames) {
            $select->where->equalTo($this->primaryKeyFieldName, $rowId);
            $select->limit(1)->columns($columnNames);
        })->current()->toArray();

        if ($recordIsNew) {
            $deltaRecordData = $parentRecordWithoutAlias;
        } else {
            $deltaRecordData = array_intersect_key(
                ArrayUtils::omit((array) $parentRecordWithoutAlias, $this->primaryKeyFieldName),
                $fullRecordData
            );
        }

        $statusField = $tableSchema->getStatusField();
        if ($recordIsNew) {
            $logEntryAction = DirectusActivityTableGateway::ACTION_CREATE;
        } else if (ArrayUtils::get($params, 'revert') === true) {
            $logEntryAction = DirectusActivityTableGateway::ACTION_REVERT;
        } else {
            $logEntryAction = DirectusActivityTableGateway::ACTION_UPDATE;

            try {
                if (
                    $statusField
                    && ArrayUtils::has($deltaRecordData, $statusField->getName())
                    && in_array(
                        ArrayUtils::get($deltaRecordData, $tableSchema->getStatusField()->getName()),
                        $this->getStatusMapping()->getSoftDeleteStatusesValue()
                    )
                ) {
                    $logEntryAction = DirectusActivityTableGateway::ACTION_SOFT_DELETE;
                }
            } catch (\Exception $e) {
                // the field doesn't have a status mapping
            }
        }

        if ($this->getTable() != SchemaManager::COLLECTION_ACTIVITY) {
            switch ($activityEntryMode) {
                    // Activity logging is enabled, and I am a nested action
                case self::ACTIVITY_ENTRY_MODE_CHILD:
                    $childLogEntries[] = [
                        'action' => DirectusActivityTableGateway::makeLogActionFromTableName(
                            $this->table,
                            $logEntryAction
                        ),
                        'action_by' => $currentUserId,
                        'action_on' => DateTimeUtils::nowInUTC()->toString(),
                        'ip' => \Directus\get_request_host(),
                        'user_agent' => isset($_SERVER['HTTP_USER_AGENT']) ? $_SERVER['HTTP_USER_AGENT'] : '',
                        'collection' => $tableName,
                        'parent_item' => isset($parentData['item']) ? $parentData['item'] : null,
                        'parent_collection' => isset($parentData['collection']) ? $parentData['collection'] : null,
                        'data' => json_encode($fullRecordData),
                        'delta' => !empty($deltaRecordData) ? json_encode($deltaRecordData) : null,
                        'parent_changed' => boolval($parentRecordChanged),
                        'item' => $rowId,
                        'comment' => null
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
                    // Produce log if something changed.
                    if ($parentRecordChanged || $nestedCollectionRelationshipsChanged) {
                        // Save parent log entry
                        $parentLogEntry = BaseRowGateway::makeRowGatewayFromTableName('id', 'directus_activity', $this->adapter);
                        $logData = [
                            'action' => DirectusActivityTableGateway::makeLogActionFromTableName(
                                $this->table,
                                $logEntryAction
                            ),
                            'action_by' => $currentUserId,
                            'action_on' => DateTimeUtils::nowInUTC()->toString(),
                            'ip' => \Directus\get_request_host(),
                            'user_agent' => isset($_SERVER['HTTP_USER_AGENT']) ? $_SERVER['HTTP_USER_AGENT'] : '',
                            'collection' => $tableName,
                            'item' => $rowId,
                            'comment' => ArrayUtils::get($params, 'activity_comment')
                        ];
                        $parentLogEntry->populate($logData, false);
                        $parentLogEntry->save();

                        // Add Revisions
                        $revisionTableGateway = new RelationalTableGateway(SchemaManager::COLLECTION_REVISIONS, $this->adapter);
                        $revisionTableGateway->insert([
                            'activity' => $parentLogEntry->getId(),
                            'collection' => $tableName,
                            'item' => $rowId,
                            'data' => json_encode($fullRecordData),
                            'delta' => !empty($deltaRecordData) ? json_encode($deltaRecordData) : null,
                            'parent_item' => null,
                            'parent_collection' => null,
                            'parent_changed' => null, //boolval($parentRecordChanged)
                        ]);

                        // Update & insert nested activity entries
                        $ActivityGateway = new DirectusActivityTableGateway($this->adapter);
                        foreach ($nestedLogEntries as $entry) {
                            // TODO: ought to insert these in one batch
                            $ActivityGateway->insert(ArrayUtils::omit($entry, [
                                'parent_item',
                                'parent_collection',
                                'data',
                                'delta',
                                'parent_changed',
                            ]));
                            $revisionTableGateway->insert([
                                'activity' => $ActivityGateway->lastInsertValue,
                                'collection' => ArrayUtils::get($entry, 'collection'),
                                'item' => ArrayUtils::get($entry, 'item'),
                                'data' => ArrayUtils::get($entry, 'data'),
                                'delta' => ArrayUtils::get($entry, 'delta'),
                                'parent_item' => ArrayUtils::get($entry, 'parent_item'),
                                'parent_collection' => ArrayUtils::get($entry, 'parent_collection'),
                                'parent_changed' => ArrayUtils::get($entry, 'parent_changed')
                            ]);
                        }
                    }
                    break;
            }
        }

        // Yield record object
        $recordGateway = new BaseRowGateway($TableGateway->primaryKeyFieldName, $tableName, $this->adapter, $this->acl);
        $recordGateway->populate($this->parseRecord($fullRecordData), true);

        return $recordGateway;
    }

    /**
     * @param array $recordData
     * @param array $params
     *
     * @return BaseRowGateway
     */
    public function createRecord($recordData, array $params = [])
    {
        $tableGateway = $this;
        $tableSchema = SchemaService::getCollection($this->getTable());

        // Recursive functions will change this value (by reference) as necessary
        $nestedCollectionRelationshipsChanged = false;
        $nestedLogEntries = [];

        // Update and/or Add Many-to-One Associations
        $recordData = $tableGateway->addOrUpdateManyToOneRelationships($tableSchema, $recordData, $nestedLogEntries, $nestedCollectionRelationshipsChanged);

        $parentRecordWithoutAlias = [];
        foreach ($recordData as $key => $data) {
            $column = $tableSchema->getField($key);

            // NOTE: Each interface or the API should handle the `alias` type
            //Ignore all the alias fields except file interface > data
            if ($column && (($column->isAlias() && $this->getTable() !== SchemaManager::COLLECTION_FILES)) || ($column && $column->isOneToMany())) {
                continue;
            }

            $parentRecordWithoutAlias[$key] = $data;
        }

        $newRecordObject = $tableGateway->addRecordByArray($parentRecordWithoutAlias);

        $newRecordObject = $newRecordObject->toArray();

        // Do it this way, because & byref for outcome of ternary operator spells trouble
        $draftRecord = $newRecordObject;

        // Restore X2M relationship / alias fields to the record representation & process these relationships.
        $collectionColumns = $tableSchema->getAliasFields();
        foreach ($collectionColumns as $collectionColumn) {
            $colName = $collectionColumn->getName();
            if (isset($recordData[$colName])) {
                $draftRecord[$colName] = $recordData[$colName];
            }
        }

        $parentData = [
            'item' => null,
            'collection' => $this->getTable()
        ];

        $draftRecord = $tableGateway->addOrUpdateToManyRelationships(
            $tableSchema,
            $draftRecord,
            $nestedLogEntries,
            $nestedCollectionRelationshipsChanged,
            $parentData
        );

        $this->recordActivity(
            DirectusActivityTableGateway::ACTION_CREATE,
            $parentRecordWithoutAlias,
            $newRecordObject,
            $nestedLogEntries,
            $params
        );

        // Yield record object
        $recordGateway = new BaseRowGateway(
            $tableGateway->primaryKeyFieldName,
            $this->getTable(),
            $this->adapter,
            $this->acl
        );
        $recordGateway->populate($this->parseRecord($draftRecord), true);

        return $recordGateway;
    }

    /**
     * @param mixed $id
     * @param array $recordData
     * @param array $params
     *
     * @return BaseRowGateway
     */
    public function updateRecord($id, array $recordData, array $params = [])
    {
        $TableGateway = $this;
        $tableSchema = SchemaService::getCollection($this->table);
        // Recursive functions will change this value (by reference) as necessary
        $nestedCollectionRelationshipsChanged = false;
        // Recursive functions will append to this array by reference
        $nestedLogEntries = [];

        // Update and/or Add Many-to-One Associations
        $recordData = $TableGateway->addOrUpdateManyToOneRelationships($tableSchema, $recordData, $nestedLogEntries, $nestedCollectionRelationshipsChanged);

        $parentRecordWithoutAlias = [];
        foreach ($recordData as $key => $data) {
            $column = $tableSchema->getField($key);

            // NOTE: Each interface or the API should handle the `alias` type
            if ($column && $column->isOneToMany()) {
                continue;
            }

            $parentRecordWithoutAlias[$key] = $data;
        }

        $parentRecordWithoutAlias[$this->primaryKeyFieldName] = $id;

        // If more than the record ID is present.
        $newRecordObject = null;
        $parentRecordChanged = $this->recordDataContainsNonPrimaryKeyData($recordData);

        if ($parentRecordChanged) {
            // Update the parent row, w/ any new association fields replaced by their IDs
            $newRecordObject = $TableGateway->updateRecordByArray($parentRecordWithoutAlias)->toArray();
        }

        // Do it this way, because & byref for outcome of ternary operator spells trouble
        $draftRecord = &$parentRecordWithoutAlias;

        // Restore X2M relationship / alias fields to the record representation & process these relationships.
        $collectionColumns = $tableSchema->getAliasFields();
        foreach ($collectionColumns as $collectionColumn) {
            $colName = $collectionColumn->getName();
            if (isset($recordData[$colName])) {
                $draftRecord[$colName] = $recordData[$colName];
            }
        }

        // parent
        $parentData = [
            'item' => $id,
            'collection' => $this->table
        ];

        $draftRecord = $TableGateway->addOrUpdateToManyRelationships($tableSchema, $draftRecord, $nestedLogEntries, $nestedCollectionRelationshipsChanged, $parentData);
        $deltaRecordData = array_intersect_key(
            ArrayUtils::omit((array) $parentRecordWithoutAlias, $this->primaryKeyFieldName),
            $newRecordObject
        );

        $statusField = $tableSchema->getStatusField();
        $logEntryAction = ArrayUtils::get($params, 'revert') === true
            ? DirectusActivityTableGateway::ACTION_REVERT
            : DirectusActivityTableGateway::ACTION_UPDATE;

        if ($statusField && $logEntryAction === DirectusActivityTableGateway::ACTION_UPDATE) {
            try {
                if (
                    ArrayUtils::has($deltaRecordData, $statusField->getName())
                    && in_array(
                        ArrayUtils::get($deltaRecordData, $tableSchema->getStatusField()->getName()),
                        $this->getStatusMapping()->getSoftDeleteStatusesValue()
                    )
                ) {
                    $logEntryAction = DirectusActivityTableGateway::ACTION_SOFT_DELETE;
                }
            } catch (\Exception $e) {
                // the field doesn't have a status mapping
            }
        }

        $this->recordActivity(
            $logEntryAction,
            $parentRecordWithoutAlias,
            $newRecordObject,
            $nestedLogEntries,
            $params
        );

        // Yield record object
        $recordGateway = new BaseRowGateway($TableGateway->primaryKeyFieldName, $this->table, $this->adapter, $this->acl);
        $recordGateway->populate($this->parseRecord($newRecordObject), true);

        return $recordGateway;
    }

    /**
     * @param Collection $schema The table schema array.
     * @param array $parentRow The parent record being updated.
     * @return  array
     */
    public function addOrUpdateManyToOneRelationships($schema, $parentRow, &$childLogEntries = null, &$parentCollectionRelationshipsChanged = false)
    {
        // Create foreign row and update local column with the data id
        foreach ($schema->getFields() as $field) {
            $fieldName = $field->getName();

            if (!$field->isManyToOne()) {
                continue;
            }

            // Ignore absent values & non-arrays
            if (!isset($parentRow[$fieldName]) || !is_array($parentRow[$fieldName])) {
                continue;
            }

            // Ignore non-arrays and empty collections
            if (empty($parentRow[$fieldName])) {
                // Once they're managed, remove the foreign collections from the record array
                unset($parentRow[$fieldName]);
                continue;
            }

            $foreignDataSet = $parentRow[$fieldName];
            $foreignRow = $foreignDataSet;
            $foreignTableName = $field->getRelationship()->getCollectionOne();
            $foreignTableSchema = $this->getTableSchema($foreignTableName);
            $primaryKey = $foreignTableSchema->getPrimaryKeyName();
            $ForeignTable = new RelationalTableGateway($foreignTableName, $this->adapter, $this->acl);

            // TODO : Need to redevelop this logic.
            if ($field->getType() == "file" && isset($parentRow[$fieldName][$primaryKey])) {
                $parentRow[$fieldName] = $parentRow[$fieldName][$primaryKey];
            }

            if ($primaryKey && ArrayUtils::get($foreignRow, $this->deleteFlag) === true) {
                $Where = new Where();
                $Where->equalTo($primaryKey, $foreignRow[$primaryKey]);
                $ForeignTable->delete($Where);

                $parentRow[$fieldName] = $field->isNullable() ? null : 0;

                continue;
            }

            // TODO: Remove the hardcode consition of file
            if ($this->recordDataContainsNonPrimaryKeyData($foreignRow, $foreignTableSchema->getPrimaryKeyName()) && $field->getType() != "file") {
                // NOTE: using manageRecordUpdate instead of addOrUpdateRecordByArray to update related data
                $foreignRow = $ForeignTable->manageRecordUpdate($foreignTableName, $foreignRow);
            }

            $parentRow[$fieldName] = $foreignRow[$primaryKey];
        }

        return $parentRow;
    }

    /**
     * @param Collection $schema The table schema array.
     * @param array $parentRow The parent record being updated.
     * @return  array
     */
    public function addOrUpdateToManyRelationships($schema, $parentRow, &$childLogEntries = null, &$parentCollectionRelationshipsChanged = false, $parentData = [])
    {
        // Create foreign row and update local column with the data id
        foreach ($schema->getFields() as $field) {
            $fieldName = $field->getName();

            if (!$field->hasRelationship()) {
                continue;
            }

            // Ignore absent values & non-arrays
            if (!isset($parentRow[$fieldName]) || !is_array($parentRow[$fieldName])) {
                continue;
            }

            $relationship = $field->getRelationship();
            if (!$relationship->isOneToMany()) {
                continue;
            }

            // Ignore non-arrays and empty collections
            if (empty($parentRow[$fieldName])) {
                // Once they're managed, remove the foreign collections from the record array
                unset($parentRow[$fieldName]);
                continue;
            }

            $foreignDataSet = $parentRow[$fieldName];
            $this->enforceColumnHasNonNullValues($relationship->toArray(), ['collection_one', 'field_many'], $this->table);
            $foreignTableName = $relationship->getCollectionMany();
            $foreignJoinColumn = $relationship->getFieldMany();

            // we need to store all the deleted items ids
            // so we can use it to compare against items that were deleted in previous iterations.
            // if we don't check against already deleted IDs, then the recursion will re-create the deleted item.
            static $hasBeenDeletedIds = [];

            $ForeignTable = new RelationalTableGateway($foreignTableName, $this->adapter, $this->acl);
            foreach ($foreignDataSet as &$foreignRecord) {
                if (empty($foreignRecord)) {
                    continue;
                }

                // TODO: Fix a bug when fetching a single column
                // before fetching all columns from a table
                // due to our basic "cache" implementation on schema layer
                $hasPrimaryKey = isset($foreignRecord[$ForeignTable->primaryKeyFieldName]);

                // check if this foreignRecord was already deleted from a previous recursive iterations.
                $foreignTableHasBeenDeletedIds = \Directus\array_get($hasBeenDeletedIds, $ForeignTable->getTable());
                if ($hasPrimaryKey && !empty($foreignTableHasBeenDeletedIds)) {
                    $id = $foreignRecord[$ForeignTable->primaryKeyFieldName];

                    // skip if already deleted
                    // otherwise, it will re-create the deleted item/record
                    if (in_array($id, $foreignTableHasBeenDeletedIds))
                        continue;
                }

                if ($hasPrimaryKey && ArrayUtils::get($foreignRecord, $this->deleteFlag) === true) {
                    $Where = new Where();
                    $Where->equalTo($ForeignTable->primaryKeyFieldName, $foreignRecord[$ForeignTable->primaryKeyFieldName]);
                    $ForeignTable->delete($Where);

                    $hasBeenDeletedIds[$ForeignTable->getTable()][] = $foreignRecord[$ForeignTable->primaryKeyFieldName];

                    continue;
                }

                // only add parent id's to items that are lacking the parent column
                if (!array_key_exists($foreignJoinColumn, $foreignRecord)) {
                    $foreignRecord[$foreignJoinColumn] = $parentRow[$this->primaryKeyFieldName];
                }


                $foreignRecord = $ForeignTable->manageRecordUpdate(
                    $foreignTableName,
                    $foreignRecord,
                    ['activity_mode' => self::ACTIVITY_ENTRY_MODE_CHILD],
                    $childLogEntries,
                    $parentCollectionRelationshipsChanged,
                    $parentData
                );
            }

            // Once they're managed, remove the foreign collections from the record array
            unset($parentRow[$fieldName]);
        }

        return $parentRow;
    }

    public function applyDefaultEntriesSelectParams(array $params)
    {
        // NOTE: Performance spot
        // TODO: Split this, into default and process params
        $defaultParams = $this->defaultEntriesSelectParams;
        $defaultLimit = $this->getSettings('default_limit');

        // Set default rows limit from db settings
        if ($defaultLimit) {
            $defaultParams['limit'] = (int) $defaultLimit;
        }

        // Fetch only one if single param is set
        if (ArrayUtils::get($params, 'single')) {
            $params['limit'] = 1;
        }

        // NOTE: Let's use "columns" instead of "fields" internally for the moment
        if (ArrayUtils::has($params, 'fields')) {
            $params['fields'] = ArrayUtils::get($params, 'fields');
            // ArrayUtils::remove($params, 'fields');
        }

        $tableSchema = $this->getTableSchema();
        $sortingField = $tableSchema->getSortingField();
        $defaultParams['sort'] = $sortingField ? $sortingField->getName() : $this->primaryKeyFieldName;

        // Is not there a sort column?
        $tableColumns = array_flip(SchemaService::getCollectionFields($this->table, null, true));
        if (!$this->primaryKeyFieldName || !array_key_exists($this->primaryKeyFieldName, $tableColumns)) {
            unset($defaultParams['sort']);
        }

        $status = ArrayUtils::pull($params, 'status');
        $statusList = $status ? StringUtils::safeCvs($status) : [];
        $allStatus = in_array('*', $statusList);

        if (!$this->getTableSchema()->hasStatusField() || $allStatus) {
            $statusList = null;
        } else if (empty($statusList)) {
            $statusList = $this->getNonSoftDeleteStatuses();
        }

        if ($statusList) {
            $params['status'] = $statusList;
        }

        // If page is defined as param then add offset dynamically.
        if (!isset($params['offset']) && isset($params['page']) && isset($params['limit'])) {
            $params['offset'] = $params['limit'] * ($params['page'] - 1);
        }

        $params = array_merge($defaultParams, $params);

        if (ArrayUtils::get($params, 'sort')) {
            $params['sort'] = StringUtils::csv($params['sort']);
        }

        // convert csv columns into array
        $columns = \Directus\convert_param_columns(ArrayUtils::get($params, 'fields', []));

        // Add columns to params if it's not empty.
        // otherwise remove from params
        if (!empty($columns)) {
            $params['fields'] = $columns;
        } else {
            ArrayUtils::remove($params, 'fields');
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
     *
     * @return Builder
     */
    public function applyParamsToTableEntriesSelect(array $params, Builder $builder)
    {
        // ----------------------------------------------------------------------------
        // STATUS VALUES
        // ----------------------------------------------------------------------------
        if ($this->acl) {
            $statusField = $this->getTableSchema()->getStatusField();
            $permissionStatuses = $this->acl->getCollectionStatusesReadPermission($this->getTable());
            if ($statusField && is_array($permissionStatuses)) {
                $paramStatuses = ArrayUtils::get($params, 'status');
                if (is_array($paramStatuses)) {
                    $permissionStatuses = ArrayUtils::intersection(
                        $permissionStatuses,
                        $paramStatuses
                    );
                }

                $params['status'] = $permissionStatuses;
            }
        }

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
     * Get table items
     *
     * @param array $params
     *
     * @return array|mixed
     */
    public function getItems(array $params = [])
    {
        ArrayUtils::remove($params, 'id');

        // Check if single param is set then convert it into boolean
        if (ArrayUtils::get($params, 'single')) {
            $params['single'] = json_decode(strtolower(ArrayUtils::get($params, 'single')));
        }

        return $this->fetchData($params);
    }

    /**
     * Gets multiple item with the given ids
     *
     * @param string|int|array $ids
     * @param array $params
     *
     * @return array
     */
    public function getItemsByIds($ids, array $params = [])
    {
        return $this->fetchData(array_merge($params, [
            'id' => StringUtils::safeCvs($ids, false, false)
        ]));
    }

    /**
     * Gets one item with the given id
     *
     * @param int|string $id
     * @param array $params
     *
     * @return array
     */
    public function getOne($id, array $params = [])
    {
        return $this->fetchData(array_merge($params, [
            'single' => true,
            'id' => $id
        ]));
    }

    public function getOneData($id, array $params = [])
    {
        return $this->fetchItems(array_merge($params, [
            'single' => true,
            'id' => $id
        ]));
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
    public function wrapData($data, $single = false, $meta = false)
    {
        $result = [];

        if ($meta) {
            if (!is_array($meta)) {
                $meta = StringUtils::csv($meta);
            }

            $result['meta'] = $this->createMetadata($data, $single, $meta);
        }

        $result['data'] = $data;

        if(!empty($this->exceptionMessages)){
            $result['messages'] = $this->exceptionMessages;
        }

        return $result;
    }

    public function createMetadata($entriesData, $single, $list = [])
    {
        $singleEntry = $single || !ArrayUtils::isNumericKeys($entriesData);
        $metadata = $this->createGlobalMetadata($singleEntry, $list);

        if (!$singleEntry) {
            $metadata = array_merge($metadata, $this->createEntriesMetadata($entriesData, $list));
        }

        return $metadata;
    }

    /**
     * Creates the "global" metadata
     *
     * @param bool $single
     * @param array $list
     *
     * @return array
     */
    public function createGlobalMetadata($single, array $list = [])
    {
        $allKeys = ['collection', 'type'];
        $metadata = [];

        if (empty($list) || in_array('*', $list)) {
            $list = $allKeys;
        }

        if (in_array('collection', $list)) {
            $metadata['collection'] = $this->getTable();
        }

        if (in_array('type', $list)) {
            $metadata['type'] = $single ? 'item' : 'collection';
        }

        return $metadata;
    }

    /**
     * Create entries metadata
     *
     * @param array $entries
     * @param array $list
     *
     * @return array
     */
    public function createEntriesMetadata(array $entries, array $list = [])
    {
        $allKeys = ['result_count', 'total_count', 'filter_count', 'status', 'page'];
        $tableSchema = $this->getTableSchema($this->table);

        $metadata = [];
        $countedData = [];

        if (empty($list) || in_array('*', $list)) {
            $list = $allKeys;
        }

        $countedData['result_count'] = count($entries);
        if (in_array('result_count', $list)) {
            $metadata['result_count'] = count($entries);
        }

        $condition = null;
        if ($this->getTableSchema()->hasStatusField()) {
            $fieldName = $this->getTableSchema()->getStatusField()->getName();
            $condition = new In($fieldName, $this->getNonSoftDeleteStatuses());
        }
        $countedData['total_count'] = $this->countTotal($condition);

        if (in_array('total_count', $list)) {
            $metadata['total_count'] = $this->countTotal($condition);
        }

        if ($tableSchema->hasStatusField() && in_array('status', $list)) {
            $statusCount = $this->countByStatus();
            $metadata['status_count'] = $statusCount;
        }

        if (in_array('filter_count', $list) || in_array('page', $list)) {
            $metadata = $this->createMetadataPagination($metadata, $this::$container->get('request')->getQueryParams(), $countedData);
        }

        return $metadata;
    }

    /**
     * Updates Metadata Object with Pagination
     *
     * @param $metadata - Existing metadata object
     * @param $params - GET Parameters
     *
     * @return array
     */
    public function createMetadataPagination(array $metadata = [], array $params = [], array $countedData = [])
    {
        if (empty($params)) $params = $this::$container->get('request')->getQueryParams();

        $filtered = ArrayUtils::get($params, 'filter') || ArrayUtils::get($params, 'q');

        $limit = intval(ArrayUtils::get($params, 'limit', 0));
        $page = intval(ArrayUtils::get($params, 'page', 1));
        $offset = intval(ArrayUtils::get($params, 'offset', -1));

        $total = intval(ArrayUtils::get($metadata, 'Published') ?: ArrayUtils::get($countedData, 'total_count'));
        $rows = intval(ArrayUtils::get($countedData, 'result_count'));
        $pathname = explode('?', ArrayUtils::get($_SERVER, 'REQUEST_URI'));
        $url = trim(\Directus\get_url(), '/') . reset($pathname);

        $meta_param = explode(',', ArrayUtils::get($params, 'meta', ''));

        if ((in_array('filter_count', $meta_param) || in_array('*', $meta_param))) {
            $metadata['filter_count'] = $countedData['total_count'];
        }

        if ($filtered) {
            $filteredparams = array_merge($params, [
                "depth" => 0,
                "fields" => $this->primaryKeyFieldName,
                "limit" => -1
            ]);

            $entries = $this->fetchItems($filteredparams);
            $total = count($entries);
            if (in_array('filter_count', $meta_param) || in_array('*', $meta_param)) {
                $metadata['filter_count'] = $total;
            }
        }

        $limit = $limit < 1 ? $rows : $limit;
        $pages = $total ? ceil($total / $limit) : 1;
        $page = $page > $pages ? $pages : ($page && $offset >= 0 ? (floor($offset / $limit) + 1) : $page);
        $offset = $offset >= 0 ? $offset : ($page ? (($page - 1) * $limit) : 0);
        $next = $previous = $last = $first = -1;

        if ($pages > 1) {
            $next = ($pages > $page) ? ($offset + $limit) : null;
            $previous = ($offset >= $limit) ? ($offset - $limit) : ($limit * ($pages - 1));
            $first = ($pages < 2 || $limit < 1) ? null : 0;
            $last = ($pages < 2) ? null : (($pages - 1) * $limit);
        }


        if (in_array('page', $meta_param) || in_array('*', $meta_param)) {
            $metadata = array_merge($metadata, [
                "limit" => $limit,
                "offset" => $offset,
                "page" => $page,
                "page_count" => $pages,
                "links" => [
                    "self" => $url,
                    "current" => "{$url}?" . urldecode(http_build_query(array_merge($params, ["page" => $page]))),
                    "next" => $next > 0 && $page < $pages ? ("{$url}?" . urldecode(http_build_query(array_merge($params, ["offset" => $next, "page" => $page + 1])))) : null,
                    "previous" => $previous >= 0 && $page > 1 ? ("{$url}?" . urldecode(http_build_query(array_merge($params, ["offset" => $previous, "page" => $page - 1])))) : null,
                    "first" => $first >= 0 ? ("{$url}?" . urldecode(http_build_query(array_merge($params, ["offset" => $first, "page" => 1])))) : null,
                    "last" => $last > 0 ? ("{$url}?" . urldecode(http_build_query(array_merge($params, ["offset" => $last, "page" => $pages])))) : null
                ]
            ]);
        }

        return $metadata;
    }

    /**
     * Load Table entries
     *
     * @param array $params
     * @param \Closure|null $queryCallback
     *
     * @return array
     *
     * @throws Exception\ItemNotFoundException
     * @throws ForbiddenCollectionReadException
     */
    public function fetchItems(array $params = [], \Closure $queryCallback = null)
    {
        $collectionObject = $this->getTableSchema();

        $params = $this->applyDefaultEntriesSelectParams($params);
        $fields = ArrayUtils::get($params, 'fields');


        // TODO: Check for all collections + fields permission/existence before querying
        // TODO: Create a new TableGateway Query Builder based on Query\Builder
        $builder = new Builder($this->getAdapter());
        $builder->from($this->getTable());

        $selectedFields = $this->getSelectedNonAliasFields($fields ?: ['*']);

        if (!in_array($collectionObject->getPrimaryKeyName(), $selectedFields)) {
            array_unshift($selectedFields, $collectionObject->getPrimaryKeyName());
        }

        $statusField = $collectionObject->getStatusField();
        if ($statusField && !in_array($statusField->getName(), $selectedFields) && $this->acl->getCollectionStatuses($this->table)) {
            array_unshift($selectedFields, $statusField->getName());
        }

        if ($this->table == SchemaManager::COLLECTION_FILES) {
            // NOTE: Make sure to have the `type` field for files to determine if the supports thumbnails
            if (!in_array('type', $selectedFields)) {
                $selectedFields[] = 'type';
            }
            // NOTE: Make sure to have the `private_hash` field for files to display in URLs
            if (!in_array('private_hash', $selectedFields)) {
                $selectedFields[] = 'private_hash';
            }
        }

        $builder->columns($selectedFields);

        $builder = $this->applyParamsToTableEntriesSelect(
            $params,
            $builder
        );

        $builder->orderBy($this->primaryKeyFieldName);

        try {
            $this->enforceReadPermission($builder);

            //If collection is directus_fields, also check permission of actual collection of which fields are retrieving
            if ($this->getTable() == SchemaManager::COLLECTION_FIELDS && ArrayUtils::has($params['filter'], 'collection'))
                $this->acl->enforceReadOnce(ArrayUtils::get($params['filter'], 'collection'));
        } catch (PermissionException $e) {
            $isForbiddenRead = $e instanceof ForbiddenCollectionReadException;
            $isUnableFindItems = $e instanceof UnableFindOwnerItemsException;

            if (!$isForbiddenRead && !$isUnableFindItems) {
                throw $e;
            }

            if (ArrayUtils::has($params, 'single')) {
                throw new Exception\ItemNotFoundException();
            } else if ($isForbiddenRead) {
                throw $e;
            } else if ($isUnableFindItems) {
                return [];
            }
        }

        // Validate the fields after verifies the user actually has read permission
        if (is_array($fields)) {
            $this->validateFields($fields);
        }

        if ($queryCallback !== null) {
            $builder = $queryCallback($builder);
        }

        // Run the builder Select with this tablegateway
        // to run all the hooks against the result
        $results = $this->selectWith($builder->buildSelect())->toArray();

        if (!$results && ArrayUtils::has($params, 'single')) {
            $message = null;
            if (ArrayUtils::has($params, 'id')) {
                $message = sprintf('Item with id "%s" not found', $params['id']);
            }

            throw new Exception\ItemNotFoundException($message);
        }

        // ==========================================================================
        // Perform data casting based on the column types in our schema array
        // and Convert dates into ISO 8601 Format
        // TODO: Casting value are going to be done using hooks to the Directus types
        //       With the exception of number for MySQL, which the default client
        //       Returns them as string
        // ==========================================================================
        $results = $this->parseRecord($results);

        $columnsDepth = ArrayUtils::deepLevel(\Directus\get_unflat_columns($fields));
        if ($columnsDepth > 0) {
            $relatedFields = $this->getSelectedRelatedFields($fields);

            $relationalParams = [
                'meta' => ArrayUtils::get($params, 'meta'),
                'lang' => ArrayUtils::get($params, 'lang')
            ];

            $resultArray = $this->loadRelationalData(
                $results,
                \Directus\get_array_flat_columns($relatedFields),
                $relationalParams
            );

            if (!empty($resultArray)) {
                $results = $resultArray;
            }
        }

        if ($statusField && $this->acl != null && $this->acl->getCollectionStatuses($this->table)) {
            foreach ($results as $index => &$item) {
                $statusId = ArrayUtils::get($item, $statusField->getName());
                $blacklist = $this->acl->getReadFieldBlacklist($this->table, $statusId);

                $item = ArrayUtils::omit($item, $blacklist);

                if (empty($item)) {
                    unset($results[$index]);
                }
            }
            $results = array_values($results);
        }

        // When the params column list doesn't include the primary key
        // it should be included because each row gateway expects the primary key
        // after all the row gateway are created and initiated it only returns the chosen columns
        if ($fields && !array_key_exists('*', \Directus\get_unflat_columns($fields))) {
            $visibleColumns = $this->getSelectedFields($fields);
            $results = array_map(function ($entry) use ($visibleColumns) {
                foreach ($entry as $key => $value) {
                    if (!in_array($key, $visibleColumns)) {
                        $entry = ArrayUtils::omit($entry, $key);
                    }
                }

                return $entry;
            }, $results);

            //Removes item from result if it is empty
            foreach($results as $index => &$item)
            {
                if (empty($item)) {
                    unset($results[$index]);
                }
            }
            $results = array_values($results);
        }

        if (ArrayUtils::get($params, 'single')) {
            $results = reset($results);
        }
        return $results ? $results : [];
    }

    /**
     * Fetches items without being wrap into a data attribute
     *
     * @param array $params
     *
     * @return array
     */
    protected function fetchData(array $params = [])
    {
        $meta = ArrayUtils::get($params, 'meta', false);
        $id = ArrayUtils::get($params, 'id');
        $single = ArrayUtils::get($params, 'single');
        $idsCount = is_array($id) ? count($id) : 1;

        if (!$single && $id !== null && $idsCount == 1) {
            $single = $params['single'] = true;
        }

        $items = $this->fetchItems($params);

        return $this->wrapData($items, $single, $meta);
    }

    /**
     * Loads all relational data by depth level
     *
     * @param $result
     * @param array|null $columns
     * @param array $params
     *
     * @return array
     */
    protected function loadRelationalData($result, array $columns = [], array $params = [])
    {
        $result = $this->loadManyToOneRelationships($result, $columns, $params);
        $result = $this->loadOneToManyRelationships($result, $columns, $params);

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

            $columnList = $filterColumns = explode('.', $column);
            $columnsTable = [
                $this->getTable()
            ];

            $nextColumn = array_shift($columnList);
            $nextTable = $this->getTable();
            $relational = SchemaService::hasRelationship($nextTable, $nextColumn);
            $relationalTables = [];
            while ($relational) {
                $relationalTables[$nextColumn] = $nextTable;
                $nextTable = SchemaService::getRelatedCollectionName($nextTable, $nextColumn);
                $nextColumn = array_shift($columnList);
                if (empty($nextColumn))
                    break;
                // Confirm the user has permission to all chained (dot) fields
                if ($this->acl && !$this->acl->canRead($nextTable)) {
                    throw new Exception\ForbiddenFieldAccessException($nextColumn);
                }

                $relational = SchemaService::hasRelationship($nextTable, $nextColumn);
                $columnsTable[] = $nextTable;
            }

            // if one of the column in the list has not relationship
            // it will break the loop before going over all the columns
            // which we will call this as column not found
            // TODO: Better error message
            if (!empty($columnList)) {
                throw new Exception\FieldNotFoundException($nextColumn);
            }

            // Remove the original filter column with dot-notation
            unset($filters[$column]);

            //Prepare relational data for all the fields
            $columnRelationalData = [];
            foreach ($filterColumns as $filterColumn) {
                if (isset($relationalTables[$filterColumn])) {
                    $collection = $this->getTableSchema($relationalTables[$filterColumn]);
                    $fieldRelation = $collection->getField($filterColumn)->getRelationship();
                    $columnRelationalData[$filterColumn] = [
                        "type" => $fieldRelation->getType(),
                        "collection_many" => $fieldRelation->getCollectionMany(),
                        "field_many" => $fieldRelation->getFieldMany(),
                        "collection_one" => $fieldRelation->getCollectionOne(),
                        "field_one" => $fieldRelation->getFieldOne()
                    ];
                }
            }

            // Reverse all the columns from comments.author.id to id.author.comments
            // To filter from the most deep relationship to their parents
            $columns = explode('.', \Directus\column_identifier_reverse($column));
            $columnsTable = array_reverse($columnsTable, true);

            $mainColumn = array_pop($columns);
            $mainTable = array_pop($columnsTable);

            // the main query column
            // where the filter is going to be applied
            $column = array_shift($columns);
            $table = array_shift($columnsTable);

            $query = new Builder($this->getAdapter());
            $mainTableObject = $this->getTableSchema($table);
            $selectColumn = $mainTableObject->getPrimaryField()->getName();

            //check if column type is alias and relationship is O2M
            $previousRelation = isset($filterColumns[array_search($column, $filterColumns) - 1]) ? $filterColumns[array_search($column, $filterColumns) - 1] : '';
            if ($previousRelation && $columnRelationalData[$previousRelation]['type'] == \Directus\Database\Schema\Object\FieldRelationship::ONE_TO_MANY) {
                $selectColumn = $columnRelationalData[$previousRelation]['field_many'];
            }

            //get last relationship
            if ($mainColumn && !empty($mainColumn) && $columnRelationalData[$mainColumn]['type'] == \Directus\Database\Schema\Object\FieldRelationship::ONE_TO_MANY) {
                $mainColumn = $mainTableObject->getPrimaryField()->getName();
            }
            $query->columns([$selectColumn]);

            $query->from($table);

            $this->doFilter($query, $column, $condition, $table);
            $index = 0;
            foreach ($columns as $key => $column) {
                ++$index;

                $oldQuery = $query;
                $query = new Builder($this->getAdapter());
                $collection = $this->getTableSchema($columnsTable[$key]);
                $field = $collection->getField($column);

                $selectColumn = $collection->getPrimaryField()->getName();
                //check if column type is alias and relationship is O2M
                $previousRelation = isset($filterColumns[array_search($column, $filterColumns) - 1]) ? $filterColumns[array_search($column, $filterColumns) - 1] : '';
                if ($previousRelation && $columnRelationalData[$previousRelation]['type'] == \Directus\Database\Schema\Object\FieldRelationship::ONE_TO_MANY) {
                    $selectColumn = $columnRelationalData[$previousRelation]['field_many'];
                }
                $table = $columnsTable[$key];

                if ($field->isAlias()) {
                    $column = $collection->getPrimaryField()->getName();
                }

                $query->columns([$selectColumn]);
                $query->from($table);
                $query->whereIn($column, $oldQuery);
            }

            $collection = $this->getTableSchema($mainTable);
            $field = $collection->getField($mainColumn);
            $relationship = $field->getRelationship();

            // TODO: Make all this whereIn duplication into a function
            // TODO: Can we make the O2M simpler getting the parent id from itself
            //       right now is creating one unnecessary select
            /*if ($field->isOneToMany()) {
                $mainColumn = $collection->getPrimaryField()->getName();
                $oldQuery = $query;
                $query = new Builder($this->getAdapter());
                $selectColumn = $column = $relationship->getFieldOne();
                $table = $relationship->getCollectionOne();

                $query->columns([$selectColumn]);
                $query->from($table);
                $query->whereIn(
                    $column,
                    $oldQuery
                );
            }*/

            $this->doFilter(
                $mainQuery,
                $mainColumn,
                [
                    'in' => $query,
                    'logical' => isset($condition['logical']) ? $condition['logical'] : 'and'
                ],
                $mainTable
            );
        }

        return $filters;
    }

    protected function doFilter(Builder $query, $column, $condition, $table)
    {
        $fieldName = $this->getColumnFromIdentifier($column);
        $field = $this->getField(
            $fieldName,
            // $table will be the default value to get
            // if the column has not identifier format
            $this->getTableFromIdentifier($column, $table)
        );

        if (!$field) {
            throw new Exception\InvalidFieldException($fieldName, $table);
        }

        $condition = $this->parseCondition($condition);
        $operator = $filter = ArrayUtils::get($condition, 'operator');
        $value = ArrayUtils::get($condition, 'value');
        $not = ArrayUtils::get($condition, 'not');
        $logical = ArrayUtils::get($condition, 'logical');

        if (!$this->isFilterSupported($operator)) {
            throw new Exception\UnknownFilterException($operator);
        }

        // TODO: if there's more, please add a better way to handle all this
        if ($field->isOneToMany()) {
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

        // Ignore operator when value is empty
        if ($this->shouldIgnoreQueryFilter($operator, $value)) {
            return false;
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

        // After "between" and "in" to support multiple values of "now"
        $value = $this->getFieldNowValues($field, $value);
        $value = $this->getLikeValue($operator, $filter, $value);

        $arguments = [$column, $value];

        if (isset($logical)) {
            $arguments[] = null;
            $arguments[] = $logical;
        }

        if (in_array($operator, ['all', 'has'])) {
            if (!$field->isOneToMany()) {
                throw new UnprocessableEntityException(
                    sprintf('Operator "%s" only works for one-to-many fields', $operator)
                );
            }

            if ($operator == 'all' && is_string($value)) {
                $value = array_map(function ($item) {
                    return trim($item);
                }, explode(',', $value));
            } else if ($operator == 'has') {
                $value = (int) $value;
            }

            $primaryKey = $this->getTableSchema($table)->getPrimaryField()->getName();
            $relationship = $field->getRelationship();
            $arguments = [
                $primaryKey,
                $relationship->getCollectionOne(),
                null,
                $relationship->getFieldOne(),
                $value
            ];
        }

        // TODO: Move this into QueryBuilder if possible
        if ($field->isOneToMany()) {
            $relationship = $field->getRelationship();
            $relatedTable = $relationship->getCollectionMany();
            $relatedRightColumn = $relationship->getFieldMany();
            $tableSchema = SchemaService::getCollection($relatedTable);
            $relatedTableColumns = $tableSchema->getFields();

            $query->orWhereRelational($this->primaryKeyFieldName, $relatedTable, null, $relatedRightColumn, function (Builder $query) use ($column, $relatedTable, $value) {
                // orWhereRelational() automatically selects the related column.
                // Without the next statement, 2 columns are returned by the nested query,
                // which leads to an SQL error: Operand should contain 1 column(s)
                $query->columns([]);
                $query->groupBy($this->table . '.' . $this->primaryKeyFieldName);
                $query->having(new Expression("COUNT({$this->table}.{$this->primaryKeyFieldName})"), '>=', $value);
            });
        } else if (in_array($operator, ['like']) && $field->isManyToOne()) {
            $relatedTable = $field->getRelationship()->getCollectionOne();
            $tableSchema = SchemaService::getCollection($relatedTable);
            $relatedTableColumns = $tableSchema->getFields();
            $relatedPrimaryColumnName = $tableSchema->getPrimaryField()->getName();
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
     * Checks whether or not a filter should be ignored based on their operator and value
     *
     * @param string $operator
     * @param mixed $value
     *
     * @return bool
     */
    protected function shouldIgnoreQueryFilter($operator, $value)
    {
        // TODO: Add constant variables to store the filters
        $operators = ['like'];

        return in_array($operator, $operators) && empty($value) && !is_numeric($value);
    }

    /**
     * Process single relation field filter
     *
     * @param Builder $mainQuery
     * @param string $column
     * @param array | string $condition
     *
     * @return
     */
    protected function processRelationalFilter(Builder $mainQuery, $column, $condition)
    {
        $columnList = $filterColumns = explode('.', $column);
        $columnsTable = [
            $this->getTable()
        ];

        $nextColumn = array_shift($columnList);
        $nextTable = $this->getTable();
        $relational = SchemaService::hasRelationship($nextTable, $nextColumn);
        $relationalTables = [];
        while ($relational) {
            $relationalTables[$nextColumn] = $nextTable;
            $nextTable = SchemaService::getRelatedCollectionName($nextTable, $nextColumn);
            $nextColumn = array_shift($columnList);
            if (empty($nextColumn))
                break;
            // Confirm the user has permission to all chained (dot) fields
            if ($this->acl && !$this->acl->canRead($nextTable)) {
                throw new Exception\ForbiddenFieldAccessException($nextColumn);
            }

            $relational = SchemaService::hasRelationship($nextTable, $nextColumn);
            $columnsTable[] = $nextTable;
        }

        // if one of the column in the list has not relationship
        // it will break the loop before going over all the columns
        // which we will call this as column not found
        // TODO: Better error message
        if (!empty($columnList)) {
            throw new Exception\FieldNotFoundException($nextColumn);
        }

        //Prepare relational data for all the fields
        $columnRelationalData = [];
        foreach ($filterColumns as $filterColumn) {
            if (isset($relationalTables[$filterColumn])) {
                $collection = $this->getTableSchema($relationalTables[$filterColumn]);
                $fieldRelation = $collection->getField($filterColumn)->getRelationship();
                $columnRelationalData[$filterColumn] = [
                    "type" => $fieldRelation->getType(),
                    "collection_many" => $fieldRelation->getCollectionMany(),
                    "field_many" => $fieldRelation->getFieldMany(),
                    "collection_one" => $fieldRelation->getCollectionOne(),
                    "field_one" => $fieldRelation->getFieldOne()
                ];
            }
        }

        // Reverse all the columns from comments.author.id to id.author.comments
        // To filter from the most deep relationship to their parents
        $columns = explode('.', \Directus\column_identifier_reverse($column));
        $columnsTable = array_reverse($columnsTable, true);

        $mainColumn = array_pop($columns);
        $mainTable = array_pop($columnsTable);

        // the main query column
        // where the filter is going to be applied
        $column = array_shift($columns);
        $table = array_shift($columnsTable);

        $query = new Builder($this->getAdapter());
        $mainTableObject = $this->getTableSchema($table);
        $selectColumn = $mainTableObject->getPrimaryField()->getName();

        //check if column type is alias and relationship is O2M
        $previousRelation = isset($filterColumns[array_search($column, $filterColumns) - 1]) ? $filterColumns[array_search($column, $filterColumns) - 1] : '';
        if ($previousRelation && $columnRelationalData[$previousRelation]['type'] == \Directus\Database\Schema\Object\FieldRelationship::ONE_TO_MANY) {
            $selectColumn = $columnRelationalData[$previousRelation]['field_many'];
        }

        //get last relationship
        if ($mainColumn && !empty($mainColumn) && $columnRelationalData[$mainColumn]['type'] == \Directus\Database\Schema\Object\FieldRelationship::ONE_TO_MANY) {
            $mainColumn = $mainTableObject->getPrimaryField()->getName();
        }
        $query->columns([$selectColumn]);

        $query->from($table);

        $this->doFilter($query, $column, $condition, $table);
        $index = 0;
        foreach ($columns as $key => $column) {
            ++$index;

            $oldQuery = $query;
            $query = new Builder($this->getAdapter());
            $collection = $this->getTableSchema($columnsTable[$key]);
            $field = $collection->getField($column);

            $selectColumn = $collection->getPrimaryField()->getName();
            //check if column type is alias and relationship is O2M
            $previousRelation = isset($filterColumns[array_search($column, $filterColumns) - 1]) ? $filterColumns[array_search($column, $filterColumns) - 1] : '';
            if ($previousRelation && $columnRelationalData[$previousRelation]['type'] == \Directus\Database\Schema\Object\FieldRelationship::ONE_TO_MANY) {
                $selectColumn = $columnRelationalData[$previousRelation]['field_many'];
            }
            $table = $columnsTable[$key];

            if ($field->isAlias()) {
                $column = $collection->getPrimaryField()->getName();
            }

            $query->columns([$selectColumn]);
            $query->from($table);
            $query->whereIn($column, $oldQuery);
        }

        $collection = $this->getTableSchema($mainTable);
        $field = $collection->getField($mainColumn);
        $relationship = $field->getRelationship();

        // TODO: Make all this whereIn duplication into a function
        // TODO: Can we make the O2M simpler getting the parent id from itself
        //       right now is creating one unnecessary select
        /*if ($field->isOneToMany()) {
            $mainColumn = $collection->getPrimaryField()->getName();
            $oldQuery = $query;
            $query = new Builder($this->getAdapter());
            $selectColumn = $column = $relationship->getFieldOne();
            $table = $relationship->getCollectionOne();

            $query->columns([$selectColumn]);
            $query->from($table);
            $query->whereIn(
                $column,
                $oldQuery
            );
        }*/

        $this->doFilter(
            $mainQuery,
            $mainColumn,
            [
                'in' => $query,
                'logical' => isset($condition['logical']) ? $condition['logical'] : 'and'
            ],
            $mainTable
        );
    }

    /**
     * Process Select Filters (Where conditions)
     *
     * @param Builder $query
     * @param array $filters
     */
    protected function processFilter(Builder $query, array $filters = [])
    {
        $blackListStatuses = [];
        foreach ($filters as $column => $conditions) {
            //Logic for blacklisted fields
            $field = explode('.', $column);
            $field = array_shift($field);
            if ($this->acl) {
                $fieldReadBlackListDetails = $this->acl->getStatusesOnReadFieldBlacklist($this->getTable(), $field);
                if (isset($fieldReadBlackListDetails['isReadBlackList']) && $fieldReadBlackListDetails['isReadBlackList']) {
                    throw new Exception\ForbiddenFieldAccessException($field);
                } else if (isset($fieldReadBlackListDetails['statuses']) && !empty($fieldReadBlackListDetails['statuses'])) {
                    $blackListStatuses = array_merge($blackListStatuses, array_values($fieldReadBlackListDetails['statuses']));
                }
            }

            if (!(!is_string($column) || strpos($column, '.') === false)) {
                //Process relational & non relation field filters sequentially
                //Earlier, all the relation field filters were processing first and then non relation fields, due to that logical operators were not working in mix filters
                //Reference #1149
                $this->processRelationalFilter($query, $column, $conditions);
            } else {
                if ($conditions instanceof Filter) {
                    $column =  $conditions->getIdentifier();
                    $conditions = $conditions->getValue();
                }

                if (!is_array($conditions) || !isset($conditions[0])) {
                    $conditions = [$conditions];
                }

                foreach ($conditions as $condition) {
                    $this->doFilter($query, $column, $condition, $this->getTable());
                }
            }
        }
        //Condition for blacklisted statuses
        if (!empty($blackListStatuses)) {
            $statusCondition = [
                'nin' => array_unique($blackListStatuses)
            ];
            $statusFieldName = SchemaService::getStatusFieldName($this->getTable());
            $this->doFilter($query, $statusFieldName, $statusCondition, $this->getTable());
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
        $columns = SchemaService::getAllCollectionFields($this->getTable());
        $table = $this->getTable();
        $search = $this->getLikeValue('like', 'like', $search);

        $query->nestWhere(function (Builder $query) use ($columns, $search, $table) {
            foreach ($columns as $column) {
                // NOTE: Only search numeric or string type columns
                // Fields without data in directus_fields should fallback to source type
                $isNumeric = $this->getSchemaManager()->isFieldNumericType($column);
                $isString = $this->getSchemaManager()->isFieldStringType($column);

                if (!$isNumeric && !$isString && !$column->isOneToMany()) {
                    continue;
                }

                if ($column->isManyToOne()) {
                    $relationship = $column->getRelationship();
                    $relatedTable = $relationship->getCollectionOne();
                    $tableSchema = SchemaService::getCollection($relatedTable);
                    $relatedTableColumns = $tableSchema->getFields();
                    $relatedPrimaryColumnName = $tableSchema->getPrimaryKeyName();
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
                    $relatedTable = $relationship->getCollectionMany();
                    $relatedRightColumn = $relationship->getFieldMany();
                    $relatedTableColumns = SchemaService::getAllCollectionFields($relatedTable);

                    //Condition for table related to same table with O2M, to avoid right join of same tables
                    if ($relatedTable == $table) {
                        $relatedQuery = new Builder($this->getAdapter());
                        $relatedQuery->columns([$relatedRightColumn]);
                        $relatedQuery->from($relatedTable);

                        foreach ($relatedTableColumns as $relatedColumn) {
                            // NOTE: Only search numeric or string type columns
                            $isNumeric = $this->getSchemaManager()->isFieldNumericType($relatedColumn);
                            $isString = $this->getSchemaManager()->isFieldStringType($relatedColumn);
                            if (!$relatedColumn->isAlias() && ($isNumeric || $isString)) {
                                $relatedQuery->orWhereLike($relatedColumn->getName(), $search, false);
                            }
                        }
                        $query->orWhereIn($this->primaryKeyFieldName, $relatedQuery);
                    } else {
                        $query->from($table);
                        // TODO: Test here it may be not setting the proper primary key name
                        // TODO: Only make this condition if it actually have conditions in the sub query
                        $query->orWhereRelational($this->primaryKeyFieldName, $relatedTable, null, $relatedRightColumn, function (Builder $query) use ($column, $relatedTable, $relatedTableColumns, $search) {
                            foreach ($relatedTableColumns as $relatedColumn) {
                                // NOTE: Only search numeric or string type columns
                                $isNumeric = $this->getSchemaManager()->isFieldNumericType($relatedColumn);
                                $isString = $this->getSchemaManager()->isFieldStringType($relatedColumn);
                                if (!$relatedColumn->isAlias() && ($isNumeric || $isString)) {
                                    $query->orWhereLike($relatedColumn->getName(), $search, false);
                                }
                            }
                        });
                    }
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
     * @param array $columns
     *
     * @throws Exception\InvalidFieldException
     * @throws Exception\UnableSortAliasFieldException
     */
    protected function processSort(Builder $query, array $columns)
    {
        foreach ($columns as $column) {
            $compact = \Directus\compact_sort_to_array($column);
            $orderBy = key($compact);
            $orderDirection = current($compact);

            $field = SchemaService::getField($this->table, $orderBy, false, $this->acl === null);
            if ($orderBy !== '?' && !$field) {
                throw new Exception\InvalidFieldException($column, $this->table);
            }

            if ($field && $field->isAlias()) {
                throw new Exception\UnableSortAliasFieldException($orderBy);
            }

            $query->orderBy($orderBy, $orderDirection, $this->shouldNullSortedLast());
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
     * @throws Exception\FieldNotFoundException
     */
    protected function applyLegacyParams(Builder $query, array $params = [])
    {
        $skipAcl = $this->acl === null;
        if (ArrayUtils::get($params, 'status') && SchemaService::hasStatusField($this->getTable(), $skipAcl)) {
            $statuses = $params['status'];
            if (!is_array($statuses)) {
                $statuses = array_map(function ($item) {
                    return trim($item);
                }, explode(',', $params['status']));
            }

            if ($statuses) {
                $query->whereIn(SchemaService::getStatusFieldName(
                    $this->getTable(),
                    $this->acl === null
                ), $statuses);
            }
        }

        if (ArrayUtils::has($params, 'id')) {
            $entriesIds = $params['id'];

            if (!is_array($entriesIds)) {
                $entriesIds = [$entriesIds];
            }

            //$query->whereIn($this->primaryKeyFieldName, $entriesIds);
            $query->whereIn(new Expression('CAST(`' . $this->getTable() . '`.`' . $this->primaryKeyFieldName . '` as CHAR)'), $entriesIds);
        }

        if (!ArrayUtils::has($params, 'q')) {
            $search = ArrayUtils::get($params, 'search', '');

            if ($search) {
                $columns = SchemaService::getAllNonAliasCollectionFields($this->getTable());
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
     * @param Field[] $columns
     * @param array $params
     *
     * @return array|bool
     *
     * @throws Exception\FieldNotFoundException
     */
    public function loadOneToManyRelationships($entries, $columns, array $params = [])
    {
        $columnsTree = \Directus\get_unflat_columns($columns);
        $visibleColumns = $this->getTableSchema()->getFields(array_keys($columnsTree));

        foreach ($visibleColumns as $alias) {
            if (!$alias->hasRelationship() || !DataTypes::isO2MType($alias->getType())) {
                continue;
            }

            $relatedTableName = $alias->getRelationship()->getCollectionMany();

            if ($this->acl && !$this->acl->canReadOnce($relatedTableName)) {
                $this->exceptionMessages[] = [
                    'type' => 'warning',
                    'message' => "Can't read `" . $relatedTableName . "`: read access to `" . $relatedTableName . "` collection denied",
                    'code' => ErrorCodes::WARNING_ACCESS_DENIED,
                    'fields' => [$alias->getName()],
                ];
                continue;
            }

            $primaryKey = $this->primaryKeyFieldName;
            $callback = function ($row) use ($primaryKey) {
                return ArrayUtils::get($row, $primaryKey, null);
            };

            $ids = array_unique(array_filter(array_map($callback, $entries)));
            if (empty($ids)) {
                continue;
            }

            $filterFields = [];

            // Only select the fields not on the currently authenticated user group's read field blacklist
            $relationalColumnName = $alias->getRelationship()->getFieldMany();
            $tableGateway = new RelationalTableGateway($relatedTableName, $this->adapter, $this->acl);
            if (!empty($columnsTree[$alias->getName()])) {
                $filterFields = \Directus\get_array_flat_columns($columnsTree[$alias->getName()]);
            }
            $filters = [];

            if (ArrayUtils::get($params, 'lang') && DataTypes::isTranslationsType($alias->getType())) {
                $languageField = $this->schemaManager->getCollection($relatedTableName)->getLangField();
                if (!$languageField) {
                    throw new Exception\FieldNotFoundException(
                        'field of lang type was not found in collection: ' . $relatedTableName
                    );
                }

                $langIds = StringUtils::safeCvs(ArrayUtils::get($params, 'lang'));
                if (!in_array('*', $langIds)) {
                    $filters[$languageField->getName()] = ['in' => $langIds];
                }
            }

            $results = $tableGateway->fetchItems(array_merge([
                'fields' => !empty($filterFields)  ? array_merge([$relationalColumnName], $filterFields) : [$relationalColumnName],
                // Fetch all related data
                'limit' => -1,
                'filter' => array_merge($filters, [
                    $relationalColumnName => ['in' => $ids]
                ]),
            ], $params));

            $relatedEntries = [];
            if (!empty($filterFields)) {
                $selectedFields = $tableGateway->getSelectedFields($filterFields);
            }

            foreach ($results as $row) {
                // Quick fix
                // @NOTE: When fetching a column that also has another relational field
                // the value is not a scalar value but an array with all the data associated to it.
                // @TODO: Make this result a object so it can be easy to interact.
                // $row->getId(); RowGateway perhaps?
                $relationalColumnId = $row[$relationalColumnName];
                if (is_array($relationalColumnId) && !empty($relationalColumnId)) {
                    $relationalColumnId = $relationalColumnId[$primaryKey];
                }

                if ($filterFields && !in_array('*', $filterFields)) {
                    $row = ArrayUtils::pick(
                        $row,
                        $selectedFields
                    );
                }

                $relatedEntries[$relationalColumnId][] = $row;
            }

            // Replace foreign keys with foreign rows
            $relationalColumnName = $alias->getName();
            foreach ($entries as &$parentRow) {
                // TODO: Remove all columns not from the original selection
                // meaning remove the related column and primary key that were selected
                // but weren't requested at first but were forced to be selected
                // within directus as directus needs the related and the primary keys to work properly
                $rows = ArrayUtils::get($relatedEntries, $parentRow[$primaryKey], []);
                $parentRow[$relationalColumnName] = $rows;
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
     * @param Field[] $columns
     * @param array $params
     *
     * @return array Revised table rows, now including foreign rows
     *
     * @throws Exception\RelationshipMetadataException
     */
    public function loadManyToOneRelationships($entries, $columns, array $params = [])
    {
        $columnsTree = \Directus\get_unflat_columns($columns);
        $visibleColumns = $this->getTableSchema()->getFields(array_keys($columnsTree));
        foreach ($visibleColumns as $column) {
            if (!$column->isManyToOne()) {
                continue;
            }

            $relatedTable = $column->getRelationship()->getCollectionOne();

            // if user doesn't have permission to view the related table
            // fill the data with only the id, which the user has permission to
            if ($this->acl && !$this->acl->canReadOnce($relatedTable)) {
                $tableGateway = new RelationalTableGateway($relatedTable, $this->adapter, null);
                $primaryKeyName = $tableGateway->primaryKeyFieldName;
                foreach ($entries as $i => $entry) {
                    if (isset($entry[$column->getName()])) {

                        $entries[$i][$column->getName()] = [
                            $primaryKeyName => $entry[$column->getName()]
                        ];
                    }
                }

                $this->exceptionMessages[] = [
                    'type' => 'warning',
                    'message' => "Can't read `" . $relatedTable . "`: read access to `" . $relatedTable . "` collection denied",
                    'code' => ErrorCodes::WARNING_ACCESS_DENIED,
                    'fields' => [$column->getName()],
                ];
                continue;
            }

            $tableGateway = new RelationalTableGateway($relatedTable, $this->adapter, $this->acl);
            $primaryKeyName = $tableGateway->primaryKeyFieldName;

            if (!$relatedTable) {
                $message = 'Non single_file Many-to-One relationship lacks `related_table` value.';

                if ($column->getName()) {
                    $message .= ' Column: ' . $column->getName();
                }

                if ($column->getCollectionName()) {
                    $message .= ' Table: ' . $column->getCollectionName();
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

            $filterColumns = \Directus\get_array_flat_columns($columnsTree[$column->getName()]);
            // Fetch the foreign data
            $results = $tableGateway->fetchItems(array_merge([
                // Fetch all related data
                'limit' => -1,
                // Make sure to include the primary key
                'fields' => array_merge([$primaryKeyName], $filterColumns),
                'filter' => [
                    $primaryKeyName => ['in' => $ids]
                ],
            ], $params));

            $relatedEntries = [];
            foreach ($results as $row) {
                $rowId = $row[$primaryKeyName];
                if ($filterColumns && !in_array('*', $filterColumns)) {
                    $row = ArrayUtils::pick(
                        $row,
                        $tableGateway->getSelectedFields($filterColumns)
                    );
                }

                $relatedEntries[$rowId] = $row;

                $tableGateway->wrapData(
                    $relatedEntries[$rowId],
                    true,
                    ArrayUtils::get($params, 'meta', 0)
                );
            }

            // Replace foreign keys with foreign rows
            foreach ($entries as $key => &$parentRow) {
                if (array_key_exists($relationalColumnName, $parentRow)) {
                    // @NOTE: Not always will be a integer
                    // @NOTE: But what about UUIDS and slugs?
                    $foreign_id = (string) $parentRow[$relationalColumnName];
                    $parentRow[$relationalColumnName] = null;

                    // if the foreign_key is empty, then there's nothing more to do
                    if (empty($foreign_id))
                        continue;

                    // "Did we retrieve the foreign row with this foreign ID in our recent query of the foreign table"?
                    if (array_key_exists($foreign_id, $relatedEntries)) {
                        $parentRow[$relationalColumnName] = $relatedEntries[$foreign_id];
                    } else {
                        // when foreign_id is not empty but there's no $relatedEntries,
                        // then it means it was soft-deleted.
                        $parentRow[$relationalColumnName] = null;
                    }
                }
            }
        }

        return array_values($entries);
    }

    /**
     *
     * HELPER FUNCTIONS
     *
     **/

    /**
     * @param $fields
     *
     * @return array
     */
    public function getSelectedFields(array $fields)
    {
        return $this->replaceWildcardFieldWith(
            $fields,
            SchemaService::getAllCollectionFieldsName($this->getTable())
        );
    }

    /**
     * Gets the non alias fields from the selected fields
     *
     * @param array $fields
     *
     * @return array
     */
    public function getSelectedNonAliasFields(array $fields)
    {
        $nonAliasFields = SchemaService::getAllNonAliasCollectionFieldsName($this->getTableSchema()->getName());

        $allFields = $this->replaceWildcardFieldWith(
            $fields,
            $nonAliasFields
        );

        // Remove alias fields
        return ArrayUtils::intersection(
            $allFields,
            $nonAliasFields
        );
    }

    /**
     * Returns the related fields from the selected fields array
     *
     * @param array $fields
     *
     * @return array
     */
    public function getSelectedRelatedFields(array $fields)
    {
        $fieldsLevel = \Directus\get_unflat_columns($fields);

        foreach ($fieldsLevel as $parent => $children) {
            if ($parent === '*') {
                $parentFields = $fieldsLevel[$parent];
                unset($fieldsLevel[$parent]);
                $allFields = SchemaService::getAllCollectionFieldsName($this->getTable());
                foreach ($allFields as $field) {
                    if (isset($fieldsLevel[$field])) {
                        continue;
                    }

                    $fieldsLevel[$field] = $parentFields;
                }

                break;
            }
        }

        $relatedFields = ArrayUtils::intersection(
            array_keys($fieldsLevel),
            $this->getTableSchema()->getRelationalFieldsName()
        );

        return array_filter($fieldsLevel, function ($key) use ($relatedFields) {
            return in_array($key, $relatedFields);
        }, ARRAY_FILTER_USE_KEY);
    }

    /**
     * Remove the wildcards fields and append the replacement fields
     *
     * @param array $fields
     * @param array $replacementFields
     *
     * @return array
     */
    protected function replaceWildcardFieldWith(array $fields, array $replacementFields)
    {
        $selectedNames = \Directus\get_columns_flat_at($fields, 0);
        // remove duplicate field name
        $selectedNames = array_unique($selectedNames);

        $wildCardIndex = array_search('*', $selectedNames);
        if ($wildCardIndex !== false) {
            unset($selectedNames[$wildCardIndex]);
            $selectedNames = array_merge($selectedNames, $replacementFields);
        }

        $pickedNames = array_filter($selectedNames, function ($value) {
            return strpos($value, '-') !== 0;
        });
        $omittedNames = array_values(array_map(function ($value) {
            return substr($value, 1);
        }, array_filter($selectedNames, function ($value) {
            return strpos($value, '-') === 0;
        })));

        return array_values(array_flip(ArrayUtils::omit(array_flip($pickedNames), $omittedNames)));
    }

    /**
     * Throws an exception if any of the given field doesn't exist
     *
     * @param array $fields
     *
     * @throws Exception\InvalidFieldException
     */
    public function validateFields(array $fields)
    {
        $collection = $this->getTableSchema();
        $selectedFields = $this->getSelectedFields($fields);

        foreach ($selectedFields as $field) {
            if (!$collection->hasField($field)) {
                throw new Exception\InvalidFieldException($field, $collection->getName());
            }
        }
    }

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
        $collection = $this->schemaManager->getCollection($this->getTable());
        if (!$collection->hasStatusField()) {
            return [];
        }

        $statusFieldName = $collection->getStatusField()->getName();

        $select = new Select($this->getTable());
        $select
            ->columns([$statusFieldName, 'quantity' => new Expression('COUNT(*)')])
            ->group($statusFieldName);

        $sql = new Sql($this->adapter, $this->table);
        $statement = $sql->prepareStatementForSqlObject($select);
        $results = $statement->execute();

        $stats = [];
        foreach ($results as $row) {
            $stats[$row[$statusFieldName]] = (int) $row['quantity'];
        }

        $statusMap = $this->getStatusMapping();
        foreach ($statusMap as $value) {
            if (!isset($stats[$value->getValue()])) {
                $stats[$value->getValue()] = 0;
            }
        }

        return $stats;
    }

    /**
     * @param string $action
     * @param array|null $payload
     * @param array|null $record
     * @param array $nestedItems
     * @param array $params
     */
    protected function recordActivity($action, $payload, array $record, array $nestedItems, array $params = [])
    {
        $isActivityCollection = $this->getTable() == SchemaManager::COLLECTION_ACTIVITY;
        $activityMode = ArrayUtils::get($params, 'activity_mode', static::ACTIVITY_ENTRY_MODE_PARENT);
        $isDisabled = $activityMode == DirectusActivityTableGateway::ACTIVITY_ENTRY_MODE_DISABLED;

        if ($isActivityCollection || $isDisabled) {
            return;
        }

        $currentUserId = $this->acl ? $this->acl->getUserId() : null;
        $rowId = $record[$this->primaryKeyFieldName];

        if ($action == DirectusActivityTableGateway::ACTION_UPDATE) {
            $deltaRecordData = array_intersect_key(
                ArrayUtils::omit($payload, $this->primaryKeyFieldName),
                $record
            );
        } else {
            $deltaRecordData = $payload;
        }

        // remove "data" from directus_files payload
        if ($this->getTable() === SchemaManager::COLLECTION_FILES) {
            unset($deltaRecordData['data']);
        }

        // Save parent log entry
        $activityTableGateway = new RelationalTableGateway(SchemaManager::COLLECTION_ACTIVITY, $this->adapter);
        $activityTableGateway->insert([
            'action' => DirectusActivityTableGateway::makeLogActionFromTableName(
                $this->table,
                $action
            ),
            'action_by' => $currentUserId,
            'action_on' => DateTimeUtils::nowInUTC()->toString(),
            'ip' => \Directus\get_request_host(),
            'user_agent' => isset($_SERVER['HTTP_USER_AGENT']) ? $_SERVER['HTTP_USER_AGENT'] : '',
            'collection' => $this->getTable(),
            'item' => ArrayUtils::get($record, $this->primaryKeyFieldName),
            'comment' => ArrayUtils::get($params, 'activity_comment')
        ]);
        $parentLogEntry = $activityTableGateway->getLastInsertValue();

        // Add Revisions
        $revisionTableGateway = new RelationalTableGateway(SchemaManager::COLLECTION_REVISIONS, $this->adapter);
        if ($action !== DirectusActivityTableGateway::ACTION_DELETE) {
            $revisionTableGateway->insert([
                'activity' => $parentLogEntry,
                'collection' => $this->getTable(),
                'item' => $rowId,
                'data' => json_encode($record),
                'delta' => json_encode($deltaRecordData),
                'parent_item' => null,
                'parent_collection' => null,
                'parent_changed' => null,
            ]);
        }

        // Update & insert nested activity entries
        $ActivityGateway = new DirectusActivityTableGateway($this->adapter);
        foreach ($nestedItems as $item) {
            // TODO: ought to insert these in one batch
            $ActivityGateway->insert(ArrayUtils::omit($item, [
                'parent_item',
                'parent_collection',
                'data',
                'delta',
                'parent_changed',
            ]));
            $revisionTableGateway->insert([
                'activity' => $ActivityGateway->lastInsertValue,
                'collection' => ArrayUtils::get($item, 'collection'),
                'item' => ArrayUtils::get($item, 'item'),
                'data' => ArrayUtils::get($item, 'data'),
                'delta' => ArrayUtils::get($item, 'delta'),
                'parent_item' => ArrayUtils::get($item, 'parent_item'),
                'parent_collection' => ArrayUtils::get($item, 'parent_collection'),
                'parent_changed' => ArrayUtils::get($item, 'parent_changed')
            ]);
        }
    }

    /**
     * List of all supported filters
     *
     * @return array
     */
    protected function getSupportedFilters()
    {
        $shorthands = array_keys($this->operatorShorthand);

        $operators = [
            'like',
            'null',
            'all',
            'has',
            'between',
            'empty',
        ];

        return array_merge($shorthands, $operators);
    }

    /**
     * Checks whether a given filter operator is supported
     *
     * @param string $operator
     *
     * @return bool
     */
    protected function isFilterSupported($operator)
    {
        return in_array($operator, $this->getSupportedFilters());
    }

    /**
     * Returns the value of "now" for a date or datetime field
     *
     * @param Field $field
     * @param string $value
     *
     * @return string
     */
    protected function getFieldNowValue(Field $field, $value)
    {
        $isNow = is_string($value) && strtolower($value) === 'now';
        $isDateType = DataTypes::isDateType($field->getType());
        $isDateTimeType = DataTypes::isDateTimeType($field->getType());

        if (!$isNow || (!$isDateType && !$isDateTimeType)) {
            return $value;
        }

        $isSystemCollection = $this->schemaManager->isSystemCollection($field->getCollectionName());
        $datetime = DateTimeUtils::now();
        $format = null;
        if ($isDateType) {
            $format = DateTimeUtils::DEFAULT_DATE_FORMAT;
        }

        return $isSystemCollection ? $datetime->toUTCString($format) : $datetime->toString($format);
    }

    protected function getFieldNowValues(Field $field, $value)
    {
        if (is_array($value)) {
            foreach ($value as &$v) {
                $v = $this->getFieldNowValue($field, $v);
            }
        } else {
            $value = $this->getFieldNowValue($field, $value);
        }

        return $value;
    }

    protected function getLikeValue($operator, $filter, $value)
    {
        // Ignore raw like filter and non-like operators
        if (in_array($filter, ['rlike', 'nrlike']) || $operator !== 'like') {
            return $value;
        }

        return sprintf('%%%s%%', addcslashes($value, '%_'));
    }
}
