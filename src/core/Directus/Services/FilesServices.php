<?php

namespace Directus\Services;

use Directus\Application\Container;
use Directus\Database\Schema\SchemaManager;
use Directus\Exception\BadRequestException;
use Directus\Exception\BatchUploadNotAllowedException;
use function Directus\is_a_url;
use function Directus\validate_file;
use function Directus\get_directus_setting;
use Directus\Util\ArrayUtils;
use Directus\Util\DateTimeUtils;
use Directus\Filesystem\Files;
use Directus\Validator\Exception\InvalidRequestException;

class FilesServices extends AbstractService
{
    /**
     * @var string
     */
    protected $collection;

    public function __construct(Container $container)
    {
        parent::__construct($container);
        $this->collection = SchemaManager::COLLECTION_FILES;
    }

    public function create(array $data, array $params = [])
    {
        $this->enforceCreatePermissions($this->collection, $data, $params);
        $tableGateway = $this->createTableGateway($this->collection);

        // These values are going to be set in a hook
        // These fields should be ignore on validation as these values are automatically filled
        // These values are set here to avoid validation
        // FIXME: These values shouldn't not be validated
        $data['uploaded_by'] = $this->getAcl()->getUserId();
        $data['uploaded_on'] = DateTimeUtils::now()->toString();

        $validationConstraints = $this->createConstraintFor($this->collection);
        // Do not validate filename when uploading files using URL
        // The filename will be generate automatically if not defined
        if (is_a_url(ArrayUtils::get($data, 'data'))) {
            unset($validationConstraints['filename']);
        }
        $this->validate($data, array_merge(['data' => 'required'], $validationConstraints));
        $files = $this->container->get('files');
        $result=$files->getFileSizeType($data['data']);

        if(get_directus_setting('file_mimetype_whitelist') != null){
            validate_file($result['mimeType'],'mimeTypes');
        }
        if(get_directus_setting('file_max_size') != null){
            validate_file($result['size'],'maxSize');
        }

        $newFile = $tableGateway->createRecord($data, $this->getCRUDParams($params));

        return $tableGateway->wrapData(
            \Directus\append_storage_information($newFile->toArray()),
            true,
            ArrayUtils::get($params, 'meta')
        );
    }

    public function find($id, array $params = [])
    {
        $tableGateway = $this->createTableGateway($this->collection);
        $params['id'] = $id;

        return $this->getItemsAndSetResponseCacheTags($tableGateway , $params);
    }

    public function findByIds($id, array $params = [])
    {
        $tableGateway = $this->createTableGateway($this->collection);

        return $this->getItemsByIdsAndSetResponseCacheTags($tableGateway , $id, $params);
    }

    public function update($id, array $data, array $params = [])
    {
        $this->enforceUpdatePermissions($this->collection, $data, $params);
        
        $this->checkItemExists($this->collection, $id);
        $this->validatePayload($this->collection, array_keys($data), $data, $params);

        $files = $this->container->get('files');
        $result=$files->getFileSizeType($data['data']);

        if(get_directus_setting('file_mimetype_whitelist') != null){
            validate_file($result['mimeType'],'mimeTypes');
        }
        if(get_directus_setting('file_max_size') != null){
            validate_file($result['size'],'maxSize');
        }
        
        $tableGateway = $this->createTableGateway($this->collection);
        $newFile = $tableGateway->updateRecord($id, $data, $this->getCRUDParams($params));

        return $tableGateway->wrapData(
            \Directus\append_storage_information($newFile->toArray()),
            true,
            ArrayUtils::get($params, 'meta')
        );
    }

    public function delete($id, array $params = [])
    {
        $this->enforcePermissions($this->collection, [], $params);
        $tableGateway = $this->createTableGateway($this->collection);
        $file = $tableGateway->getOneData($id);

        // Force delete files
        // TODO: Make the hook listen to deletes and catch ALL ids (from conditions)
        // and deletes every matched files
        /** @var \Directus\Filesystem\Files $files */
        $files = $this->container->get('files');
        $files->delete($file);

        // Delete file record
        return $tableGateway->deleteRecord($id);
    }

    public function findAll(array $params = [])
    {
        $tableGateway = $this->createTableGateway($this->collection);

        return $this->getItemsAndSetResponseCacheTags($tableGateway, $params);
    }

    public function createFolder(array $data, array $params = [])
    {
        $collection = 'directus_folders';
        $this->enforceCreatePermissions($collection, $data, $params);
        $this->validatePayload($collection, null, $data, $params);

        $foldersTableGateway = $this->createTableGateway($collection);

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
        $collectionName = 'directus_folders';
        $this->enforceUpdatePermissions($collectionName, $data, $params);
        $this->checkItemExists($collectionName, $id);

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
        $this->enforcePermissions('directus_folders', [], $params);

        $foldersTableGateway = $this->createTableGateway('directus_folders');
        // NOTE: check if item exists
        // TODO: As noted in other places make a light function to check for it
        $this->getItemsAndSetResponseCacheTags($foldersTableGateway, [
            'id' => $id
        ]);

        return $foldersTableGateway->deleteRecord($id, $this->getCRUDParams($params));
    }

    /**
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

        $collection = $this->collection;
        foreach ($items as $data) {
            $this->enforceCreatePermissions($collection, $data, $params);
            $this->validatePayload($collection, array_keys($data), $data, $params);
            $this->validatePayloadHasPrimaryKey($collection, $data);
            $this->validateEmptyData($data);
        }

        $collectionObject = $this->getSchemaManager()->getCollection($collection);
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
        $this->validateEmptyData($payload);

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
     * @param array $ids
     * @param array $params
     */
    public function batchDeleteWithIds(array $ids, array $params = [])
    {
        foreach ($ids as $id) {
            $this->delete($id, $params);
        }
    }

    /**
     * Throws exception if data property exists
     *
     * @param array $payload
     *
     * @throws BadRequestException
     */
    protected function validateEmptyData(array $payload)
    {
        if (ArrayUtils::has($payload, 'data')) {
            throw new BatchUploadNotAllowedException();
        }
    }
}
