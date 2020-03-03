<?php

namespace Directus\Services;

use Directus\Application\Container;
use Directus\Database\Exception;
use Directus\Database\Exception\CollectionAlreadyExistsException;
use Directus\Database\Exception\CollectionNotFoundException;
use Directus\Database\Exception\CollectionNotManagedException;
use Directus\Database\Exception\FieldAlreadyExistsException;
use Directus\Database\Exception\FieldLengthNotSupportedException;
use Directus\Database\Exception\FieldLengthRequiredException;
use Directus\Database\Exception\FieldNotFoundException;
use Directus\Database\Exception\InvalidFieldException;
use Directus\Database\Exception\ItemNotFoundException;
use Directus\Database\Exception\UnknownTypeException;
use Directus\Database\RowGateway\BaseRowGateway;
use Directus\Database\SchemaService;
use Directus\Database\Schema\DataTypes;
use Directus\Database\Schema\Object\Collection;
use Directus\Database\Schema\Object\Field;
use Directus\Database\Schema\Object\FieldRelationship;
use Directus\Database\Schema\SchemaFactory;
use Directus\Database\Schema\SchemaManager;
use Directus\Database\TableGateway\RelationalTableGateway;
use Directus\Exception\ErrorException;
use Directus\Exception\UnauthorizedException;
use Directus\Exception\UnprocessableEntityException;
use Directus\Hook\Emitter;
use Directus\Util\ArrayUtils;
use Directus\Util\StringUtils;
use Directus\Validator\Exception\InvalidRequestException;

// TODO: Create activity for collection and fields
class TablesService extends AbstractService
{
    /**
     * @var string
     */
    protected $collection;

    /**
     * @var RelationalTableGateway
     */
    protected $fieldsTableGateway;

    /**
     * @var RelationalTableGateway
     */
    protected $collectionsTableGateway;

    /**
     * @var RelationalTableGateway
     */
    protected $relationsTableGateway;

    public function __construct(Container $container)
    {
        parent::__construct($container);

        $this->collection = SchemaManager::COLLECTION_COLLECTIONS;
    }

    public function findAll(array $params = [])
    {
        $tableGateway = $this->createTableGateway($this->collection);

        $result = $tableGateway->getItems($params);

        $result['data'] = $this->mergeMissingSchemaCollections(
            $this->getSchemaManager()->getCollectionsName(),
            $result['data']
        );

        return $result;
    }

    public function findAllFieldsByCollection($collectionName, array $params = [])
    {
        $this->validate(['collection' => $collectionName], ['collection' => 'required|string']);

        /** @var SchemaManager $schemaManager */
        $schemaManager = $this->container->get('schema_manager');
        $collection = $schemaManager->getCollection($collectionName);
        if (!$collection) {
            throw new CollectionNotFoundException($collectionName);
        }

        $tableGateway = $this->getFieldsTableGateway();
        $result = $tableGateway->getItems(array_merge($params, [
            'filter' => [
                'collection' => $collectionName,
            ],
        ]));

        $result = $this->mergeMissingSchemaFields($collection, $result);

        $data = [];
        foreach ($result as $resultDetails) {
            if ($this->getAcl()->isAdmin()) {
                $data[] = $resultDetails;
            } else {
                $fieldReadBlackListDetails = $this->getAcl()->getStatusesOnReadFieldBlacklist($collectionName, $resultDetails['field']);
                if (!(isset($fieldReadBlackListDetails['isReadBlackList']) && $fieldReadBlackListDetails['isReadBlackList'])) {
                    $data[] = $resultDetails;
                }
            }
        }

        return ['data' => $data];
    }

    public function findAllFields(array $params = [])
    {
        $this->getAcl()->enforceReadOnce('directus_fields');

        /** @var SchemaManager $schemaManager */
        $schemaManager = $this->container->get('schema_manager');

        // Hotfix: Get supported params and validate them
        $fields = $schemaManager->getAllFields($this->getAllFieldsParams($params));

        $data = [];
        foreach ($fields as $field) {
            $data[] = $this->mergeSchemaField($field);
        }

        $response = [];
        foreach ($data as $fieldDetails) {
            if ($this->getAcl()->isAdmin()) {
                $response[] = $fieldDetails;
            } else {
                $fieldReadBlackListDetails = $this->getAcl()->getStatusesOnReadFieldBlacklist($fieldDetails['collection'], $fieldDetails['field']);
                if ($this->getAcl()->canReadOnce($fieldDetails['collection']) && !(isset($fieldReadBlackListDetails['isReadBlackList']) && $fieldReadBlackListDetails['isReadBlackList'])) {
                    $response[] = $fieldDetails;
                }
            }
        }

        return ['data' => $response];
    }

    public function find($name, array $params = [])
    {
        $this->validate(['collection' => $name], ['collection' => 'required|string']);

        $tableGateway = $this->createTableGateway($this->collection);

        $result = $tableGateway->getItems(array_merge($params, [
            'id' => $name,
        ]));

        $newData = $this->mergeSchemaCollection($name, $result['data']);
        if (!$newData) {
            throw new CollectionNotFoundException($name);
        }

        $result['data'] = $newData;

        return $result;
    }

    public function findByIds($name, array $params = [])
    {
        $this->validate(['collection' => $name], ['collection' => 'required|string']);

        $tableGateway = $this->createTableGateway($this->collection);

        try {
            $result = $tableGateway->getItemsByIds($name, $params);
            $collectionNames = StringUtils::csv((string) $name);
            $result['data'] = $this->mergeMissingSchemaCollections($collectionNames, $result['data']);
        } catch (ItemNotFoundException $e) {
            throw $e;
        }

        if ($result['data'] === null) {
            throw new CollectionNotFoundException($name);
        }

        return $result;
    }

    public function findField($collection, $field, array $params = [])
    {
        $this->getAcl()->enforceReadOnce('directus_fields');
        $this->getAcl()->enforceReadOnce($collection);
        $fieldReadBlackListDetails = $this->getAcl()->getStatusesOnReadFieldBlacklist($collection, $field);
        if (isset($fieldReadBlackListDetails['isReadBlackList']) && $fieldReadBlackListDetails['isReadBlackList']) {
            throw new Exception\ForbiddenFieldAccessException($field);
        }

        $this->validate([
            'collection' => $collection,
            'field' => $field,
        ], [
            'collection' => 'required|string',
            'field' => 'required|string',
        ]);

        /** @var SchemaManager $schemaManager */
        $schemaManager = $this->container->get('schema_manager');
        // NOTE: Always skip temporary cache when fetching collection data
        // It avoids error error trying to fetch recently created field
        $collectionObject = $schemaManager->getCollection($collection, [], true);
        if (!$collectionObject) {
            throw new CollectionNotFoundException($collection);
        }

        $columnObject = $collectionObject->getField($field);
        if (!$columnObject) {
            throw new FieldNotFoundException($field);
        }

        $tableGateway = $this->getFieldsTableGateway();

        if ($columnObject->isManaged()) {
            $params = ArrayUtils::pick($params, ['meta', 'fields']);
            $params['single'] = true;
            $params['filter'] = [
                'collection' => $collection,
                'field' => $field,
            ];

            $result = $tableGateway->getItems($params);
            $fieldData = $this->mergeMissingSchemaField($collectionObject, $result['data']);
            if ($fieldData) {
                $result['data'] = $fieldData;
            }
        } else {
            //  Get not managed fields
            $result = $tableGateway->wrapData(
                $this->mergeSchemaField($columnObject),
                true,
                ArrayUtils::pick($params, 'meta')
            );
        }

        return $result;
    }

    public function findFields($collectionName, array $fieldsName, array $params = [])
    {
        $this->getAcl()->enforceReadOnce('directus_fields');
        $this->getAcl()->enforceReadOnce($collectionName);
        foreach ($fieldsName as $field) {
            $fieldReadBlackListDetails = $this->getAcl()->getStatusesOnReadFieldBlacklist($collectionName, $field);
            if (isset($fieldReadBlackListDetails['isReadBlackList']) && $fieldReadBlackListDetails['isReadBlackList']) {
                throw new Exception\ForbiddenFieldAccessException($field);
            }
        }
        $this->validate(['fields' => $fieldsName], ['fields' => 'required|array']);

        /** @var SchemaManager $schemaManager */
        $schemaManager = $this->container->get('schema_manager');
        $collection = $schemaManager->getCollection($collectionName);
        if (!$collection) {
            throw new CollectionNotFoundException($collectionName);
        }

        $tableGateway = $this->getFieldsTableGateway();
        $result = $tableGateway->getItems(array_merge($params, [
            'filter' => [
                'collection' => $collectionName,
                'field' => ['in' => $fieldsName],
            ],
        ]));

        $result['data'] = $this->mergeMissingSchemaFields($collection, ArrayUtils::get($result, 'data'), $fieldsName);

        return $result;
    }

    public function deleteField($collection, $field, array $params = [])
    {
        $this->getAcl()->enforceDelete('directus_fields');
        $this->getAcl()->enforceDelete($collection);
        $fieldWriteBlackListDetails = $this->getAcl()->getStatusesOnWriteFieldBlacklist($collection, $field);
        if (isset($fieldWriteBlackListDetails['isWriteBlackList']) && $fieldWriteBlackListDetails['isWriteBlackList']) {
            throw new Exception\ForbiddenFieldAccessException($field);
        }
        $this->validate([
            'collection' => $collection,
            'field' => $field,
        ], [
            'collection' => 'required|string',
            'field' => 'required|string',
        ]);

        $tableService = new TablesService($this->container);

        /** @var Emitter $hookEmitter */
        $hookEmitter = $this->container->get('hook_emitter');
        $hookEmitter->run('field.delete:before', [$collection, $field]);
        $hookEmitter->run('field.delete.' . $collection . ':before', [$field]);

        $tableService->dropColumn($collection, $field, $params);

        $hookEmitter->run('field.delete', [$collection, $field]);
        $hookEmitter->run('field.delete.' . $collection, [$field]);
        $hookEmitter->run('field.delete:after', [$collection, $field]);
        $hookEmitter->run('field.delete.' . $collection . ':after', [$field]);

        return true;
    }

    /**
     *
     * @param string $name
     * @param array $data
     * @param array $params
     *
     * @return array
     *
     * @throws ErrorException
     * @throws InvalidRequestException
     * @throws CollectionAlreadyExistsException
     * @throws UnauthorizedException
     * @throws UnprocessableEntityException
     */
    public function createTable($name, array $data = [], array $params = [])
    {
        if (!$this->getAcl()->isAdmin()) {
            throw new UnauthorizedException('Unauthorized to create collections');
        }

        $data = ArrayUtils::defaults(['managed' => true], $data);
        $this->enforcePermissions($this->collection, $data, $params);

        $data['collection'] = $name;

        $this->validateCollectionPayload($name, $data, null, $params);

        $collection = null;

        try {
            $collection = $this->getSchemaManager()->getCollection($name);
        } catch (CollectionNotFoundException $e) {
            // TODO: Default to primary key id
            $constraints['fields'][] = 'required';

            $this->validate($data, array_merge(['fields' => 'array'], $constraints));
        }

        // ----------------------------------------------------------------------------

        if ($collection && $collection->isManaged()) {
            throw new CollectionAlreadyExistsException($name);
        }

        if (!$this->hasPrimaryField($data['fields'])) {
            throw new UnprocessableEntityException('Collection does not have a primary key field.');
        }

        if (!$this->hasUniquePrimaryField($data['fields'])) {
            throw new UnprocessableEntityException('Collection must only have one primary key field.');
        }

        if (!$this->hasUniqueAutoIncrementField($data['fields'])) {
            throw new UnprocessableEntityException('Collection must only have one auto increment field.');
        }

        if (!$this->hasUniqueFieldsName($data['fields'])) {
            throw new UnprocessableEntityException('Collection fields name must be unique.');
        }

        if ($collection && !$collection->isManaged()) {
            $success = $this->updateTableSchema($collection, $data);
        } else {
            $success = $this->createTableSchema($name, $data);
        }

        if (!$success) {
            throw new ErrorException('Error creating the collection');
        }

        $collectionsTableGateway = $this->createTableGateway('directus_collections');

        $fields = ArrayUtils::get($data, 'fields');
        if ($collection && !$collection->isManaged() && !$fields) {
            $fields = $collection->getFieldsArray();
        }

        $this->addColumnsInfo($name, $fields);

        $item = ArrayUtils::omit($data, 'fields');
        $item['collection'] = $name;

        $table = $collectionsTableGateway->manageRecordUpdate('directus_collections', $item);

        // NOTE: The collection didn't exists.
        // This means the collection was created instead of started to being managed by directus
        if (!$collection) {
            /** @var Emitter $hookEmitter */
            $hookEmitter = $this->container->get('hook_emitter');
            $hookEmitter->run('collection.create', $name);
            $hookEmitter->run('collection.create:after', $name);
        }

        // ----------------------------------------------------------------------------

        $collectionTableGateway = $this->createTableGateway('directus_collections');
        $tableData = $collectionTableGateway->parseRecord($table->toArray());

        return $collectionTableGateway->wrapData($tableData, true, ArrayUtils::get($params, 'meta'));
    }

    /**
     * Updates a table
     *
     * @param $name
     * @param array $data
     * @param array $params
     *
     * @return array
     *
     * @throws CollectionNotManagedException
     * @throws ErrorException
     * @throws CollectionNotFoundException
     * @throws UnauthorizedException
     */
    public function updateTable($name, array $data, array $params = [])
    {
        // TODO: Add only for admin middleware
        if (!$this->getAcl()->isAdmin()) {
            throw new UnauthorizedException('Permission denied');
        }

        $data = ArrayUtils::omit($data, 'collection');

        $this->enforcePermissions($this->collection, $data, $params);

        // Validates the collection name
        $this->validate(['collection' => $name], ['collection' => 'required|string']);

        // Validates payload data
        $this->validateCollectionPayload($name, $data, array_keys(ArrayUtils::omit($data, 'fields')), true, $params);
        $data['collection'] = $name;

        $collectionObject = $this->getSchemaManager()->getCollection($name);
        $startManaging = (bool) ArrayUtils::get($data, 'managed', false);
        $isManaged = $collectionObject->isManaged();

        if (!$isManaged && !$startManaging) {
            throw new CollectionNotManagedException($collectionObject->getName());
        }

        // TODO: Create a check if exists method (quicker) + not found exception
        $tableGateway = $this->createTableGateway($this->collection);

        if ($startManaging && !$isManaged) {
            $table = $tableGateway->manageRecordUpdate('directus_collections', $data);
            if (!$table) {
                throw new ErrorException('Error managing the collection');
            }
        }

        $tableGateway->getOneData($name);
        // ----------------------------------------------------------------------------

        if (!$this->getSchemaManager()->collectionExists($name)) {
            throw new CollectionNotFoundException($name);
        }

        $collection = $this->getSchemaManager()->getCollection($name);
        $fields = ArrayUtils::get($data, 'fields', []);
        foreach ($fields as $i => $field) {
            $field = $collection->getField($field['field']);
            if ($field) {
                $currentColumnData = $field->toArray();
                $fields[$i] = array_merge($currentColumnData, $fields[$i]);
            }
        }

        $data['fields'] = $fields;
        $success = $this->updateTableSchema($collection, $data);
        if (!$success) {
            throw new ErrorException('Error updating the collection');
        }

        $collectionsTableGateway = $this->createTableGateway('directus_collections');
        if (!empty($fields)) {
            $this->addColumnsInfo($name, $fields);
        }

        $item = ArrayUtils::omit($data, 'fields');
        $item['collection'] = $name;

        $collection = $collectionsTableGateway->manageRecordUpdate('directus_collections', $item);

        // ----------------------------------------------------------------------------
        return $tableGateway->wrapData(
            $collection->toArray(),
            true,
            ArrayUtils::get($params, 'meta')
        );
    }

    public function delete($name, array $params = [])
    {
        $this->enforcePermissions($this->collection, [], $params);
        $this->validate(['name' => $name], ['name' => 'required|string']);
        // TODO: How are we going to handle unmanage
        // $unmanaged = $request->getQueryParam('unmanage', 0);
        // if ($unmanaged == 1) {
        //     $tableGateway = new RelationalTableGateway($tableName, $dbConnection, $acl);
        //     $success = $tableGateway->stopManaging();
        // }

        return $this->dropTable($name);
    }

    /**
     * Adds a column to an existing table
     *
     * @param string $collectionName
     * @param string $columnName
     * @param array $data
     * @param array $params
     *
     * @return array
     *
     * @throws FieldAlreadyExistsException
     * @throws CollectionNotFoundException
     * @throws UnauthorizedException
     */
    public function addColumn($collectionName, $columnName, array $data, array $params = [])
    {
        $this->getAcl()->enforceCreate('directus_fields');
        $this->getAcl()->enforceCreate($collectionName);

        $data['field'] = $columnName;
        $data['collection'] = $collectionName;
        $this->validateFieldPayload($data, null, $params);

        // ----------------------------------------------------------------------------

        $collection = $this->getSchemaManager()->getCollection($collectionName);
        if (!$collection) {
            throw new CollectionNotFoundException($collectionName);
        }

        $field = $collection->getField($columnName);
        if ($field && $field->isManaged()) {
            throw new FieldAlreadyExistsException($columnName);
        }

        $columnData = array_merge($data, [
            'field' => $columnName,
        ]);

        /** @var Emitter $hookEmitter */
        $hookEmitter = $this->container->get('hook_emitter');
        $hookEmitter->run('field.create:before', [$collectionName, $columnName, $data]);
        $hookEmitter->run('field.create.' . $collectionName . ':before', [$columnName, $data]);

        // TODO: Only call this when necessary
        $this->updateTableSchema($collection, [
            'fields' => [$columnData],
        ]);

        // ----------------------------------------------------------------------------

        $this->addFieldInfo($collectionName, $columnName, $columnData);

        $hookEmitter->run('field.create', [$collectionName, $columnName, $data]);
        $hookEmitter->run('field.create.' . $collectionName, [$columnName, $data]);
        $hookEmitter->run('field.create:after', [$collectionName, $columnName, $data]);
        $hookEmitter->run('field.create.' . $collectionName . ':after', [$columnName, $data]);

        return $this->findField($collectionName, $columnName, $params);
    }

    /**
     * Adds a column to an existing table
     *
     * @param string $collectionName
     * @param string $fieldName
     * @param array $data
     * @param array $params
     *
     * @return array
     *
     * @throws FieldNotFoundException
     * @throws CollectionNotFoundException
     * @throws UnauthorizedException
     */
    public function changeColumn($collectionName, $fieldName, array $data, array $params = [])
    {
        $this->getAcl()->enforceUpdate('directus_fields');
        $this->getAcl()->enforceUpdate($collectionName);
        $fieldWriteBlackListDetails = $this->getAcl()->getStatusesOnWriteFieldBlacklist($collectionName, $fieldName);
        if (isset($fieldWriteBlackListDetails['isWriteBlackList']) && $fieldWriteBlackListDetails['isWriteBlackList']) {
            throw new Exception\ForbiddenFieldAccessException($fieldName);
        }

        $data['field'] = $fieldName;
        $data['collection'] = $collectionName;
        $this->validateFieldPayload($data, array_keys($data), $params);

        // Remove field from data
        ArrayUtils::remove($data, 'field');

        // ----------------------------------------------------------------------------

        $collection = $this->getSchemaManager()->getCollection($collectionName);
        if (!$collection) {
            throw new CollectionNotFoundException($collectionName);
        }
        $field = $collection->getField($fieldName);

        if (!$field) {
            throw new FieldNotFoundException($fieldName);
        }

        /** @var Emitter $hookEmitter */
        $hookEmitter = $this->container->get('hook_emitter');
        $hookEmitter->run('field.update:before', [$collectionName, $fieldName, $data]);
        $hookEmitter->run('field.update.' . $collectionName . ':before', [$fieldName, $data]);

        if ($this->shouldUpdateSchema($data)) {
            $this->updateTableSchema($collection, [
                'fields' => [array_merge($field->toArray(), $data)],
            ]);
        }

        // $this->invalidateCacheTags(['tableColumnsSchema_'.$tableName, 'columnSchema_'.$tableName.'_'.$columnName]);
        $resultData = $this->addOrUpdateFieldInfo($collectionName, $fieldName, $data);

        // ----------------------------------------------------------------------------

        $hookEmitter->run('field.update', [$collectionName, $fieldName, $data]);
        $hookEmitter->run('field.update.' . $collectionName, [$fieldName, $data]);
        $hookEmitter->run('field.update:after', [$collectionName, $fieldName, $data]);
        $hookEmitter->run('field.update.' . $collectionName . ':after', [$fieldName, $data]);

        return $this->getFieldsTableGateway()->wrapData(
            $resultData,
            true,
            ArrayUtils::get($params, 'meta', 0)
        );
    }

    /**
     * @param array $data
     *
     * @return bool
     */
    protected function shouldUpdateSchema(array $data)
    {
        // NOTE: If any of these attributes exists the database needs to update the column
        return ArrayUtils::containsSome($data, [
            'type',
            'datatype',
            'unique',
            'primary_key',
            'auto_increment',
            'length',
            'note',
            'signed',
            'nullable',
        ]);
    }

    /**
     * Updates a list of fields with different data each
     *
     * @param string $collectionName
     * @param array $payload
     * @param array $params
     *
     * @return array
     *
     * @throws InvalidRequestException
     */
    public function batchUpdateField($collectionName, array $payload, array $params = [])
    {
        if (!isset($payload[0]) || !is_array($payload[0])) {
            throw new InvalidRequestException('batch update expect an array of items');
        }

        foreach ($payload as $data) {
            $this->validatePayload(SchemaManager::COLLECTION_FIELDS, array_keys($data), $data, $params);
            $this->validate($data, ['field' => 'required']);
        }

        $allItems = [];
        foreach ($payload as $data) {
            $fieldName = ArrayUtils::get($data, 'field');
            $item = $this->changeColumn($collectionName, $fieldName, $data, $params);

            if (!is_null($item)) {
                $allItems[] = $item['data'];
            }
        }

        if (!empty($allItems)) {
            $allItems = $this->getFieldsTableGateway()->wrapData($allItems, false, ArrayUtils::get($params, 'meta'));
        }

        return $allItems;
    }

    /**
     * Updates a list of fields with the same data
     *
     * @param $collectionName
     * @param array $fieldNames
     * @param array $payload
     * @param array $params
     *
     * @return array
     */
    public function batchUpdateFieldWithIds($collectionName, array $fieldNames, array $payload, array $params = [])
    {
        $this->validatePayload(SchemaManager::COLLECTION_FIELDS, array_keys($payload), $payload, $params);
        $this->validate(['fields' => $fieldNames], ['fields' => 'required']);

        $allItems = [];
        foreach ($fieldNames as $fieldName) {
            $item = $this->changeColumn($collectionName, $fieldName, $payload, $params);
            if (!empty($item)) {
                $allItems[] = $item['data'];
            }
        }

        if (!empty($allItems)) {
            $allItems = $this->getFieldsTableGateway()->wrapData($allItems, false, ArrayUtils::get($params, 'meta'));
        }

        return $allItems;
    }

    public function dropColumn($collectionName, $fieldName, array $params = [])
    {
        $tableObject = $this->getSchemaManager()->getCollection($collectionName);
        if (!$tableObject) {
            throw new CollectionNotFoundException($collectionName);
        }

        $columnObject = $tableObject->getField($fieldName);
        if (!$columnObject) {
            throw new FieldNotFoundException($fieldName);
        }

        if (count($tableObject->getFields()) === 1) {
            throw new UnprocessableEntityException('Cannot delete the last field');
        }

        if ($columnObject->isAlias() === false) {
            if (!$this->dropColumnSchema($collectionName, $fieldName)) {
                throw new ErrorException('Error deleting the field');
            }
        }

        if (
            $columnObject->hasRelationship() &&
            // Don't remove relational columns for native relationships (users / files)
            DataTypes::isUsersType($columnObject->getType()) === false &&
            DataTypes::isFilesType($columnObject->getType()) === false
        ) {
            $this->removeColumnRelationship($columnObject, $params);
        }

        if ($columnObject->isManaged()) {
            /**
             * Remove O2M field if M2O interface deleted as O2M will only work if M2O exist
             */

            if (
                $columnObject->isManyToOne() &&
                // Don't remove relational columns for native relationships (users / files)
                DataTypes::isUsersType($columnObject->getType()) === false &&
                DataTypes::isFilesType($columnObject->getType()) === false
            ) {
                $this->removeRelatedColumnInfo($columnObject);
            }

            $this->removeColumnInfo($collectionName, $fieldName);
        }
    }

    /**
     * @param $collectionName
     * @param $fieldName
     *
     * @return int
     */
    public function removeRelatedColumnInfo(Field $field)
    {
        $relationship = $field->getRelationship();

        if ($field->getName() === $relationship->getFieldMany() && !is_null($relationship->getFieldOne())) {
            $this->removeColumnInfo($relationship->getCollectionOne(), $relationship->getFieldOne());
        }
    }
    /**
     * Add columns information to the fields table
     *
     * @param $collectionName
     * @param array $columns
     *
     * @return BaseRowGateway[]
     */
    public function addColumnsInfo($collectionName, array $columns)
    {
        $resultsSet = [];
        foreach ($columns as $column) {
            $resultsSet[] = $this->addOrUpdateFieldInfo($collectionName, $column['field'], $column);
        }

        return $resultsSet;
    }

    /**
     * Adds or update a field data
     *
     * @param string $collectionName
     * @param string $fieldName
     * @param array $data
     *
     * @return array
     */
    protected function addOrUpdateFieldInfo($collectionName, $fieldName, array $data)
    {
        $fieldsTableGateway = $this->getFieldsTableGateway();
        $row = $fieldsTableGateway->findOneByArray([
            'collection' => $collectionName,
            'field' => $fieldName,
        ]);

        if ($row) {
            $result = $this->updateFieldInfo($row['id'], $data);
        } else {
            $result = $this->addFieldInfo($collectionName, $fieldName, $data);
        }

        $collection = $collection = $this->getSchemaManager()->getCollection($collectionName, [], true);
        $field = $collection->getField($fieldName);

        return $this->mergeSchemaField($field, $result->toArray());
    }

    protected function addFieldInfo($collection, $field, array $data)
    {
        $defaults = [
            'collection' => $collection,
            'field' => $field,
            'type' => null,
            'interface' => null,
            'required' => false,
            'sort' => 0,
            'note' => null,
            'hidden_detail' => 0,
            'hidden_browse' => 0,
            'options' => null,
        ];

        $data = array_merge($defaults, $data, [
            'collection' => $collection,
            'field' => $field,
        ]);


        // Get the Directus based on the source type
        if (ArrayUtils::get($data, 'type') === null) {
            $fieldObject = $this->getSchemaManager()->getField($collection, $field);

            if ($fieldObject) {
                $data['type'] = $this->getSchemaManager()->getSource()->getTypeFromSource($fieldObject->getDataType());
            }
        }

        $collectionObject = $this->getSchemaManager()->getCollection('directus_fields');

        return $this->getFieldsTableGateway()->createRecord(
            ArrayUtils::pick($data, $collectionObject->getFieldsName())
        );
    }

    protected function updateFieldInfo($id, array $data)
    {
        ArrayUtils::remove($data, ['collection', 'field']);
        $data['id'] = $id;

        $collectionObject = $this->getSchemaManager()->getCollection('directus_fields');

        return $this->getFieldsTableGateway()->manageRecordUpdate(
            'directus_fields',
            ArrayUtils::pick($data, $collectionObject->getFieldsName())
        );
    }

    /**
     * @param $collectionName
     * @param $fieldName
     *
     * @return int
     */
    public function removeColumnInfo($collectionName, $fieldName)
    {
        $fieldsTableGateway = $this->getFieldsTableGateway();

        return $fieldsTableGateway->delete([
            'collection' => $collectionName,
            'field' => $fieldName,
        ]);
    }

    /**
     * Removes the relationship of a given field
     *
     * @param Field $field
     *
     * @return bool|int
     */
    public function removeColumnRelationship(Field $field, array $params = [])
    {
        if (!$field->hasRelationship()) {
            return false;
        }

        if ($this->shouldRemoveRelationshipRecord($field)) {
            $result = $this->removeRelationshipRecord($field);
        } else {
            $result = $this->removeRelationshipFromRecord($field, $params);
        }

        return $result;
    }

    /**
     * Checks whether or not the relationship record should be removed
     *
     * @param Field $field
     *
     * @return bool
     */
    protected function shouldRemoveRelationshipRecord(Field $field)
    {
        $relationship = $field->getRelationship();

        return ($field->getName() === $relationship->getFieldMany());
    }

    /**
     * Removes the relationship record of a given field
     *
     * @param Field $field
     *
     * @return int
     */
    protected function removeRelationshipRecord(Field $field)
    {
        $tableGateway = $this->getRelationsTableGateway();
        $conditions = $this->getRemoveRelationshipConditions($field);
        return $tableGateway->delete($conditions['values']);
    }

    /**
     * Removes the relationship data of a given field
     *
     * @param Field $field
     *
     * @return int
     */
    protected function removeRelationshipFromRecord(Field $field, array $params = [])
    {
        $tableGateway = $this->getRelationsTableGateway();

        $relationship = $field->getRelationship();

        /**
         * Remove the junction fields
         */
        $junctionConditions = [
            'junction_field' => $relationship->getFieldMany(),
            'collection_many' => $relationship->getCollectionMany(),
        ];
        $junctionEntries = $tableGateway->getItems(['filter' => $junctionConditions]);
        $conditions = $this->getRemoveRelationshipConditions($field);

        $data = [
            $conditions['field'] => null,
        ];

        /**
         * Delete the junction entries(For M2M) and update the values for (O2M)
         */
        if (!empty($junctionEntries['data'])) {
            $tableGateway->delete($junctionConditions);

            if (isset($params['delete_junction'])) {
                $this->dropTable($relationship->getCollectionMany());
            }

            return $tableGateway->delete($conditions['values']);
        } else {
            return $tableGateway->update($data, $conditions['values']);
        }
    }

    /**
     * Returns the conditions values to remove a given field relationship
     *
     * @param Field $field
     *
     * @return array
     */
    protected function getRemoveRelationshipConditions(Field $field)
    {
        $fieldName = $field->getName();
        $collectionName = $field->getCollectionName();
        $fieldAttr = 'field_';
        $collectionAttr = 'collection_';

        $suffix = $this->getRelationshipAttributeSuffix($field);
        $collectionAttr .= $suffix;
        $fieldAttr .= $suffix;

        return [
            'field' => $fieldAttr,
            'collection' => $collectionAttr,
            'values' => [
                $collectionAttr => $collectionName,
                $fieldAttr => $fieldName,
            ],
        ];
    }

    /**
     * Returns the relationship attribute suffix
     *
     * @param Field $field
     *
     * @return string
     */
    protected function getRelationshipAttributeSuffix(Field $field)
    {
        if ($field->getName() === $field->getRelationship()->getFieldOne()) {
            $suffix = 'one';
        } else {
            $suffix = 'many';
        }

        return $suffix;
    }

    /**
     * @param $collectionName
     * @param $fieldName
     *
     * @return bool
     */
    protected function dropColumnSchema($collectionName, $fieldName)
    {
        /** @var SchemaFactory $schemaFactory */
        $schemaFactory = $this->container->get('schema_factory');
        $table = $schemaFactory->alterTable($collectionName, [
            'drop' => [
                $fieldName,
            ],
        ]);

        return $schemaFactory->buildTable($table) ? true : false;
    }

    /**
     * Drops the given table and its table and columns information
     *
     * @param $name
     *
     * @return bool
     *
     * @throws CollectionNotFoundException
     */
    public function dropTable($name)
    {
        if (!$this->getSchemaManager()->collectionExists($name)) {
            throw new CollectionNotFoundException($name);
        }

        $tableGateway = $this->createTableGateway($name);

        return $tableGateway->drop();
    }

    /**
     * Checks whether the given name is a valid clean collection name
     *
     * @param string $name
     *
     * @return bool
     */
    public function isValidCollectionName($name)
    {
        $isTableNameAlphanumeric = preg_match("/[a-z0-9]+/i", $name);
        $zeroOrMoreUnderscoresDashes = preg_match("/[_-]*/i", $name);

        return $isTableNameAlphanumeric && $zeroOrMoreUnderscoresDashes;
    }

    /**
     * Throws an exception when the collection name is invalid
     *
     * @param string $name
     *
     * @throws InvalidRequestException
     */
    public function enforceValidCollectionName($name)
    {
        if (!$this->isValidCollectionName($name)) {
            throw new InvalidRequestException('Invalid collection name');
        }

        if (StringUtils::startsWith($name, 'directus_')) {
            throw new InvalidRequestException('Collection name cannot begin with "directus_"');
        }
    }

    /**
     * Gets the table object representation
     *
     * @param $tableName
     *
     * @return \Directus\Database\Object\Collection
     */
    public function getTableObject($tableName)
    {
        return SchemaService::getCollection($tableName);
    }

    /**
     * Checks that at least one of the fields has primary_key set to true.
     *
     * @param array $fields
     *
     * @return bool
     */
    public function hasPrimaryField(array $fields)
    {
        return $this->hasFieldAttributeWith($fields, 'primary_key', true, null, 1);
    }

    /**
     * Checks that a maximum of 1 field has the primary_key field set to true. This will succeed if there are 0
     * or 1 fields set as the primary key.
     *
     * @param array $fields
     *
     * @return bool
     */
    public function hasUniquePrimaryField(array $fields)
    {
        return $this->hasFieldAttributeWith($fields, 'primary_key', true);
    }

    /**
     * Checks that at most one of the fields has auto_increment set to true
     *
     * @param array $fields
     *
     * @return bool
     */
    public function hasUniqueAutoIncrementField(array $fields)
    {
        return $this->hasFieldAttributeWith($fields, 'auto_increment', true);
    }

    /**
     * Checks that all fields name are unique
     *
     * @param array $fields
     *
     * @return bool
     */
    public function hasUniqueFieldsName(array $fields)
    {
        $fieldsName = [];
        $unique = true;

        foreach ($fields as $field) {
            $fieldName = ArrayUtils::get($field, 'field');
            if (in_array($fieldName, $fieldsName)) {
                $unique = false;
                break;
            }

            $fieldsName[] = $fieldName;
        }

        return $unique;
    }

    /**
     * Checks that a set of fields has at least $min and at most $max attribute with the value of $value
     *
     * @param array $fields
     * @param string  $attribute
     * @param mixed $value
     * @param int $max
     * @param int $min
     *
     * @return bool
     */
    protected function hasFieldAttributeWith(array $fields, $attribute, $value, $max = 1, $min = 0)
    {
        $count = 0;
        $result = false;

        foreach ($fields as $field) {
            // use equal operator instead of identical
            // to avoid true == 1 or false == 0 comparison
            if (ArrayUtils::get($field, $attribute) == $value) {
                $count++;
            }
        }

        $ignoreMax = is_null($max);
        $ignoreMin = is_null($min);

        if ($ignoreMax && $ignoreMin) {
            $result = $count >= 1;
        } else if ($ignoreMax) {
            $result = $count >= $min;
        } else if ($ignoreMin) {
            $result = $count <= $max;
        } else {
            $result = $count >= $min && $count <= $max;
        }

        return $result;
    }

    /**
     * @param string $name
     * @param array $data
     *
     * @return bool
     */
    protected function createTableSchema($name, array $data)
    {
        /** @var SchemaFactory $schemaFactory */
        $schemaFactory = $this->container->get('schema_factory');

        $columns = ArrayUtils::get($data, 'fields', []);
        $this->validateSystemFields($columns);
        $table = $schemaFactory->createTable($name, $columns);

        /** @var Emitter $hookEmitter */
        $hookEmitter = $this->container->get('hook_emitter');
        $hookEmitter->run('collection.create:before', $name);
        $charset = $this->container->get('config')->get('database.charset');
        $result = $schemaFactory->buildTable($table, $charset);

        return $result ? true : false;
    }

    /**
     * @param Collection $collection
     * @param array $data
     *
     * @return bool
     */
    protected function updateTableSchema(Collection $collection, array $data)
    {
        /** @var SchemaFactory $schemaFactory */
        $schemaFactory = $this->container->get('schema_factory');
        $name = $collection->getName();

        $fields = ArrayUtils::get($data, 'fields', []);
        $this->validateSystemFields($fields);

        /** @var Emitter $hookEmitter */
        $hookEmitter = $this->container->get('hook_emitter');
        $hookEmitter->run('collection.update:before', [$name, $data]);

        $toAdd = $toChange = $toDrop = [];

        foreach ($fields as $fieldData) {
            $field = $collection->getField($fieldData['field']);

            if ($field) {
                $fullFieldData = array_merge($field->toArray(), $fieldData);
                // NOTE: To avoid the table builder to add another primary or unique key constraint
                //       the primary_key and unique flag should be remove if the field already has primary or unique key
                if ($field->hasPrimaryKey() && $fullFieldData['primary_key'] === true) {
                    unset($fullFieldData['primary_key']);
                }

                if ($field->hasUniqueKey() && $fullFieldData['unique'] === true) {
                    unset($fullFieldData['unique']);
                }

                $dataType = ArrayUtils::get($fullFieldData, 'datatype');
                if ($dataType && !$this->getSchemaManager()->isTypeLengthRequired($dataType)) {
                    unset($fullFieldData['length']);
                }

                if (!$field->isAlias() && DataTypes::isAliasType(ArrayUtils::get($fieldData, 'type'))) {
                    $toDrop[] = $field->getName();
                } else if ($field->isAlias() && !DataTypes::isAliasType(ArrayUtils::get($fieldData, 'type'))) {
                    $toAdd[] = $fullFieldData;
                } else {
                    $toChange[] = $fullFieldData;
                }
            } else {
                $toAdd[] = $fieldData;
            }
        }


        $table = $schemaFactory->alterTable($name, [
            'add' => $toAdd,
            'change' => $toChange,
            'drop' => $toDrop,
        ]);

        $result = $schemaFactory->buildTable($table);

        $this->updateColumnsRelation($name, array_merge($toAdd, $toChange));

        $hookEmitter->run('collection.update', [$name, $data]);
        $hookEmitter->run('collection.update:after', [$name, $data]);

        return $result ? true : false;
    }

    protected function updateColumnsRelation($collectionName, array $columns)
    {
        $result = [];
        foreach ($columns as $column) {
            $result[] = $this->updateColumnRelation($collectionName, $column);
        }

        return $result;
    }

    protected function updateColumnRelation($collectionName, array $column)
    {
        $relationData = ArrayUtils::get($column, 'relation', []);
        if (!$relationData) {
            return false;
        }

        $relationshipType = ArrayUtils::get($relationData, 'relationship_type', '');
        $collectionBName = ArrayUtils::get($relationData, 'collection_one');
        $collectionBObject = $this->getSchemaManager()->getCollection($collectionBName);
        $relationsTableGateway = $this->createTableGateway('directus_relations');

        $data = [];
        switch ($relationshipType) {
            case FieldRelationship::MANY_TO_ONE:
                $data['relationship_type'] = FieldRelationship::MANY_TO_ONE;
                $data['collection_many'] = $collectionName;
                $data['collection_one'] = $collectionBName;
                $data['store_key_a'] = $column['field'];
                $data['store_key_b'] = $collectionBObject->getPrimaryKeyName();
                break;
            case FieldRelationship::ONE_TO_MANY:
                $data['relationship_type'] = FieldRelationship::ONE_TO_MANY;
                $data['collection_many'] = $collectionName;
                $data['collection_one'] = $collectionBName;
                $data['store_key_a'] = $collectionBObject->getPrimaryKeyName();
                $data['store_key_b'] = $column['field'];
                break;
        }

        $row = $relationsTableGateway->findOneByArray([
            'collection_many' => $collectionName,
            'store_key_a' => $column['field'],
        ]);

        if ($row) {
            $data['id'] = $row['id'];
        }

        return $relationsTableGateway->manageRecordUpdate('directus_relations', $data);
    }

    /**
     * Validates the collection payload
     *
     * @param string $name
     * @param array $data
     * @param array|null $fields
     * @param boolean $update
     * @param array $params
     *
     * @throws InvalidRequestException
     */
    protected function validateCollectionPayload($name, array $data, array $fields = null, $update = false, array $params = [])
    {
        $this->enforceValidCollectionName($name);

        $collectionsCollectionName = 'directus_collections';
        $this->validatePayload($collectionsCollectionName, $fields, $data, $params);

        if (ArrayUtils::has($data, 'fields') || !$update) {
            $this->validate($data, ['fields' => 'required|array']);
            $this->validateFieldsPayload($name, $data['fields'], $update, $params);
        }
    }

    /**
     * @param array $data
     * @param array|null $fields
     * @param array $params
     *
     * @throws UnprocessableEntityException
     */
    protected function validateFieldPayload(array $data, array $fields = null, array $params = [])
    {
        // TODO: Create new constraint that validates the column data type to be one of the list supported
        $this->validatePayload('directus_fields', $fields, $data, $params);

        $fieldName = ArrayUtils::get($data, 'field');
        $field = null;

        try {
            $collection = $this->getSchemaManager()->getCollection(ArrayUtils::get($data, 'collection'));
            $field = $collection->getField($fieldName);
        } catch (\Exception $e) {
            // do nothing
        }

        $type = ArrayUtils::get($data, 'type');
        $dataType = ArrayUtils::get($data, 'datatype');
        if ($type && !DataTypes::isAliasType($type) && !$dataType) {
            throw new UnprocessableEntityException(
                'datatype is required'
            );
        }

        $length = ArrayUtils::get($data, 'length');
        if ($dataType && $this->getSchemaManager()->isTypeLengthRequired($dataType) && !$length) {
            throw new FieldLengthRequiredException($fieldName);
        }

        $fieldDataType = $dataType;
        if ($field && !$fieldDataType) {
            $fieldDataType = $field->getDataType();
        }

        if ($length && !$this->getSchemaManager()->canTypeUseLength($fieldDataType)) {
            throw new FieldLengthNotSupportedException($fieldName);
        }

        if ($type && !DataTypes::exists($type)) {
            throw new UnknownTypeException($type);
        }
    }

    /**
     * @param string $collectionName
     * @param array $fieldsData
     * @param bool $update
     * @param array $params
     *
     * @throws UnprocessableEntityException
     */
    protected function validateFieldsPayload($collectionName, array $fieldsData, $update, array $params = [])
    {
        foreach ($fieldsData as $data) {
            $fieldsName = $update ? array_keys($data) : null;
            $data['collection'] = $collectionName;
            $this->validateFieldPayload($data, $fieldsName, $params);
        }
    }

    /**
     * @param array $columns
     *
     * @throws InvalidRequestException
     */
    protected function validateSystemFields(array $columns)
    {
        $found = [];

        foreach ($columns as $column) {
            $type = ArrayUtils::get($column, 'type');
            if ($this->getSchemaManager()->isUniqueFieldType($type)) {
                if (!isset($found[$type])) {
                    $found[$type] = 0;
                }

                $found[$type]++;
            }
        }

        $types = [];
        foreach ($found as $type => $count) {
            if ($count > 1) {
                $types[] = $type;
            }
        }

        if (!empty($types)) {
            throw new InvalidRequestException(
                'Only one system field permitted per table: ' . implode(', ', $types)
            );
        }
    }

    /**
     * @param array $columns
     *
     * @return array
     *
     * @throws InvalidRequestException
     */
    protected function parseColumns(array $columns)
    {
        $result = [];
        foreach ($columns as $column) {
            if (!isset($column['type']) || !isset($column['field'])) {
                throw new InvalidRequestException(
                    'All column requires a name and a type.'
                );
            }

            $result[$column['field']] = ArrayUtils::omit($column, 'field');
        }
    }

    /**
     * Merges a list of missing Schema Attributes into Directus Attributes
     *
     * @param array $collectionNames
     * @param array $collectionsData
     *
     * @return array
     */
    protected function mergeMissingSchemaCollections(array $collectionNames, array $collectionsData)
    {
        if (!ArrayUtils::isNumericKeys($collectionsData)) {
            return $this->mergeSchemaCollection($collectionNames[0], $collectionsData);
        }

        $collectionsDataNames = ArrayUtils::pluck($collectionsData, 'collection');
        $missingCollectionNames = ArrayUtils::missing($collectionsDataNames, $collectionNames);

        $collectionsData = $this->mergeSchemaCollections($collectionsData);

        foreach ($missingCollectionNames as $name) {
            try {
                $collectionsData[] = $this->mergeSchemaCollection($name, []);
            } catch (CollectionNotFoundException $e) {
                // if the collection doesn't exist don't bother with the exception
                // as this is a "filtering" result
                //  which means getting empty result is okay and expected
            }
        }

        return $collectionsData;
    }

    protected function mergeSchemaCollections(array $collectionsData)
    {
        $newCollectionsData = [];
        foreach ($collectionsData as $collectionData) {
            $newData = $this->mergeSchemaCollection($collectionData['collection'], $collectionData);

            // if null the actual table doesn't exist
            if ($newData) {
                $newCollectionsData[] = $newData;
            }
        }

        return $newCollectionsData;
    }

    /**
     * Merges a list of missing Schema Attributes into Directus Attributes
     *
     * @param Collection $collection
     * @param array $fieldsData
     * @param array $onlyFields
     *
     * @return array
     */
    protected function mergeMissingSchemaFields(Collection $collection, array $fieldsData, array $onlyFields = null)
    {
        $missingFieldsData = [];
        $fieldsName = ArrayUtils::pluck($fieldsData, 'field');

        $missingFields = $collection->getFieldsNotIn(
            $fieldsName
        );

        foreach ($fieldsData as $key => $fieldData) {
            $result = $this->mergeMissingSchemaField($collection, $fieldData);

            if ($result) {
                $fieldsData[$key] = $result;
            } else {
                // remove field data that doesn't have an actual column
                // except for alias-type fields
                unset($fieldsData[$key]);
            }
        }

        foreach ($missingFields as $missingField) {
            if (!is_array($onlyFields) || in_array($missingField->getName(), $onlyFields)) {
                $missingFieldsData[] = $this->mergeSchemaField($missingField);
            }
        }

        return array_merge($fieldsData, $missingFieldsData);
    }

    /**
     * Merges a Field data with an Field object
     *
     * @param Collection $collection
     * @param array $fieldData
     *
     * @return array
     */
    protected function mergeMissingSchemaField(Collection $collection, array $fieldData)
    {
        $field = $collection->getField(ArrayUtils::get($fieldData, 'field'));

        // if for some reason the field key doesn't exist
        // continue with everything as if nothing has happened
        if (!$field) {
            return null;
        }

        return $this->mergeSchemaField($field, $fieldData);
    }

    /**
     * Parses Schema Attributes into Directus Attributes
     *
     * @param Field $field
     * @param array $fieldData
     *
     * @return array
     */
    protected function mergeSchemaField(Field $field, array $fieldData = [])
    {
        $tableGateway = $this->getFieldsTableGateway();
        $attributeWhitelist = $this->unknownFieldsAllowed();

        $fieldsAttributes = array_merge($tableGateway->getTableSchema()->getFieldsName(), $attributeWhitelist);

        $data = ArrayUtils::pick(
            array_merge($field->toArray(), $fieldData),
            $fieldsAttributes
        );

        $result = $tableGateway->parseRecord($data);

        return $result;
    }

    /**
     * @inheritdoc
     */
    protected function unknownFieldsAllowed()
    {
        return [
            'datatype',
            'default_value',
            'auto_increment',
            'primary_key',
            'unique',
            'signed',
            'length',
        ];
    }

    /**
     * Parses Collection Schema Attributes into Directus Attributes
     *
     * @param string $collectionName
     * @param array $collectionData
     *
     * @return array
     */
    protected function mergeSchemaCollection($collectionName, array $collectionData)
    {
        try {
            /** @var SchemaManager $schemaManager */
            $schemaManager = $this->container->get('schema_manager');
            $collection = $schemaManager->getCollection($collectionName);
        } catch (CollectionNotFoundException $e) {
            $this->container->get('logger')->warning($e);

            return null;
        }

        $tableGateway = $this->getCollectionsTableGateway();
        $attributesName = $tableGateway->getTableSchema()->getFieldsName();

        $collectionData = array_merge(
            ArrayUtils::pick($collection->toArray(), $attributesName),
            $collectionData
        );

        // Casting values and filter all blacklisted fields
        if (ArrayUtils::has($collectionData, 'fields')) {
            $collectionData['fields'] = $this->mergeMissingSchemaFields($collection, $collectionData['fields']);
        }

        $collectionData['translation'] = ArrayUtils::get($collectionData, 'translation');
        $collectionData['icon'] = ArrayUtils::get($collectionData, 'icon');

        return $tableGateway->parseRecord($collectionData);
    }

    /**
     * @return RelationalTableGateway
     */
    protected function getFieldsTableGateway()
    {
        if (!$this->fieldsTableGateway) {
            $this->fieldsTableGateway = $this->createTableGateway(SchemaManager::COLLECTION_FIELDS);
        }

        return $this->fieldsTableGateway;
    }

    /**
     * @return RelationalTableGateway
     */
    protected function getCollectionsTableGateway()
    {
        if (!$this->collectionsTableGateway) {
            $this->collectionsTableGateway = $this->createTableGateway(SchemaManager::COLLECTION_COLLECTIONS);
        }

        return $this->collectionsTableGateway;
    }

    /**
     * @return RelationalTableGateway
     */
    protected function getRelationsTableGateway()
    {
        if (!$this->relationsTableGateway) {
            $this->relationsTableGateway = $this->createTableGateway(SchemaManager::COLLECTION_RELATIONS);
        }

        return $this->relationsTableGateway;
    }

    protected function getAllFieldsParams(array $params)
    {
        $newParams = [];
        $sort = ArrayUtils::get($params, 'sort');
        if ($sort && !is_array($sort)) {
            $sort = StringUtils::csv((string) $sort);
        }

        if ($sort) {
            $collection = $this->getSchemaManager()->getCollection(SchemaManager::COLLECTION_FIELDS);

            foreach ($sort as $field) {
                $field = (string) $field;
                if (!$collection->hasField($field)) {
                    throw new InvalidFieldException($field, $collection->getName());
                }
            }
        }

        if ($sort) {
            $newParams['sort'] = $sort;
        }

        if (ArrayUtils::has($params, 'limit')) {
            $newParams['limit'] = (int) ArrayUtils::get($params, 'limit');
        }

        return $newParams;
    }

    public function getFieldObject($collection, $field)
    {
        $collectionObject = $this->getSchemaManager()->getCollection($collection);
        $fieldObject = $collectionObject->getField($field);
        return $fieldObject;
    }
}
