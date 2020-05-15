<?php

namespace Directus\Services;

use Directus\Application\Container;
use Directus\Database\Schema\SchemaManager;

class UserSessionService extends AbstractService
{

    /**
     * @var string
     */
    protected $tableGateway;

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
        $this->collection = SchemaManager::COLLECTION_USER_SESSIONS;
    }

    /**
     * @param array $data
     *
     * @return array
     */
    public function create(array $data)
    {
        $userSessiontableGateway = $this->createTableGateway($this->collection, false);
        return $userSessiontableGateway->recordSession($data);
    }

    /**
     * @param $id
     * @param array $data
     *
     * @return array
     */
    public function update($id,array $data)
    {
        $userSessiontableGateway = $this->createTableGateway($this->collection, false);
        return $userSessiontableGateway->updateSession($id,$data);
    }
   
    /**
     * @param array $conditions
     *
     * @return string
     * 
     */
    public function findAll($conditions)
    {
        return $this->getItemsAndSetResponseCacheTags($this->createTableGateway($this->collection,false), $conditions);
    }
   
    /**
     * @param array $conditions
     *
     * @return string
     * 
     */
    public function find($conditions)
    {
        $userSessiontableGateway = $this->createTableGateway($this->collection, false);
        $response = $userSessiontableGateway->fetchSession($conditions);
        return $response ? $response->toArray() : $response;
    }

    /**
     * @param $conditions
     *
     */
    public function destroy($conditions)
    {
        $userSessionTable = $this->createTableGateway(SchemaManager::COLLECTION_USER_SESSIONS, false);
        $userSessionTable->delete($conditions);
        return true;
    }
}
