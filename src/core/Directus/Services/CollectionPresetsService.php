<?php

namespace Directus\Services;

use Directus\Application\Container;
use Directus\Database\Schema\SchemaManager;
use Directus\Exception\ForbiddenException;
use Directus\Util\ArrayUtils;
use Zend\Db\Sql\Delete;

class CollectionPresetsService extends AbstractService
{
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

        $this->collection = SchemaManager::COLLECTION_COLLECTION_PRESETS;
        $this->itemsService = new ItemsService($this->container);
    }

    public function findAll(array $params = [])
    {
        return $this->itemsService->findAll($this->collection, $params);
    }

    public function createItem(array $payload, array $params = [])
    {
        // NOTE: Collections Presets should not record activity (https://github.com/directus/api/issues/271)
        return $this->itemsService->createItem(
            $this->collection,
            $payload,
            array_merge($params, ['activity_skip' => 1])
        );
    }

    public function find($id, array $params = [])
    {
        return $this->itemsService->find($this->collection, $id, $params);
    }

    public function findByIds($id, array $params = [])
    {
        return $this->itemsService->find($this->collection, $id, $params);
    }

    public function update($id, array $payload, array $params = [])
    {
        return $this->itemsService->update(
            $this->collection,
            $id,
            $payload,
            array_merge($params, ['activity_skip' => 1])
        );
    }

    public function delete($id, array $params = [])
    {
        $params = array_merge($params, ['activity_skip' => 1]);
        $this->enforcePermissions($this->collection, [], $params);
        $tableGateway = $this->createTableGateway($this->collection);

        // hotfix: enforce delete permission before checking for the item existence
        // this avoids an indirect reveal of an item the user is not allowed to see
        $delete = new Delete($this->collection);
        $delete->where([
            'id' => $id
        ]);
        $tableGateway->enforceDeletePermission($delete);

        $item = $this->createTableGateway($this->collection, false)->find($id);
        if ($item && ArrayUtils::get($item, 'role') && !$this->getAcl()->isAdmin()) {
            throw new ForbiddenException('Cannot delete collection presets that belongs to a role');
        }

        $tableGateway->deleteRecord($id, $this->getCRUDParams($params));

        return true;
    }
}
