<?php

namespace Directus\Services;

use Directus\Application\Container;
use Directus\Database\Schema\SchemaManager;
use Directus\Exception\BadRequestException;
use Directus\Exception\BatchUploadNotAllowedException;
use Zend\Db\Sql\Select;
use function Directus\is_a_url;
use function Directus\validate_file;
use function Directus\get_directus_setting;
use Directus\Util\ArrayUtils;
use Directus\Util\DateTimeUtils;
use Directus\Validator\Exception\InvalidRequestException;
use function Directus\get_random_string;

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

        $data['uploaded_by'] = $this->getAcl()->getUserId();
        $data['uploaded_on'] = DateTimeUtils::now()->toString();

        $validationConstraints = $this->createConstraintFor($this->collection);

        // Do not validate filename when uploading files using URL
        // The filename will be generate automatically if not defined
        if (is_a_url(ArrayUtils::get($data, 'data'))) {
            unset($validationConstraints['filename_disk']);
            unset($validationConstraints['filename_download']);
        }

        $this->validate($data, array_merge(['data' => 'required'], $validationConstraints));

        $files = $this->container->get('files');
        $result = $files->getFileSizeType($data['data']);

        if (get_directus_setting('file_mimetype_whitelist') != null) {
            validate_file($result['mimeType'], 'mimeTypes');
        }
        if($result['mimeType'] != 'embed/vimeo' && $result['mimeType'] != 'embed/youtube'){
            validate_file($result['size'], 'maxSize');
        }

        $recordData = $this->getSaveData($data, false);

        $newFile = $tableGateway->createRecord($recordData, $this->getCRUDParams($params));

        return $tableGateway->wrapData(
            \Directus\append_storage_information($newFile->toArray()),
            true,
            ArrayUtils::get($params, 'meta')
        );
    }

    public function getSaveData($data, $isUpdate)
    {
        $dataInfo = [];
        $files = $this->container->get('files');

        if (array_key_exists('data', $data) && is_a_url($data['data'])) {
            $dataInfo = $files->getLink($data['data']);

            // Set the URL payload data
            $data['data'] = ArrayUtils::get($dataInfo, 'data');
            $data['filename_disk'] = ArrayUtils::get($dataInfo, 'filename');
            $data['filename_download'] = ArrayUtils::get($dataInfo, 'filename');
            ArrayUtils::remove($dataInfo, 'filename');
        } else if (array_key_exists('data', $data) && !is_object($data['data'])) {
            $dataInfo = $files->getDataInfo($data['data']);
        }

        $type = ArrayUtils::get($dataInfo, 'type', ArrayUtils::get($data, 'type'));

        if (strpos($type, 'embed/') === 0) {
            $recordData = $files->saveEmbedData(array_merge($dataInfo, ArrayUtils::pick($data, ['filename_disk'])));
        } else {
            $newFileContents = array_key_exists('data', $data) ? $data['data'] : null;
            $recordData = $files->saveData($newFileContents, $data['filename_disk'], $isUpdate);
        }

        // NOTE: Use the user input title, tags, description and location when exists.
        $recordData = ArrayUtils::defaults($recordData, ArrayUtils::pick($data, [
            'title',
            'tags',
            'description',
            'location',
        ]));

        if (!$isUpdate) {
            $recordData['private_hash'] = get_random_string();
        }

        return ArrayUtils::omit(array_merge($data, $recordData), ['data', 'html']);
    }

    protected function findByPrivateHash($hash)
    {
        $result = $this->createTableGateway(SchemaManager::COLLECTION_FILES, false)->fetchAll(function (Select $select) use ($hash) {
            $select->columns(['filename_disk']);
            $select->where(['private_hash' => $hash]);
        })->current()->toArray();
        return $result;
    }

    public function find($id, array $params = [])
    {
        $tableGateway = $this->createTableGateway($this->collection);
        $params['id'] = $id;

        return $this->getItemsAndSetResponseCacheTags($tableGateway, $params);
    }

    public function findByIds($id, array $params = [])
    {
        $tableGateway = $this->createTableGateway($this->collection);

        return $this->getItemsByIdsAndSetResponseCacheTags($tableGateway, $id, $params);
    }

    public function update($id, array $data, array $params = [])
    {
        $this->enforceUpdatePermissions($this->collection, $data, $params);

        $this->checkItemExists($this->collection, $id);
        $this->validatePayload($this->collection, array_keys($data), $data, $params);

        $files = $this->container->get('files');

        if (isset($data['data'])) {
            $result = $files->getFileSizeType($data['data']);

            if (get_directus_setting('file_mimetype_whitelist') != null) {
                validate_file($result['mimeType'], 'mimeTypes');
            }
            if($result['mimeType'] != 'embed/vimeo' && $result['mimeType'] != 'embed/youtube'){
              validate_file($result['size'], 'maxSize');
            }
        }

        $tableGateway = $this->createTableGateway($this->collection);

        $currentItem = $tableGateway->getOneData($id);
        $currentFileName = ArrayUtils::get($currentItem, 'filename_disk');        

        if (array_key_exists('filename_disk', $data) && $data['filename_disk'] !== $currentFileName) {
            $oldFilePath = $currentFileName;
            $newFilePath = $data['filename_disk'];

            try {
                $this->container->get('filesystem')->getAdapter()->rename($oldFilePath, $newFilePath);
            } catch (\Exception $e) {
                throw new InvalidRequestException($e);
            }
        }

        // getSaveData requires filename_disk to be set, in order for Filesystem/Files to read the file info
        $fileName = $currentFileName;

        // If the user provided their own filename, the file has been renamed above. In that case, pass on
        // the new filename
        if (array_key_exists('filename_disk', $data)) {
            $fileName = $data['filename_disk'];
        }

        $data['filename_disk'] = $fileName;

        $recordData = $this->getSaveData($data, true);

        $newFile = $tableGateway->updateRecord($id, $recordData, $this->getCRUDParams($params));

        $thumb = $this->container->get('files_thumb');
        $thumb->deleteThumb($currentItem);

        return $tableGateway->wrapData(
            \Directus\append_storage_information([$newFile->toArray()]),
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

        //Force delete the thumbnails
        $thumb = $this->container->get('files_thumb');
        $thumb->deleteThumb($file);

        // Delete file record
        return $tableGateway->deleteRecord($id, $this->getCRUDParams($params));
    }

    public function findAll(array $params = [])
    {
        $tableGateway = $this->createTableGateway($this->collection);

        return $this->getItemsAndSetResponseCacheTags($tableGateway, $params);
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
