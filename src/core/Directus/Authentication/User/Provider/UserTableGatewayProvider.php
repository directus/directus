<?php

namespace Directus\Authentication\User\Provider;

use Directus\Authentication\User\User;
use Directus\Authentication\User\UserInterface;
use Directus\Database\RowGateway\BaseRowGateway;
use Directus\Database\TableGateway\BaseTableGateway;
use Zend\Db\Sql\Select;

class UserTableGatewayProvider implements UserProviderInterface
{
    /**
     * @var BaseTableGateway
     */
    protected $tableGateway;

    public function __construct(BaseTableGateway $tableGateway)
    {
        $this->tableGateway = $tableGateway;
    }

    /**
     * @inheritdoc
     */
    public function findWhere(array $conditions)
    {
        $user = null;

        $select = new Select($this->tableGateway->getTable());
        $select->where($conditions);
        $select->limit(1);

        /** @var BaseRowGateway $row */
        $row = $this->tableGateway
                    ->ignoreFilters()
                    ->selectWith($select)
                    ->current();

        if ($row) {
            $user = new User($row->toArray());
        }

        return $user;
    }

    /**
     * @inheritdoc
     */
    public function find($id)
    {
        return $this->findWhere(['id' => $id]);
    }

    /**
     * @inheritdoc
     */
    public function findByEmail($email)
    {
        return $this->findWhere(['email' => $email]);
    }

    /**
     * @inheritdoc
     */
    public function update(UserInterface $user, array $data)
    {
        $condition = [
            $this->tableGateway->primaryKeyFieldName => $user->id
        ];

        return (bool)$this->tableGateway->ignoreFilters()->update($data, $condition);
    }
}
