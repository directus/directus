<?php

namespace Directus\Services;

use Directus\Application\Container;
use Directus\Database\Schema\SchemaManager;
use Directus\Util\ArrayUtils;
use Directus\Application\Application;

class FoldersService extends AbstractService
{
    /**
     * @var string
     */
    protected $collection;

    public function __construct(Container $container)
    {
        parent::__construct($container);
        $this->collection = SchemaManager::COLLECTION_FOLDERS;
    }

    public function createFolder(array $data, array $params = [])
    {
        $this->enforceCreatePermissions($this->collection, $data, $params);
        $this->validatePayload($this->collection, null, $data, $params);

        $foldersTableGateway = $this->createTableGateway($this->collection);

        $newFolder = $foldersTableGateway->createRecord($data, $this->getCRUDParams($params));

        return $foldersTableGateway->wrapData(
            $newFolder->toArray(),
            true,
            ArrayUtils::get($params, 'meta')
        );
    }

    public function findFolder($id, array $params = [])
    {
        $foldersTableGateway = $this->createTableGateway('directus_folders');
        $params['id'] = $id;

        return $this->getItemsAndSetResponseCacheTags($foldersTableGateway, $params);
    }

    public function findFolderByIds($id, array $params = [])
    {
        $foldersTableGateway = $this->createTableGateway('directus_folders');

        return $this->getItemsByIdsAndSetResponseCacheTags($foldersTableGateway, $id, $params);
    }

    public function updateFolder($id, array $data, array $params = [])
    {
        $this->enforceUpdatePermissions($this->collection, $data, $params);
        $this->checkItemExists($this->collection, $id);

        $foldersTableGateway = $this->createTableGateway('directus_folders');
        $group = $foldersTableGateway->updateRecord($id, $data, $this->getCRUDParams($params));

        return $foldersTableGateway->wrapData(
            $group->toArray(),
            true,
            ArrayUtils::get($params, 'meta')
        );
    }

    public function findAllFolders(array $params = [])
    {
        $foldersTableGateway = $this->createTableGateway('directus_folders');

        return $this->getItemsAndSetResponseCacheTags($foldersTableGateway, $params);
    }

    public function deleteFolder($id, array $params = [])
    {
        $this->enforcePermissions($this->collection, [], $params);

        $foldersTableGateway = $this->createTableGateway('directus_folders');
        // NOTE: check if item exists
        // TODO: As noted in other places make a light function to check for it
        $this->getItemsAndSetResponseCacheTags($foldersTableGateway, [
            'id' => $id
        ]);

        return $foldersTableGateway->deleteRecord($id, $this->getCRUDParams($params));
    }
}
