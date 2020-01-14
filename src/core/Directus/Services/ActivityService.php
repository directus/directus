<?php

namespace Directus\Services;

use Directus\Application\Container;
use Directus\Database\Exception\CollectionNotFoundException;
use Directus\Database\Exception\ItemNotFoundException;
use Directus\Database\RowGateway\BaseRowGateway;
use Directus\Database\Schema\SchemaManager;
use Directus\Database\TableGateway\DirectusActivityTableGateway;
use Directus\Database\TableGateway\DirectusRolesTableGateway;
use function Directus\get_item_owner;
use Directus\Permissions\Acl;
use Directus\Util\ArrayUtils;
use Directus\Util\DateTimeUtils;

class ActivityService extends AbstractService
{
    /**
     * @var BaseRowGateway
     */
    protected $lastGroup = null;

    /**
     * @var DirectusRolesTableGateway
     */
    protected $tableGateway = null;

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
        $this->collection = SchemaManager::COLLECTION_ACTIVITY;
        $this->itemsService = new ItemsService($this->container);
    }

    public function createComment(array $data, array $params = [])
    {
        $data = array_merge($data, [
            'action' => DirectusActivityTableGateway::ACTION_COMMENT,
            'action_on' => DateTimeUtils::now()->toString(),
            'ip' => \Directus\get_request_host(),
            'user_agent' => isset($_SERVER['HTTP_USER_AGENT']) ? $_SERVER['HTTP_USER_AGENT'] : '',
            'action_by' => $this->getAcl()->getUserId(),
        ]);

        $this->validateCommentsPayload($data, $params);

        $collectionName = ArrayUtils::get($data, 'collection');
        $itemId = ArrayUtils::get($data, 'item');

        $collection = $this->getSchemaManager()->getCollection($collectionName);
        if (!$collection) {
            throw new CollectionNotFoundException($collectionName);
        }

        $item = $this->fetchItem($collectionName, $itemId);

        if (!$item) {
            throw new ItemNotFoundException();
        }

        $this->enforcePermissionsOnCreate(
            $collectionName,
            $item->toArray(),
            $params
        );

        $tableGateway = $this->getTableGateway();

        // make sure to create new one instead of update
        unset($data[$tableGateway->primaryKeyFieldName]);
        $newComment = $tableGateway->createRecord($data, $this->getCRUDParams($params));

        return $tableGateway->wrapData(
            $newComment->toArray(),
            true,
            ArrayUtils::get($params, 'meta')
        );
    }

    public function updateComment($id, $comment, array $params = [])
    {
        $this->validate(['comment' => $comment], ['comment' => 'required']);

        $data = [
            'id' => $id,
            'comment' => $comment,
            'edited_on' => DateTimeUtils::now()->toString()
        ];

        $this->enforcepermissionsOnExisting(Acl::ACTION_UPDATE, $id, $params);

        $tableGateway = $this->getTableGateway();
        $newComment = $tableGateway->updateRecord($id, $data, $this->getCRUDParams($params));

        return $tableGateway->wrapData(
            $newComment->toArray(),
            true,
            ArrayUtils::get($params, 'meta')
        );
    }

    public function deleteComment($id, array $params = [])
    {
        $this->enforcePermissionsOnExisting(Acl::ACTION_DELETE, $id, $params);

        $tableGateway = $this->getTableGateway();
        $tableGateway->updateRecord($id, [
            'comment_deleted_on' => DateTimeUtils::now()->toString()
        ]);
    }

    /**
     * Finds a group by the given ID in the database
     *
     * @param int $id
     * @param array $params
     *
     * @return array
     */
    public function find($id, array $params = [])
    {
        $tableGateway = $this->getTableGateway();

        return $this->getItemsByIdsAndSetResponseCacheTags($tableGateway, $id, $params);
    }

    /**
     * Gets a single or multiple activity
     *
     * @param mixed $ids
     * @param array $params
     *
     * @return array
     */
    public function findByIds($ids, array $params = [])
    {
        return $this->itemsService->findByIds($this->collection, $ids, $params);
    }

    public function findAll(array $params = [])
    {
        $tableGateway = $this->getTableGateway();

        return $this->getItemsAndSetResponseCacheTags($tableGateway, $params);
    }

    /**
     * @return DirectusActivityTableGateway
     */
    public function getTableGateway()
    {
        if (!$this->tableGateway) {
            $acl = $this->container->get('acl');
            $dbConnection = $this->container->get('database');

            $this->tableGateway = new DirectusActivityTableGateway($dbConnection, $acl);
        }

        return $this->tableGateway;
    }

    /**
     * Validates the comment payload
     *
     * @param array $payload
     * @param array $params
     */
    protected function validateCommentsPayload(array $payload, array $params = [])
    {
        $this->validatePayload($this->collection, null, $payload, $params);
        $this->validate([
            'collection' => ArrayUtils::get($payload, 'collection'),
            'item' => ArrayUtils::get($payload, 'item')
        ], [
            'collection' => 'required',
            'item' => 'required'
        ]);
    }

    /**
     * Gets the data status value, if any.
     *
     * @param string $collectionName
     * @param array $data
     *
     * @return mixed|null
     */
    protected function getStatusValue($collectionName, array $data)
    {
        $collection = $this->getSchemaManager()->getCollection($collectionName);
        $status = null;
        $statusField = $collection->getStatusField();
        if ($statusField) {
            $status = ArrayUtils::get($data, $statusField->getName(), $statusField->getDefaultValue());
        }

        return $status;
    }

    /**
     * Throws exception if failed enforcing a set of permissions on create
     *
     * @param string $collectionName
     * @param array $data
     * @param array $params
     */
    protected function enforcePermissionsOnCreate($collectionName, array $data, array $params = [])
    {
        $this->enforcePermissions($this->collection, $data, $params);

        $this->getAcl()->enforceCreateComments(
            $collectionName,
            $this->getStatusValue($collectionName, $data)
        );
    }

    /**
     * Throws exception if failed enforcing a set of permissions on update
     *
     * @param mixed $id
     * @param string $collectionName
     * @param array $data
     * @param array $params
     */
    protected function enforcePermissionsOnUpdate($id, $collectionName, array $data, array $params = [])
    {
        $this->enforcePermissions($collectionName, $data, $params);
        $collection = $this->getSchemaManager()->getCollection($collectionName);

        $ownerId = get_item_owner($collectionName, $id);
        if ($collection->getUserCreatedField() && $ownerId !== $this->getAcl()->getUserId()) {
            $this->getAcl()->enforceUpdateAnyComments(
                $collectionName,
                $this->getStatusValue($collectionName, $data)
            );
        } else {
            $this->getAcl()->enforceUpdateMyComments(
                $collectionName,
                $this->getStatusValue($collectionName, $data)
            );
        }
    }

    /**
     * Throws exception if failed enforcing a set of permissions on delete
     *
     * @param mixed $id
     * @param string $collectionName
     * @param array $data
     * @param array $params
     */
    protected function enforcePermissionsOnDelete($id, $collectionName, array $data, array $params = [])
    {
        $this->enforcePermissions($collectionName, $data, $params);

        $collection = $this->getSchemaManager()->getCollection($collectionName);
        $ownerId = get_item_owner($collectionName, $id);
        if ($collection->getUserCreatedField() && $ownerId !== $this->getAcl()->getUserId()) {
            $this->getAcl()->enforceDeleteAnyComments(
                $collectionName,
                $this->getStatusValue($collectionName, $data)
            );
        } else {
            $this->getAcl()->enforceDeleteMyComments(
                $collectionName,
                $this->getStatusValue($collectionName, $data)
            );
        }
    }

    /**
     * Throws exception if failed enforcing a set of permissions on update or delete
     *
     * @param string $action
     * @param mixed $id
     * @param array $params
     *
     * @throws ItemNotFoundException
     */
    protected function enforcePermissionsOnExisting($action, $id, array $params = [])
    {
        $commentItem = $this->fetchItem($this->collection, $id, ['collection', 'item'], [
            'action' => DirectusActivityTableGateway::ACTION_COMMENT
        ]);

        if (!$commentItem) {
            throw new ItemNotFoundException(
                sprintf('Comment "%s" not found', $id)
            );
        }

        $item = $this->fetchItem($commentItem['collection'], $commentItem['item']);
        if (!$item) {
            throw new ItemNotFoundException();
        }

        $collectionName = $commentItem['collection'];
        $itemId = $commentItem['item'];
        $data = $item->toArray();

        if ($action === Acl::ACTION_DELETE) {
            $this->enforcePermissionsOnDelete($itemId, $collectionName, $data, $params);
        } else if ($action == Acl::ACTION_UPDATE) {
            $this->enforcePermissionsOnUpdate($itemId, $collectionName, $data, $params);
        }
    }
}
