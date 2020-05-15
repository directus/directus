<?php

namespace Directus\Services;

use Directus\Application\Container;
use Directus\Database\RowGateway\BaseRowGateway;
use Directus\Database\Schema\SchemaManager;
use Directus\Database\TableGateway\DirectusRolesTableGateway;
use Directus\Exception\UnauthorizedException;
use Directus\Util\ArrayUtils;
use Directus\Api\Routes\Roles;

class RolesService extends AbstractService
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
        $this->collection = SchemaManager::COLLECTION_ROLES;
        $this->itemsService = new ItemsService($this->container);
    }

    public function create(array $data, array $params = [])
    {
        $this->validatePayload($this->collection, null, $data, $params);
        $this->enforceCreatePermissions($this->collection, $data, $params);

        $groupsTableGateway = $this->createTableGateway($this->collection);
        $newGroup = $groupsTableGateway->createRecord($data, $this->getCRUDParams($params));

        return $groupsTableGateway->wrapData(
            $newGroup->toArray(),
            true,
            ArrayUtils::get($params, 'meta')
        );
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
     * Finds one or more roles by the given IDs
     *
     * @param int $id
     * @param array $params
     *
     * @return array
     */
    public function findByIds($id, array $params = [])
    {
        $tableGateway = $this->getTableGateway();

        return $this->getItemsByIdsAndSetResponseCacheTags($tableGateway, $id, $params);
    }

    /**
     * Gets a single item that matches the conditions
     *
     * @param array $params
     *
     * @return array
     */
    public function findOne(array $params = [])
    {
        return $this->itemsService->findOne($this->collection, $params);
    }

    public function update($id, array $data, array $params = [])
    {
        $this->validatePayload($this->collection, array_keys($data), $data, $params);
        $this->enforceCreatePermissions($this->collection, $data, $params);
        $this->checkItemExists($this->collection, $id);

        $groupsTableGateway = $this->getTableGateway();
        $group = $groupsTableGateway->updateRecord($id, $data, $this->getCRUDParams($params));

        return $groupsTableGateway->wrapData(
            $group->toArray(),
            true,
            ArrayUtils::get($params, 'meta')
        );
    }

    public function findAll(array $params = [])
    {
        $groupsTableGateway = $this->getTableGateway();

        return $this->getItemsAndSetResponseCacheTags($groupsTableGateway, $params);
    }

    public function delete($id, array $params = [])
    {
        $this->enforcePermissions($this->collection, [], $params);
        $this->validate(['id' => $id], $this->createConstraintFor($this->collection, ['id']));

        // TODO: Create exists method
        // NOTE: throw an exception if item does not exist
        $group = $this->find($id);

        // TODO: Make the error messages more specific
        if (!$this->canDelete($id)) {
            throw new UnauthorizedException(sprintf('You are not allowed to delete group [%s]', $id));
        }

        $tableGateway = $this->getTableGateway();

        $tableGateway->deleteRecord($id, $this->getCRUDParams($params));

        return true;
    }

    /**
     * Checks whether the the group be deleted
     *
     * @param $id
     * @param bool $fetchNew
     *
     * @return bool
     */
    public function canDelete($id, $fetchNew = false)
    {
        if (!$this->lastGroup || $fetchNew === true) {
            $groupObject = $this->find($id);
            $group = $groupObject ? $groupObject['data'] : null;
        } else {
            $group = $this->lastGroup;
        }
        
        return !(!$group || $group['id'] == ROLES::ADMIN || $group['id'] == ROLES::PUBLIC);
    }

    /**
     * @return DirectusRolesTableGateway
     */
    public function getTableGateway()
    {
        if (!$this->tableGateway) {
            $acl = $this->container->get('acl');
            $dbConnection = $this->container->get('database');

            $this->tableGateway = new DirectusRolesTableGateway($dbConnection, $acl);
        }

        return $this->tableGateway;
    }
}
