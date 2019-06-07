<?php

namespace Directus\Services;

use Directus\Application\Container;
use Directus\Authentication\Exception\ExpiredTokenException;
use Directus\Authentication\Exception\InvalidTokenException;
use Directus\Authentication\Exception\UserNotFoundException;
use Directus\Authentication\Provider;
use Directus\Database\Exception\ItemNotFoundException;
use Directus\Database\Schema\SchemaManager;
use Directus\Database\TableGateway\DirectusUsersTableGateway;
use Directus\Database\TableGateway\RelationalTableGateway;
use Directus\Exception\ForbiddenException;
use Directus\Exception\ForbiddenLastAdminException;
use Directus\Permissions\Acl;
use Directus\Util\ArrayUtils;
use Directus\Util\DateTimeUtils;
use Directus\Util\JWTUtils;
use Zend\Db\Sql\Delete;
use Zend\Db\Sql\Select;

class UsersService extends AbstractService
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
        $this->collection = SchemaManager::COLLECTION_USERS;
        $this->itemsService = new ItemsService($this->container);
    }

    public function create(array $data, array $params = [])
    {
        return $this->itemsService->createItem($this->collection, $data, $params);
    }

    public function update($id, array $payload, array $params = [])
    {
        $id = $this->getUserId($id);

        $this->enforceUpdatePermissions($this->collection, $payload, $params);
        $this->validatePayload($this->collection, array_keys($payload), $payload, $params);
        $this->checkItemExists($this->collection, $id);

        $tableGateway = $this->createTableGateway($this->collection);
        $status = $this->getSchemaManager()->getCollection($this->collection)->getStatusField();
        if (ArrayUtils::has($payload, $status->getName()) && (string) ArrayUtils::get($payload, $status->getName()) != DirectusUsersTableGateway::STATUS_ACTIVE) {
            $this->enforceLastAdmin($id);
        }

        // Fetch the entry even if it's not "published"
        $params['status'] = '*';
        $newRecord = $tableGateway->updateRecord($id, $payload, $this->getCRUDParams($params));

        try {
            $item = $this->find(
                $newRecord->getId(),
                ArrayUtils::omit($params, $this->itemsService::SINGLE_ITEM_PARAMS_BLACKLIST)
            );
        } catch (\Exception $e) {
            $item = null;
        }

        return $item;
    }

    /**
     * @param int $id
     * @param string $lastPage
     * @param array $params
     *
     * @return array
     */
    public function updateLastPage($id, $lastPage, array $params = [])
    {
        $data = [
            'last_page' => $lastPage,
            'last_access_on' => DateTimeUtils::now()->toString()
        ];

        $this->createTableGateway($this->collection, false)->update($data, [
            'id' => $this->getUserId($id)
        ]);

        return $this->find($this->getUserId($id), $params);
    }

    public function find($id, array $params = [])
    {
        return $this->itemsService->find(
            $this->collection,
            $this->getUserId($id),
            $params
        );
    }

    public function findByIds($id, array $params = [])
    {
        return $this->itemsService->findByIds(
            $this->collection,
            $this->getUserId($id),
            $params
        );
    }

    public function findOne(array $params = [])
    {
        return $this->itemsService->findOne(
            $this->collection,
            $params
        );
    }

    public function delete($id, array $params = [])
    {
        $this->enforcePermissions($this->collection, [], $params);
        $tableGateway = $this->createTableGateway($this->collection);
        $id = $this->getUserId($id);

        // hotfix: enforce delete permission before checking for the item existence
        // this avoids an indirect reveal of an item the user is not allowed to see
        $delete = new Delete($this->collection);
        $delete->where([
            'id' => $id
        ]);
        $tableGateway->enforceDeletePermission($delete);

        $this->enforceLastAdmin($id);

        $tableGateway->deleteRecord($id, $this->getCRUDParams($params));

        return true;
    }

    /**
     * @param array $params
     *
     * @return array
     */
    public function findAll(array $params = [])
    {
        return $this->getItemsAndSetResponseCacheTags($this->getTableGateway(), $params);
    }

    public function invite($emails, array $params = [])
    {
        if (!$this->getAcl()->isAdmin()) {
            throw new ForbiddenException('Inviting user was denied');
        }

        if (!is_array($emails)) {
            $emails = [$emails];
        }

        foreach ($emails as $email) {
            $data = ['email' => $email];
            $this->validate($data, ['email' => 'required|email']);
        }

        foreach ($emails as $email) {
            $this->sendInvitationTo($email);
        }

        return $this->findAll([
            'status' => false,
            'filter' => [
                'email' => ['in' => $emails]
            ]
        ]);
    }

    /**
     * Gets the user table gateway
     *
     * @return RelationalTableGateway
     */
    public function getTableGateway()
    {
        if (!$this->tableGateway) {
            $this->tableGateway = $this->createTableGateway($this->collection);
        }

        return $this->tableGateway;
    }

    /**
     * @param string $email
     */
    protected function sendInvitationTo($email)
    {
        // TODO: Builder/Service to get table gateway
        // $usersRepository = $repositoryCollection->get('users');
        // $usersRepository->add();
        $tableGateway = $this->createTableGateway($this->collection);
        $user = $tableGateway->findOneBy('email', $email);

        // TODO: Throw exception when email exists
        // Probably resend if the email exists?
        // TODO: Add activity
        if (!$user) {
            /** @var Provider $auth */
            $auth = $this->container->get('auth');
            $datetime = DateTimeUtils::nowInUTC();
            $invitationToken = $auth->generateInvitationToken([
                'date' => $datetime->toString(),
                'exp' => $datetime->inDays(30)->getTimestamp(),
                'email' => $email,
                'sender' => $this->getAcl()->getUserId()
            ]);

            $result = $tableGateway->insert([
                'status' => DirectusUsersTableGateway::STATUS_INVITED,
                'email' => $email
            ]);

            if ($result) {
                // TODO: This should be a moved to a hook
                \Directus\send_user_invitation_email($email, $invitationToken);
            }
        }
    }

    /**
     * Enables a user using a invitation token
     *
     * @param string $token
     * @return array
     *
     * @throws ExpiredTokenException
     * @throws InvalidTokenException
     * @throws UserNotFoundException
     */
    public function enableUserWithInvitation($token)
    {
        if (!JWTUtils::isJWT($token)) {
            throw new InvalidTokenException();
        }

        if (JWTUtils::hasExpired($token)) {
            throw new ExpiredTokenException();
        }

        $payload = JWTUtils::getPayload($token);

        if (!JWTUtils::hasPayloadType(JWTUtils::TYPE_INVITATION, $payload)) {
            throw new InvalidTokenException();
        }

        // auth middleware doesn't parse this kind of token
        // but we know that only admins can send invitations
        $this->getAcl()->setUserId($payload->sender);
        $this->getAcl()->setPermissions([
            'directus_users' => [
                [
                    Acl::ACTION_READ   => Acl::LEVEL_FULL,
                    Acl::ACTION_UPDATE => Acl::LEVEL_FULL,
                ],
            ],
        ]);

        $auth = $this->getAuth();
        $auth->validatePayloadOrigin($payload);

        $tableGateway = $this->getTableGateway();
        try {
            $result = $this->findOne([
                'filter' => [
                    'email' => $payload->email,
                    'status' => DirectusUsersTableGateway::STATUS_INVITED
                ]
            ]);
        } catch (ItemNotFoundException $e) {
            throw new UserNotFoundException();
        }

        $user = $result['data'];

        $tableGateway
            ->update([
                'status' => DirectusUsersTableGateway::STATUS_ACTIVE
            ], [
                'id' => $user['id']
            ]);

        return $result;
    }

    /**
     * Replace "me" with the authenticated user
     *
     * @param null $id
     *
     * @return int|null
     */
    protected function getUserId($id = null)
    {
        if ($id === 'me') {
            $id = $this->getAcl()->getUserId();
        }

        return $id;
    }

    /**
     * Checks whether the given ID is the last admin
     *
     * @param int $id
     *
     * @return bool
     */
    protected function isLastAdmin($id)
    {
        $result = $this->createTableGateway(SchemaManager::COLLECTION_USER_ROLES, false)->fetchAll(function (Select $select) use ($id) {
            $select->columns(['role']);
            $select->where(['role' => 1]);
            $on = sprintf('%s.id = %s.user', SchemaManager::COLLECTION_USERS, SchemaManager::COLLECTION_USER_ROLES);
            $select->join(SchemaManager::COLLECTION_USERS, $on, ['user' => 'id']);
        });

        $usersIds = [];
        while ($result->valid()) {
            $item = $result->current();
            $usersIds[] = $item['user'];
            $result->next();
        }

        return in_array($id, $usersIds) && count($usersIds) === 1;
    }

    /**
     * Throws an exception if the user is the last admin
     *
     * @param int $id
     *
     * @throws ForbiddenLastAdminException
     */
    protected function enforceLastAdmin($id)
    {
        if ($this->isLastAdmin($id)) {
            throw new ForbiddenLastAdminException();
        }
    }
}
