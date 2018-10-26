<?php

namespace Directus\Services;

use Directus\Application\Container;
use Directus\Database\Schema\SchemaManager;

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
        return $this->itemsService->delete(
            $this->collection,
            $id,
            array_merge($params, ['activity_skip' => 1])
        );
    }
}
