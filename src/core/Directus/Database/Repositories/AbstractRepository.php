<?php

namespace Directus\Database\Repositories;

use Directus\Database\TableGateway\BaseTableGateway;
use Directus\Hook\Emitter;
use Directus\Permissions\Acl;
use Directus\Util\ArrayUtils;

abstract class AbstractRepository implements RepositoryInterface
{
    /**
     * TODO: We should implement compound primary key
     *
     * @var string
     */
    protected $idAttribute;

    /**
     * @var BaseTableGateway
     */
    protected $tableGateway;

    /**
     * @var Emitter
     */
    protected $hookEmitter;

    /**
     * @var Acl
     */
    protected $acl;

    public function __construct(BaseTableGateway $tableGateway, array $options = [])
    {
        $this->tableGateway = $tableGateway;
        $this->idAttribute = ArrayUtils::get($options, 'id', 'id');
        $this->hookEmitter = ArrayUtils::get($options, 'hookEmitter');
        $this->acl = ArrayUtils::get($options, 'acl');
    }

    /**
     * @param string $attribute
     * @param mixed $value
     * @return mixed
     */
    public function findOneBy($attribute, $value)
    {
        // TODO: Implement findOneBy() method.
    }

    /**
     * @param int|string $id
     * @return mixed
     */
    public function find($id)
    {
        return $this->findOneBy($this->idAttribute, $id);
    }
}
