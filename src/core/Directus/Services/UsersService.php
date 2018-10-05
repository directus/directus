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
use Directus\Util\DateTimeUtils;
use Directus\Util\JWTUtils;

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

    public function update($id, array $data, array $params = [])
    {
        return $this->itemsService->update(
            $this->collection,
            $this->getUserId($id),
            $data,
            $params
        );
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
            'last_access_on' => DateTimeUtils::nowInUTC()->toString()
        ];

        $this->getTableGateway()->update($data, [
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
        return $this->itemsService->delete(
            $this->collection,
            $this->getUserId($id),
            $params
        );
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

    public function invite(array $emails, array $params = [])
    {
        if (!$this->getAcl()->isAdmin()) {
            throw new ForbiddenException('Inviting user was denied');
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
                'exp' => $datetime->inDays(30)->toString(),
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

        $auth = $this->getAuth();
        $auth->validatePayloadOrigin($payload);

        $tableGateway = $this->getTableGateway();
        try {
            $result = $this->findOne([
                'filter' => [
                    'id' => $payload->id,
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
}
