<?php

namespace Directus\Application\Http\Middleware;

use Directus\Application\Http\Request;
use Directus\Application\Http\Response;
use Directus\Authentication\Exception\TFAEnforcedException;
use Directus\Authentication\Exception\UserNotAuthenticatedException;
use Directus\Authentication\User\User;
use Directus\Authentication\User\UserInterface;
use Directus\Database\TableGateway\DirectusPermissionsTableGateway;
use Directus\Exception\UnauthorizedLocationException;
use function Directus\get_request_authorization_token;
use function Directus\get_static_token_based_on_type;
use Directus\Permissions\Acl;
use Directus\Services\AuthService;
use Directus\Services\UsersService;
use Zend\Db\Sql\Select;
use Zend\Db\TableGateway\TableGateway;
use Directus\Api\Routes\Roles;

class AuthenticationMiddleware extends AbstractMiddleware
{
    /**
     * @param Request $request
     * @param Response $response
     * @param callable $next
     *
     * @return Response
     *
     * @throws UnauthorizedLocationException
     * @throws UserNotAuthenticatedException
     * @throws TFAEnforcedException
     */
    public function __invoke(Request $request, Response $response, callable $next)
    {
        /** @var Acl $acl */
        $acl = $this->container->get('acl');

        $dbConnection = $this->container->get('database');
        $permissionsTable = new DirectusPermissionsTableGateway($dbConnection, null);

        $publicRoleId = ROLES::PUBLIC;

        $rolesIpWhitelist = [];
        $permissionsByCollection = [];

        try {
            $user = $this->authenticate($request);
           
            $hookEmitter = $this->container->get('hook_emitter');
            if (!$user && !$publicRoleId) {
           
                $exception = new UserNotAuthenticatedException();
                $hookEmitter->run('auth.fail', [$exception]);
                throw $exception;
            }
           
            if (!is_null($user)) {
           
                $rolesIpWhitelist = $this->getUserRolesIPWhitelist($user->getId());
              
                $permissionsByCollection = $permissionsTable->getUserPermissions($user->getId());
                
                /** @var UsersService $usersService */
                $usersService = new UsersService($this->container);
                $tfa_enforced = $usersService->has2FAEnforced($user->getId());
                $isUserEdit = $this->targetIsUserEdit($request, $user->getId());

                if ($tfa_enforced && $user->get2FASecret() == null && !$isUserEdit) {
                    $exception = new TFAEnforcedException();
                    $hookEmitter->run('auth.fail', [$exception]);
                    throw $exception;
                }

                $hookEmitter->run('auth.success', [$user]);
            } else {
                if (is_null($user) && $publicRoleId) {
                    // NOTE: 0 will not represent a "guest" or the "public" user
                    // To prevent the issue where user column on activity table can't be null
                    $user = new User([
                        'id' => 0
                    ]);

                    $acl->setPublic(true);

                    $rolesIpWhitelist = [$publicRoleId => $this->getRoleIPWhitelist($publicRoleId)];
                    $permissionsByCollection = $permissionsTable->getRolePermissions($publicRoleId);
                }
            }
        } catch (\Exception $e) {
            if ($publicRoleId) {
                // NOTE: 0 will not represent a "guest" or the "public" user
                // To prevent the issue where user column on activity table can't be null
                $user = new User([
                    'id' => 0
                ]);

                $acl->setPublic(true);

                $rolesIpWhitelist = [$publicRoleId => $this->getRoleIPWhitelist($publicRoleId)];
                $permissionsByCollection = $permissionsTable->getRolePermissions($publicRoleId);
            } else {
                throw $e;
            }
        }

        $acl->setPermissions($permissionsByCollection);
        $acl->setRolesIpWhitelist($rolesIpWhitelist);

        if (!$acl->isIpAllowed(\Directus\get_request_ip())) {
            $exception = new UnauthorizedLocationException();
            $hookEmitter->run('auth.fail', [$exception]);
            throw $exception;
        }

        // TODO: Adding an user should auto set its ID and GROUP
        // TODO: User data should be casted to its data type
        // TODO: Make sure that the group is not empty
        $acl->setUserId($user->getId());
        $acl->setUserEmail($user->getEmail());
        $acl->setUserFullName($user->get('first_name') . ' ' . $user->get('last_name'));

        return $next($request, $response);
    }

    /**
     * Tries to authenticate the user based on the HTTP Request
     *
     * @param Request $request
     *
     * @return UserInterface
     */
    protected function authenticate(Request $request)
    {
        $user = null;
        $authToken = $this->getAuthToken($request);

        if ($authToken) {
            /** @var AuthService $authService */
            $authService = $this->container->get('services')->get('auth');

            $user = $authService->authenticateWithToken($authToken, $request->getAttribute('ignore_origin'));
        }

        return $user;
    }

    /**
     * Gets the authentication token from the request
     *
     * @param Request $request
     *
     * @return string
     */
    protected function getAuthToken(Request $request)
    {
        $authToken = get_request_authorization_token($request);
        return get_static_token_based_on_type($authToken);
    }

    /**
     * Gets IP whitelist
     *
     * @return array
     */
    protected function getUserRolesIpWhitelist($userId)
    {
        $dbConnection = $this->container->get('database');
        $directusGroupsTableGateway = new TableGateway('directus_roles', $dbConnection);
        $select = new Select(['r' => $directusGroupsTableGateway->table]);
        $select->columns(['id', 'ip_whitelist']);

        $subSelect = new Select(['ur' => 'directus_users']);
        $subSelect->where->equalTo('ur.id', $userId);
        $subSelect->limit(1);

        $select->join(
            ['ur' => $subSelect],
            'r.id = ur.role',
            [
                'role'
            ],
            $select::JOIN_RIGHT
        );

        $result = $directusGroupsTableGateway->selectWith($select);
 
        $list = [];
        foreach ($result as $row) {
            $list[$row['id']] = array_filter(preg_split('/,\s*/', $row['ip_whitelist']));
        }

        return $list;
    }

    protected function getRoleIPWhitelist($roleId)
    {
        $dbConnection = $this->container->get('database');
        $directusGroupsTableGateway = new TableGateway('directus_roles', $dbConnection);

        $select = new Select($directusGroupsTableGateway->table);
        $select->columns(['id', 'ip_whitelist']);
        $select->where->equalTo('id', $roleId);
        $result = $directusGroupsTableGateway->selectWith($select)->current();

        return array_filter(preg_split('/,\s*/', $result['ip_whitelist']));
    }

    /**
     * Returns true if the request is a user update for the given id
     * A user edit will submit a PATCH to both the user update endpoint
     *
     * @param Request $request
     * @param int $id
     *
     * @return bool
     */
    protected function targetIsUserEdit(Request $request, int $id) {

        $target_array = explode('/', $request->getRequestTarget());
        $num_elements = count($target_array);

        if (!$request->isPost()) {
            return false;
        }

        if ($num_elements > 3
            &&$target_array[$num_elements - 3] == 'users'
            && (
                $target_array[$num_elements - 2] == strval($id) ||
                $target_array[$num_elements - 2] == 'me'
            )
            && $target_array[$num_elements - 1] == 'activate_2fa') {
            return true;
        }

        return false;
    }
}
