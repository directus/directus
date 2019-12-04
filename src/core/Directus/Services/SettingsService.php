<?php

namespace Directus\Services;

use Directus\Application\Container;
use function Directus\get_directus_setting;
use Directus\Database\Schema\SchemaManager;
use Directus\Exception\UnprocessableEntityException;

class SettingsService extends AbstractService
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

        $this->collection = SchemaManager::COLLECTION_SETTINGS;
        $this->itemsService = new ItemsService($this->container);
    }

    public function create(array $data, array $params = [])
    {
        return $this->itemsService->createItem($this->collection, $data, $params);
    }

    public function find($id, array $params = [])
    {
        return $this->itemsService->find($this->collection, $id, $params);
    }

    public function findByIds($id, array $params = [])
    {
        return $this->itemsService->findByIds($this->collection, $id, $params);
    }

    public function update($id, array $data, array $params = [])
    {
        return $this->itemsService->update($this->collection, $id, $data, $params);
    }

    public function delete($id, array $params = [])
    {
        return $this->itemsService->delete($this->collection, $id, $params);
    }

    public function findAll(array $params = [])
    {
        return $this->itemsService->findAll($this->collection, $params);
    }

    public function findFile($id, array $params = [])
    {
        $noAcl = false;
        return $this->itemsService->findByIds(SchemaManager::COLLECTION_FILES, $id, $params, $noAcl);
    }

    public function findAllFields(array $params = [])
    {
        return $this->itemsService->findAll(SchemaManager::COLLECTION_FIELDS, array_merge($params, [
            'filter' => [
                'collection' => $this->collection,
            ],
        ]));
    }

    public function batchCreate(array $payload, array $params = [])
    {
        return $this->itemsService->batchCreate($this->collection, $payload, $params);
    }

    public function batchUpdate(array $payload, array $params = [])
    {
        return $this->itemsService->batchUpdate($this->collection, $payload, $params);
    }

    public function batchDeleteWithIds(array $ids, array $params = [])
    {
        return $this->itemsService->batchDeleteWithIds($this->collection, $ids, $params);
    }
}
