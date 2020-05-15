<?php

namespace Directus\Services;

use Directus\Application\Container;
use Directus\Authentication\Exception\ExpiredTokenException;
use Directus\Authentication\Exception\InvalidOTPException;
use Directus\Authentication\Exception\InvalidTokenException;
use Directus\Authentication\Exception\UserNotFoundException;
use Directus\Authentication\Provider;
use Directus\Database\Exception\InvalidQueryException;
use Directus\Database\Exception\ItemNotFoundException;
use Directus\Database\Schema\SchemaManager;
use Directus\Database\TableGateway\DirectusUsersTableGateway;
use Directus\Database\TableGateway\DirectusActivityTableGateway;
use Directus\Database\TableGateway\RelationalTableGateway;
use Directus\Exception\ForbiddenException;
use Directus\Exception\ForbiddenLastAdminException;
use Directus\Permissions\Acl;
use Directus\Util\ArrayUtils;
use Directus\Util\DateTimeUtils;
use Directus\Util\JWTUtils;
use PragmaRX\Google2FA\Google2FA;
use Zend\Db\Sql\Delete;
use Zend\Db\Sql\Select;
use function Directus\get_directus_setting;
use Directus\Validator\Exception\InvalidRequestException;
use Zend\Db\TableGateway\TableGateway;
use Directus\Exception\UnauthorizedException;

class UsersService extends AbstractService
{

    const PASSWORD_FIELD = 'password';

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

        $passwordValidation = get_directus_setting('password_policy');
        if (!empty($passwordValidation)) {
            $this->validate($payload, [static::PASSWORD_FIELD => ['regex:' . $passwordValidation]]);
        }

        $this->checkItemExists($this->collection, $id);

        $tableGateway = $this->createTableGateway($this->collection);
        $status = $this->getSchemaManager()->getCollection($this->collection)->getStatusField();
        if (ArrayUtils::has($payload, $status->getName()) && (string) ArrayUtils::get($payload, $status->getName()) != DirectusUsersTableGateway::STATUS_ACTIVE) {
            $this->enforceLastAdmin($id);
        }

        // Fetch the entry even if it's not "published"
        $params['status'] = '*';
        $oldRecord = $this->find(
            $id,
            ArrayUtils::omit($params, $this->itemsService::SINGLE_ITEM_PARAMS_BLACKLIST)
        );
        $newRecord = $tableGateway->updateRecord($id, $payload, $this->getCRUDParams($params));

        if (!is_null(ArrayUtils::get($payload, $status->getName()))) {
            $activityTableGateway = $this->createTableGateway(SchemaManager::COLLECTION_ACTIVITY);
            $activityTableGateway->recordAction(
                $id,
                SchemaManager::COLLECTION_USERS,
                DirectusActivityTableGateway::ACTION_UPDATE_USER_STATUS
            );
        }

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
        try {
            return $this->itemsService->findByIds(
                $this->collection,
                $this->getUserId($id),
                $params
            );
        } catch (\Exception $e) {
            if ($e->getCode() == 203 && $id == "me") {
                throw new UnauthorizedException('Unauthorized request');
            }
            throw $e;
        }
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
        $result = $this->createTableGateway(SchemaManager::COLLECTION_USERS, false)->fetchAll(function (Select $select) use ($id) {
            $select->columns(['id']);
            $select->where(['role' => 1 , 'status' =>  DirectusUsersTableGateway::STATUS_ACTIVE]);
        })->toArray();

        $usersIds = [];
        if(count($result) > 0) {
            foreach ($result as $key => $value) {
                ArrayUtils::push($usersIds,$value['id']);
            }
        }
        
        return in_array($id, $usersIds) && count($usersIds) === 1;
    }

    /**
     * Checks whether the given ID has 2FA enforced, as set by their role.
     * When 2FA is enforced, the column enforce_2fa is set to 1.
     * Otherwise, it is either set to null or 0.
     *
     * @param $id
     *
     * @return bool
     */
    public function has2FAEnforced($id)
    {
        try {
            $dbConnection = $this->container->get('database');
            $tableGateway = new TableGateway(SchemaManager::COLLECTION_ROLES, $dbConnection);
            $select = new Select(['r' => SchemaManager::COLLECTION_ROLES]);
            $select->columns(['enforce_2fa']);

            $subSelect = new Select(['ur' => 'directus_users']);
            $subSelect->where->equalTo('ur.id', $id);
            $subSelect->limit(1);

            $select->join(
                ['ur' => $subSelect],
                'r.id = ur.role',
                [
                    'role'
                ]
            );

            $result = $tableGateway->selectWith($select)->current()['enforce_2fa'];

            if (empty($result)) {
                return false;
            } else {
                return true;
            }
        } catch (InvalidQueryException $e) {
            // Column enforce_2fa doesn't exist in directus_roles
            return false;
        }
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

    /**
     * Activate 2FA for the given user id if the OTP is valid for the given 2FA secret
     * @param $id
     * @param $tfa_secret
     * @param $otp
     *
     * @return array
     *
     * @throws InvalidOTPException
     */
    public function activate2FA($id, $tfa_secret, $otp)
    {
        $this->validate(
            ['2fa_secret' => $tfa_secret, 'otp' => $otp],
            ['2fa_secret' => 'required|string', 'otp' => 'required|string']
        );

        $ga = new Google2FA();

        if (!$ga->verifyKey($tfa_secret, $otp, 2)) {
            throw new InvalidOTPException();
        }

        return $this->update($id, ['2fa_secret' => $tfa_secret]);
    }

    /**
     * @param $collection
     * @param array $items
     * @param array $params
     *
     * @return array
     *
     * @throws InvalidRequestException
     */
    public function batchCreate(array $items, array $params = [])
    {
        if (!isset($items[0]) || !is_array($items[0])) {
            throw new InvalidRequestException('batch create expect an array of items');
        }

        foreach ($items as $data) {
            $this->enforceCreatePermissions($this->collection, $data, $params);
            $this->validatePayload($this->collection, null, $data, $params);
        }

        $allItems = [];
        foreach ($items as $data) {
            $item = $this->create($data, $params);
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
     * @param $collection
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

        foreach ($items as $data) {
            $this->enforceCreatePermissions($this->collection, $data, $params);
            $this->validatePayload($this->collection, array_keys($data), $data, $params);
            $this->validatePayloadHasPrimaryKey($this->collection, $data);
        }

        $collectionObject = $this->getSchemaManager()->getCollection($this->collection);
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
     * @param $collection
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
     * @param $collection
     * @param array $ids
     * @param array $params
     *
     * @throws ForbiddenException
     */
    public function batchDeleteWithIds(array $ids, array $params = [])
    {
        foreach ($ids as $id) {
            $this->delete($id, $params);
        }
    }
}
