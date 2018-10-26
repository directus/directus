<?php

namespace Directus\Services;

use Directus\Application\Container;
use Directus\Database\Schema\SchemaManager;
use Directus\Util\ArrayUtils;

class PermissionsService extends AbstractService
{
    /**
     * @var string
     */
    protected $collection;

    protected $itemsService;

    public function __construct(Container $container)
    {
        parent::__construct($container);
        $this->collection = SchemaManager::COLLECTION_PERMISSIONS;
        $this->itemsService = new ItemsService($container);
    }

    /**
     * @param array $data
     * @param array $params
     *
     * @return array
     */
    public function create(array $data, array $params = [])
    {
        $this->enforceCreatePermissions($this->collection, $data, $params);
        $this->validatePayload($this->collection, null, $data, $params);

        $tableGateway = $this->getTableGateway();
        $newGroup = $tableGateway->createRecord($data, $this->getCRUDParams($params));

        return $tableGateway->wrapData(
            $newGroup->toArray(),
            true,
            ArrayUtils::get($params, 'meta')
        );
    }

    /**
     * @param array $data
     * @param array $params
     *
     * @return array
     */
    public function batchCreate(array $data, array $params = [])
    {
        return $this->itemsService->batchCreate($this->collection, $data, $params);
    }

    public function find($id, array $params = [])
    {
        $params['id'] = $id;

        return $this->getItemsAndSetResponseCacheTags($this->getTableGateway(), $params);
    }

    public function findByIds($id, array $params = [])
    {
        return $this->getItemsByIdsAndSetResponseCacheTags($this->getTableGateway(), $id, $params);
    }

    public function update($id, array $data, array $params = [])
    {
        $this->enforceUpdatePermissions($this->collection, $data, $params);
        $this->validatePayload($this->collection, array_keys($data), $data, $params);
        $this->checkItemExists($this->collection, $id);

        $tableGateway = $this->getTableGateway();
        $newGroup = $tableGateway->updateRecord($id, $data, $this->getCRUDParams($params));

        return $tableGateway->wrapData(
            $newGroup->toArray(),
            true,
            ArrayUtils::get($params, 'meta')
        );
    }

    /**
     * @param array $items
     * @param array $params
     *
     * @return mixed
     */
    public function batchUpdate(array $items, array $params = [])
    {
        return $this->itemsService->batchUpdate($this->collection, $items, $params);
    }

    /**
     * @param array $ids
     * @param array $data
     * @param array $params
     *
     * @return array
     */
    public function batchUpdateWithIds(array $ids, array $data, array $params = [])
    {
        return $this->itemsService->batchUpdateWithIds($this->collection, $ids, $data, $params);
    }

    public function delete($id, array $params = [])
    {
        $this->enforcePermissions($this->collection, [], $params);
        $this->validate(['id' => $id], $this->createConstraintFor($this->collection, ['id']));
        $tableGateway = $this->getTableGateway();
        $this->getItemsAndSetResponseCacheTags($tableGateway, [
            'id' => $id
        ]);

        $tableGateway->deleteRecord($id, $this->getCRUDParams($params));

        return true;
    }

    /**
     * @param array $ids
     * @param array $params
     *
     * @return void
     */
    public function batchDeleteWithIds(array $ids, array $params = [])
    {
        $this->itemsService->batchDeleteWithIds($this->collection, $ids, $params);
    }

    public function findAll(array $params = [])
    {
        return $this->getItemsAndSetResponseCacheTags($this->getTableGateway(), $params);
    }

    /**
     * @return array
     */
    public function getUserPermissions()
    {
        $acl = $this->container->get('acl');

        return [
            'data' => $acl->getAllPermissions()
        ];
    }

    /**
     * @param string $collectionName
     *
     * @return array
     */
    public function getUserCollectionPermissions($collectionName)
    {
        $acl = $this->container->get('acl');
        $permissions = $acl->getCollectionPermissions($collectionName);

        if ($acl->hasWorkflowEnabled($collectionName)) {
            $permissions = array_values($permissions);
        }

        return [
            'data' => $permissions
        ];
    }

    /**
     * @return \Directus\Database\TableGateway\RelationalTableGateway
     */
    protected function getTableGateway()
    {
        return $this->createTableGateway($this->collection);
    }
}
