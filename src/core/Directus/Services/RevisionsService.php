<?php

namespace Directus\Services;

use Directus\Application\Container;
use Directus\Database\Exception\ItemNotFoundException;
use Directus\Database\Exception\RevisionInvalidDeltaException;
use Directus\Database\Exception\RevisionNotFoundException;
use Directus\Database\Schema\SchemaManager;
use Zend\Db\TableGateway\TableGateway;

class RevisionsService extends AbstractService
{
    /**
     * @var string
     */
    protected $collection;

    public function __construct(Container $container)
    {
        parent::__construct($container);
        $this->collection = SchemaManager::COLLECTION_REVISIONS;
    }

    /**
     * Returns all items from revisions
     *
     * Result count will be limited by the rows per page setting
     *
     * @param array $params
     *
     * @return array|mixed
     */
    public function findAll(array $params = [])
    {
        $tableGateway = $this->getTableGateway();

        return $this->getDataAndSetResponseCacheTags(
            [$tableGateway, 'getItems'],
            [$params]
        );
    }

    /**
     * Returns all revisions for a specific collection
     *
     * Result count will be limited by the rows per page setting
     *
     * @param $collection
     * @param array $params
     *
     * @return array|mixed
     */
    public function findByCollection($collection, array $params = [])
    {
        $tableGateway = $this->getTableGateway();

        return $this->getDataAndSetResponseCacheTags(
            [$tableGateway, 'getItems'],
            [array_merge_recursive($params, ['filter' => ['collection' => $collection]])]
        );
    }

    /**
     * Returns one revision with the given id
     *
     * @param int $id
     * @param array $params
     *
     * @return array
     */
    public function findOne($id, array $params = [])
    {
        $tableGateway = $this->getTableGateway();

        return $this->getDataAndSetResponseCacheTags(
            [$tableGateway, 'getItems'],
            [array_merge_recursive($params, ['filter' => ['id' => $id]])]
        );
    }

    /**
     * Returns one or more revision with the given ids
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
     * Returns all revision from a given item
     *
     * @param string $collection
     * @param mixed $item
     * @param array $params
     *
     * @return array
     */
    public function findAllByItem($collection, $item, array $params = [])
    {
        $tableGateway = $this->getTableGateway();

        return $this->getDataAndSetResponseCacheTags(
            [$tableGateway, 'getItems'],
            [array_merge($params, ['filter' => ['item' => $item, 'collection' => $collection]])]
        );
    }

    /**
     * @param string $collection
     * @param string $item
     * @param int $offset
     * @param array $params
     *
     * @return array|mixed
     */
    public function findOneByItemOffset($collection, $item, $offset, array $params = [])
    {
        $tableGateway = $this->getTableGateway();

        $this->validate(['offset' => $offset], ['offset' => 'required|numeric']);

        return $this->getDataAndSetResponseCacheTags(
            [$tableGateway, 'getItems'],
            [array_merge(
                $params,
                [
                    // Make sure it's sorted by ID ascending
                    // to proper pick the offset based on creation order
                    'sort' => 'id',
                    'filter' => ['item' => $item, 'collection' => $collection],
                    'single' => true,
                    'limit' => 1,
                    'offset' => (int)$offset
                ]
            )]
        );
    }

    public function revert($collectionName, $item, $revision, array $params = [])
    {
        $this->throwErrorIfSystemTable($collectionName);

        if (!$this->itemExists($collectionName, $item)) {
            throw new ItemNotFoundException();
        }

        $revisionTableGateway = new TableGateway(SchemaManager::COLLECTION_REVISIONS, $this->getConnection());
        $select = $revisionTableGateway->getSql()->select();
        $select->columns(['data']);
        $select->where->equalTo('id', $revision);
        $select->where->equalTo('collection', $collectionName);
        $select->where->equalTo('item', $item);

        $result = $revisionTableGateway->selectWith($select)->current();
        if (!$result) {
            throw new RevisionNotFoundException($revision);
        }

        $data = json_decode($result->data, true);
        if (!$data) {
            throw new RevisionInvalidDeltaException($revision);
        }

        $tableGateway = $this->createTableGateway($collectionName);
        $tableGateway->revertRecord($item, $data);

        return $this->getItemsByIdsAndSetResponseCacheTags($tableGateway, $item, $params);
    }

    /**
     * @return \Directus\Database\TableGateway\RelationalTableGateway
     */
    protected function getTableGateway()
    {
        return $this->createTableGateway($this->collection);
    }
}
