<?php
namespace Directus\Services;

use Directus\Database\TableGateway\RelationalTableGateway;
use Directus\Application\Container;
use Directus\Database\Schema\SchemaManager;
use Zend\Db\Sql\Delete;
use Directus\Util\ArrayUtils;
use Directus\Validator\Exception\InvalidRequestException;

class WebhookService extends AbstractService
{

    const HTTP_ACTION_GET = "get";
    const HTTP_ACTION_POST = "post";

    /**
     * @var string
     */
    protected $tableGateway;
    /**
     * @var string
     */
    protected $collection;
   
      /**
     * @var ItemsService
     */
    protected $itemsService;
    
    public function __construct(Container $container)
    {
        parent::__construct($container);
        $this->collection = SchemaManager::COLLECTION_WEBHOOKS;
        $this->itemsService = new ItemsService($this->container);
    }

    /**
     * @param array $params
     *
     * @return array
     */
    public function findAll(array $params = [],$acl = false)
    {
        return $this->getItemsAndSetResponseCacheTags($this->getTableGateway($acl), $params);
    }

    /**
     * @param array $data
     *
     * @return array
     */
    public function create(array $data, array $params = [])
    {
        return $this->itemsService->createItem($this->collection, $data, $params);
    }

    /**
     * @param $id
     * @param array $data
     *
     * @return array
     */
    public function update($id, array $payload, array $params = [])
    {
        $this->enforceUpdatePermissions($this->collection, $payload, $params);
        $this->validatePayload($this->collection, array_keys($payload), $payload, $params);

        $this->getTableGateway()->updateRecord($id, $payload, $this->getCRUDParams($params));
        
        try {
            $item = $this->find(
                $id,
                ArrayUtils::omit($params, $this->itemsService::SINGLE_ITEM_PARAMS_BLACKLIST)
            );
        } catch (\Exception $e) {
            $item = null;
        }

        return $item;
    }
   
    public function find($id, array $params = [])
    {
        return $this->itemsService->find(
            $this->collection,
            $id,
            $params
        );
    }
    
    public function findByIds($id, array $params = [])
    {
        return $this->itemsService->findByIds(
            $this->collection,
            $id,
            $params
        );
    }

    public function findOne(array $params = [])
    {
        return $this->itemsService->findOne(
            $this->collection,
            $params
        );
    }

    public function delete($id, array $params = [])
    {
        $this->enforcePermissions($this->collection, [], $params);
        $tableGateway = $this->getTableGateway();

        // hotfix: enforce delete permission before checking for the item existence
        // this avoids an indirect reveal of an item the user is not allowed to see
        $delete = new Delete($this->collection);
        $delete->where([
            'id' => $id
        ]);
        $tableGateway->enforceDeletePermission($delete);

        $tableGateway->deleteRecord($id, $this->getCRUDParams($params));

        return true;
    }
     /**
     * Gets the webhook table gateway
     *
     * @return RelationalTableGateway
     */
    public function getTableGateway($acl=true)
    {
        if (!$this->tableGateway) {
            $this->tableGateway = $this->createTableGateway($this->collection,$acl);
        }

        return $this->tableGateway;
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
    public function batchCreate(array $items, array $params = [])
    {
        if (!isset($items[0]) || !is_array($items[0])) {
            throw new InvalidRequestException('batch create expect an array of items');
        }

        foreach ($items as $data) {
            $this->enforceCreatePermissions($this->collection, $data, $params);
            $this->validatePayload($this->collection, null, $data, $params);
        }

        $allItems = [];
        foreach ($items as $data) {
            $item = $this->create($data, $params);
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
    public function batchUpdate(array $items, array $params = [])
    {
        if (!isset($items[0]) || !is_array($items[0])) {
            throw new InvalidRequestException('batch update expect an array of items');
        }

        foreach ($items as $data) {
            $this->enforceCreatePermissions($this->collection, $data, $params);
            $this->validatePayload($this->collection, array_keys($data), $data, $params);
            $this->validatePayloadHasPrimaryKey($this->collection, $data);
        }

        $collectionObject = $this->getSchemaManager()->getCollection($this->collection);
        $allItems = [];
        foreach ($items as $data) {
            $id = $data[$collectionObject->getPrimaryKeyName()];
            $item = $this->update($id, $data, $params);

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
    public function batchUpdateWithIds(array $ids, array $payload, array $params = [])
    {
        $this->enforceUpdatePermissions($this->collection, $payload, $params);
        $this->validatePayload($this->collection, array_keys($payload), $payload, $params);

        $allItems = [];
        foreach ($ids as $id) {
            $item = $this->update($id, $payload, $params);
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
    public function batchDeleteWithIds(array $ids, array $params = [])
    {
        foreach ($ids as $id) {
            $this->delete($id, $params);
        }
    }

}