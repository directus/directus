<?php

namespace Directus\Services;

use Directus\Database\Exception\ItemNotFoundException;
use Directus\Database\RowGateway\BaseRowGateway;
use Directus\Database\Schema\SchemaManager;
use Directus\Exception\ForbiddenException;
use Directus\Permissions\Exception\ForbiddenCollectionReadException;
use Directus\Util\ArrayUtils;
use Directus\Util\StringUtils;
use Directus\Validator\Exception\InvalidRequestException;
use Zend\Db\TableGateway\TableGateway;
use Directus\Database\SchemaService;

class ItemsService extends AbstractService
{
    const SINGLE_ITEM_PARAMS_BLACKLIST = [
        'filter',
        'q',
        'status'
    ];

    public function createItem($collection, $payload, $params = [])
    {
        $this->enforceCreatePermissions($collection, $payload, $params);
        $this->validatePayload($collection, null, $payload, $params);
        
        //Validate nested payload
        $tableSchema = SchemaService::getCollection($collection);
        $collectionAliasColumns = $tableSchema->getAliasFields();
        
        foreach ($collectionAliasColumns as $aliasColumnDetails) {
            $colName = $aliasColumnDetails->getName();
            $relationalCollectionName = "";
            
            if($this->isManyToManyField($aliasColumnDetails)){
                $relationalCollectionName = $aliasColumnDetails->getRelationship()->getCollectionManyToMany();
                
                if($relationalCollectionName && isset($payload[$colName])){
                    foreach($payload[$colName] as $individual){     
                        if(!isset($individual['$delete'])){                        
                            $validatePayload = $individual[$aliasColumnDetails->getRelationship()->getJunctionOtherRelatedField()];
                            $this->validatePayload($relationalCollectionName, null, $validatePayload,$params);
                        }
                    }
                }                
            }else{
                if($aliasColumnDetails->isOneToMany()){
                    $relationalCollectionName = $aliasColumnDetails->getRelationship()->getCollectionMany();
                }else if($aliasColumnDetails->isManyToOne()){
                    $relationalCollectionName = $aliasColumnDetails->getRelationship()->getCollectionOne();
                }
                if($relationalCollectionName && isset($payload[$colName])){
                    foreach($payload[$colName] as $individual){     
                        if(!isset($individual['$delete'])){                        
                            $this->validatePayload($relationalCollectionName, null, $individual,$params,$collection);
                        }
                    }
                }
            }            
        }
        
        $tableGateway = $this->createTableGateway($collection);
        $newRecord = $tableGateway->createRecord($payload, $this->getCRUDParams($params));

        try {
            $item = $this->find(
                $collection,
                $newRecord->getId(),
                ArrayUtils::omit($params, static::SINGLE_ITEM_PARAMS_BLACKLIST)
            );
        } catch (\Exception $e) {
            $item = null;
        }

        return $item;
    }

    /**
     * Finds all items in a collection limited by a limit configuration
     *
     * @param $collection
     * @param array $params
     *
     * @return array
     */
    public function findAll($collection, array $params = [])
    {
        // TODO: Use repository instead of TableGateway
        return $this->getItemsAndSetResponseCacheTags(
            $this->createTableGateway($collection),
            $params
        );
    }

    /**
     * Gets a single item in the given collection and id
     *
     * @param string $collection
     * @param mixed $id
     * @param array $params
     *
     * @return array
     */
    public function find($collection, $id, array $params = [])
    {
        $statusValue = $this->getStatusValue($collection, $id);
        $tableGateway = $this->createTableGateway($collection);

        $this->getAcl()->enforceRead($collection, $statusValue);

        return $this->getItemsByIdsAndSetResponseCacheTags($tableGateway, $id, array_merge($params, [
            'status' => null
        ]));
    }

    /**
     * Gets a single item in the given collection and id
     *
     * @param string $collection
     * @param mixed $ids
     * @param array $params
     * @params bool $acl default true
     *
     * @return array
     *
     * @throws ItemNotFoundException
     * @throws ForbiddenCollectionReadException
     */
    public function findByIds($collection, $ids, array $params = [], $acl = true)
    {
        $params = ArrayUtils::omit($params, static::SINGLE_ITEM_PARAMS_BLACKLIST);

        $statusValue = $this->getStatusValue($collection, $ids);
        $tableGateway = $this->createTableGateway($collection, $acl);
        $ids = StringUtils::safeCvs($ids, false, false);

        try {
            // if acl check is disabled (e.g. fetching the logo from the settings endpoint/service) do not
            // enforce permissions here!
            if (false !== $acl) {
                $this->getAcl()->enforceRead($collection, $statusValue);
            }
        } catch (ForbiddenCollectionReadException $e) {
            if (is_array($ids) && count($ids) > 1) {
                throw $e;
            } else {
                throw new ItemNotFoundException();
            }
        }

        return $this->getItemsByIdsAndSetResponseCacheTags($tableGateway, $ids, array_merge($params, [
            'status' => null
        ]));
    }

    /**
     * Gets a single item in the given collection that matches the conditions
     *
     * @param string $collection
     * @param array $params
     *
     * @return array
     */
    public function findOne($collection, array $params = [])
    {
        $tableGateway = $this->createTableGateway($collection);

        return $this->getItemsAndSetResponseCacheTags($tableGateway, array_merge($params, [
            'single' => true
        ]));
    }
    
    /**
     * Validate Parent Collection Fields
     */
    public function validateParentCollectionFields($collection, $payload, $params, $recordData){
        $tableColumns = SchemaService::getAllCollectionFields($collection);
        $collectionFields = $payload;
        
        foreach($tableColumns as $key => $column){
            if(!empty($recordData)  && !$column->hasPrimaryKey()){
                $columnName = $column->getName(); 
                $collectionFields[$columnName] = isset($collectionFields[$column->getName()]) ? $collectionFields[$column->getName()]: $recordData[$columnName];
            }
        }
        
        $this->validatePayload($collection, null,  $collectionFields, $params);
    }
    
    /**
     * Validate Many To Many Collection Fields
     */
    public function validateManyToManyCollection($payload, $params, $aliasColumnDetails, $recordData){
        $colName = $aliasColumnDetails->getName();
        $relationalCollectionName = $aliasColumnDetails->getRelationship()->getCollectionManyToMany();
        if($relationalCollectionName && isset($payload[$colName])){
            $relationalCollectionPrimaryKey = SchemaService::getCollectionPrimaryKey($relationalCollectionName);
            $relationalCollectionColumns = SchemaService::getAllCollectionFields($relationalCollectionName);

            foreach($payload[$colName] as $individual){     
                if(!isset($individual['$delete'])){ 
                    $aliasField = $aliasColumnDetails->getRelationship()->getJunctionOtherRelatedField();
                    $validatePayload = $individual[$aliasField];
                    $storedData = (!empty($recordData) && isset($recordData[$colName])) ? $recordData[$colName] : [] ;
                    
                    foreach($relationalCollectionColumns as $column){
                        if(!empty($recordData) && !$column->isAlias() && !$column->hasPrimaryKey() && isset($recordData[$colName])){
                            $search = array_search($individual[$relationalCollectionPrimaryKey], array_column($storedData, $relationalCollectionPrimaryKey));
                            $columnName = $column->getName();
                            if($search !== false){
                                $dbObj = isset($storedData[$search][$aliasField]) ? $storedData[$search][$aliasField] : [];
                                $validatePayload[$columnName] = isset($validatePayload[$columnName]) ? $validatePayload[$columnName]: (isset($dbObj[$columnName]) ? $dbObj[$columnName] : null);
                            }else{
                                $relationalCollectionData = $this->findByIds(
                                    $relationalCollectionName,
                                    $validatePayload[$relationalCollectionPrimaryKey],
                                    $params
                                );
                                $validatePayload[$columnName] = isset($validatePayload[$columnName]) ? $validatePayload[$columnName]: (isset($relationalCollectionData['data'][$columnName]) ? $relationalCollectionData['data'][$columnName] : null);
                            }
                        }
                    }
                    $this->validatePayload($relationalCollectionName, null, $validatePayload,$params);
                }
            }
        }  
    }
    
    /**
     * Validate Alias Collection Fields (O2M and M2O - Including Translations and Files)
     */
    public function validateAliasCollection($payload, $params, $aliasColumnDetails, $recordData){
        $colName = $aliasColumnDetails->getName();
        $relationalCollectionName = "";
        if($aliasColumnDetails->isOneToMany()){
            $relationalCollectionName = $aliasColumnDetails->getRelationship()->getCollectionMany();
            $parentCollectionName = $aliasColumnDetails->getRelationship()->getCollectionOne();
        }else if($aliasColumnDetails->isManyToOne()){
            $relationalCollectionName = $aliasColumnDetails->getRelationship()->getCollectionOne();
            $parentCollectionName = $aliasColumnDetails->getRelationship()->getCollectionMany();
        }
        if($relationalCollectionName && isset($payload[$colName])){
            
            $relationalCollectionPrimaryKey = SchemaService::getCollectionPrimaryKey($relationalCollectionName);
            $parentCollectionPrimaryKey = SchemaService::getCollectionPrimaryKey($parentCollectionName);
            $relationalCollectionColumns = SchemaService::getAllCollectionFields($relationalCollectionName);
            $foreignJoinColumn = $aliasColumnDetails->getRelationship()->getFieldMany();
           
            foreach($payload[$colName] as $individual){     
                if(!isset($individual['$delete'])){ 
                    foreach($relationalCollectionColumns as $key => $column){
                        if(!empty($recordData) && !$column->isAlias() && !$column->hasPrimaryKey() && isset($recordData[$colName])){
                            $search = array_search($individual[$relationalCollectionPrimaryKey], array_column($recordData[$colName], $relationalCollectionPrimaryKey));
                            $columnName = $column->getName();
                            if($search !== false){
                                $individual[$columnName] = isset($individual[$columnName]) ? $individual[$columnName]: (isset($recordData[$colName][$search][$columnName]) ? $recordData[$colName][$search][$columnName] : null);
                            }else{
                                $relationalCollectionData = $this->findByIds(
                                    $relationalCollectionName,
                                    $individual[$relationalCollectionPrimaryKey],
                                    $params
                                );
                                $individual[$columnName] = isset($individual[$columnName]) ? $individual[$columnName]: (isset($relationalCollectionData['data'][$columnName]) ? $relationalCollectionData['data'][$columnName] : null);
                            }
                        }
                    }

                    // only add parent id's to items that are lacking the parent column
                    if (empty($individual[$foreignJoinColumn])) {
                        $individual[$foreignJoinColumn] = $recordData[$parentCollectionPrimaryKey];
                    }
                    $this->validatePayload($relationalCollectionName, null, $individual,$params);
                }
            }
        }
    }

    
    /**
     * Updates a single item in the given collection and id
     *
     * @param string $collection
     * @param mixed $id
     * @param array $payload
     * @param array $params
     *
     * @return array
     *
     * @throws ItemNotFoundException
     */
    public function update($collection, $id, $payload, array $params = [])
    {
        $this->enforceUpdatePermissions($collection, $payload, $params);
        $dbData = $this->findByIds($collection,$id,['fields' => '*.*.*']);
        $recordData = !empty($dbData['data']) ? $dbData['data'] : [];
        $this->validateParentCollectionFields($collection, $payload, $params, $recordData);
        
        //Validate alias field payload
        $tableSchema = SchemaService::getCollection($collection);
        $collectionAliasColumns = $tableSchema->getAliasFields();
        
        foreach ($collectionAliasColumns as $aliasColumnDetails) {
            if($this->isManyToManyField($aliasColumnDetails)){  
                $this->validateManyToManyCollection($payload, $params, $aliasColumnDetails, $recordData);          
            }else{
                $this->validateAliasCollection($payload, $params, $aliasColumnDetails, $recordData);          
            }            
        }
        
        $this->checkItemExists($collection, $id);

        $tableGateway = $this->createTableGateway($collection);

        // Fetch the entry even if it's not "published"
        $params['status'] = '*';
        $newRecord = $tableGateway->updateRecord($id, $payload, $this->getCRUDParams($params));

        try {
            $item = $this->find(
                $collection,
                $newRecord->getId(),
                ArrayUtils::omit($params, static::SINGLE_ITEM_PARAMS_BLACKLIST)
            );
        } catch (\Exception $e) {
            $item = null;
        }

        return $item;
    }

    public function delete($collection, $id, array $params = [])
    {
        $this->enforcePermissions($collection, [], $params);

        // TODO: Better way to check if the item exists
        // $item = $this->find($collection, $id);

        $tableGateway = $this->createTableGateway($collection);
        $tableGateway->deleteRecord($id, $this->getCRUDParams($params));

        return true;
    }

    /**
     * @param $collection
     * @param array $items
     * @param array $params
     *
     * @return array
     *
     * @throws InvalidRequestException
     */
    public function batchCreate($collection, array $items, array $params = [])
    {
        if (!isset($items[0]) || !is_array($items[0])) {
            throw new InvalidRequestException('batch create expect an array of items');
        }

        foreach ($items as $data) {
            $this->enforceCreatePermissions($collection, $data, $params);
            $this->validatePayload($collection, null, $data, $params);
        }

        $allItems = [];
        foreach ($items as $data) {
            $item = $this->createItem($collection, $data, $params);
            if (!is_null($item)) {
                $allItems[] = $item['data'];
            }
        }

        if (!empty($allItems)) {
            $allItems = ['data' => $allItems];
        }

        return $allItems;
    }

    /**
     * @param $collection
     * @param array $items
     * @param array $params
     *
     * @return array
     *
     * @throws InvalidRequestException
     */
    public function batchUpdate($collection, array $items, array $params = [])
    {
        if (!isset($items[0]) || !is_array($items[0])) {
            throw new InvalidRequestException('batch update expect an array of items');
        }

        foreach ($items as $data) {
            $this->enforceCreatePermissions($collection, $data, $params);
            $this->validatePayload($collection, array_keys($data), $data, $params);
            $this->validatePayloadHasPrimaryKey($collection, $data);
        }

        $collectionObject = $this->getSchemaManager()->getCollection($collection);
        $allItems = [];
        foreach ($items as $data) {
            $id = $data[$collectionObject->getPrimaryKeyName()];
            $item = $this->update($collection, $id, $data, $params);

            if (!is_null($item)) {
                $allItems[] = $item['data'];
            }
        }

        if (!empty($allItems)) {
            $allItems = ['data' => $allItems];
        }

        return $allItems;
    }

    /**
     * @param $collection
     * @param array $ids
     * @param array $payload
     * @param array $params
     *
     * @return array
     */
    public function batchUpdateWithIds($collection, array $ids, array $payload, array $params = [])
    {
        $this->enforceUpdatePermissions($collection, $payload, $params);
        $this->validatePayload($collection, array_keys($payload), $payload, $params);

        $allItems = [];
        foreach ($ids as $id) {
            $item = $this->update($collection, $id, $payload, $params);
            if (!empty($item)) {
                $allItems[] = $item['data'];
            }
        }

        if (!empty($allItems)) {
            $allItems = ['data' => $allItems];
        }

        return $allItems;
    }

    /**
     * @param $collection
     * @param array $ids
     * @param array $params
     *
     * @throws ForbiddenException
     */
    public function batchDeleteWithIds($collection, array $ids, array $params = [])
    {
        // TODO: Implement this into a hook
        if ($collection === SchemaManager::COLLECTION_ROLES) {
            $groupService = new RolesService($this->container);

            foreach ($ids as $id) {
                $group = $groupService->find($id);

                if ($group && !$groupService->canDelete($id)) {
                    throw new ForbiddenException(
                        sprintf('You are not allowed to delete group [%s]', $group->name)
                    );
                }
            }
        }

        foreach ($ids as $id) {
            $this->delete($collection, $id, $params);
        }
    }

    protected function getItem(BaseRowGateway $row)
    {
        $collection = $row->getCollection();
        $item = null;
        $statusValue = $this->getStatusValue($collection, $row->getId());
        $tableGateway = $this->createTableGateway($collection);

        if ($this->getAcl()->canRead($collection, $statusValue)) {
            $params['id'] = $row->getId();
            $params['status'] = null;
            $item = $this->getItemsAndSetResponseCacheTags($tableGateway, $params);
        }

        return $item;
    }

    protected function getStatusValue($collection, $id)
    {
        $collectionObject = $this->getSchemaManager()->getCollection($collection);

        if (!$collectionObject->hasStatusField()) {
            return null;
        }

        $primaryFieldName = $collectionObject->getPrimaryKeyName();
        $tableGateway = new TableGateway($collection, $this->getConnection());
        $select = $tableGateway->getSql()->select();
        $select->columns([$collectionObject->getStatusField()->getName()]);
        $select->where([
            $primaryFieldName => $id
        ]);

        $row = $tableGateway->selectWith($select)->current();

        return $row[$collectionObject->getStatusField()->getName()];
    }
    
    /**
     * Checks whether the relationship is MANY TO MANY
     * 
     * @param $fieldMany
     * @param $collectionMany
     *
     * @return bool
     */
    protected function isManyToManyField($field){
        if($field->hasRelationship() && $field->getRelationship()->isOneToMany()){
            $relationship = $field->getRelationship();
            $junctionConditions = [
                'junction_field' => $relationship->getFieldMany(),
                'collection_many' => $relationship->getCollectionMany(),
            ];
            $tableGateway = $this->createTableGateway(SchemaManager::COLLECTION_RELATIONS);
            $junctionEntries = $tableGateway->getItems(['filter' => $junctionConditions]);	
            return !empty($junctionEntries['data']) ? true : false;
        }
        return false;
    }
}
