<?php

namespace Directus\API\Routes\A1;

use Directus\Application\Route;
use Directus\Database\TableGateway\DirectusActivityTableGateway;
use Directus\Database\TableGateway\DirectusGroupsTableGateway;
use Directus\Database\TableGateway\DirectusUsersTableGateway;
use Directus\Mail\Mail;
use Directus\Services\AuthService;
use Directus\Util\DateUtils;
use Directus\Util\StringUtils;
use Directus\View\JsonView;
use Zend\Db\TableGateway\TableGateway;

class Auth extends Route
{
    public function requestToken()
    {
        $response = [
            'success' => false,
            'error' => [
                'message' => __t('incorrect_email_or_password')
            ]
        ];

        $request = $this->app->request();
        $email = $request->post('email');
        $password = $request->post('password');

        if ($email && $password) {
            $authService = new AuthService($this->app);
            $accessToken = $authService->requestToken($email, $password);

            if ($accessToken) {
                unset($response['error']);
                $response['success'] = true;
                $response['data'] = [
                    'token' => $accessToken
                ];
            } else {
                $response['message'] = __t('missing_token');
            }
        }

        return $this->app->response($response);
    }

    public function login()
    {
        $app = $this->app;
        $auth = $this->app->container->get('auth');
        $ZendDb = $this->app->container->get('zenddb');
        $acl = $this->app->container->get('acl');
        $response = [
            'error' => [
                'message' => __t('incorrect_email_or_password')
            ],
            'success' => false,
        ];

        if ($auth->loggedIn()) {
            $response['success'] = true;
            unset($response['error']);
            return $this->app->response($response);
        }

        $req = $app->request();
        $email = $req->post('email');
        $password = $req->post('password');
        $Users = new DirectusUsersTableGateway($ZendDb, null);
        $user = $Users->findOneBy('email', $email);

        if (!$user) {
            return $this->app->response($response);
        }

        // ------------------------------
        // Check if group needs whitelist
        $groupId = $user['group'];
        $directusGroupsTableGateway = new DirectusGroupsTableGateway($ZendDb, null);
        if (!$directusGroupsTableGateway->acceptIP($groupId, $app->request->getIp())) {
            return $this->app->response([
                'success' => false,
                'error' => [
                    'message' => 'Request not allowed from IP address',
                ]
            ]);
        }

        // =============================================================================
        // Fetch information about the latest version to the admin
        // when they first log in.
        // =============================================================================
        if (is_null($user['last_login']) && $user['group'] == 1) {
            $_SESSION['first_version_check'] = true;
        }

        // @todo: Login should fail on correct information when user is not active.
        $response['success'] = $auth->login($user['id'], $user['password'], $user['salt'], $password);

        // When the credentials are correct but the user is Inactive
        $isUserActive = false;
        // TODO: Add a method in RowGateway to check whether the user is active or not
        // TODO: Add information about the user status
        if ($user['status'] == STATUS_ACTIVE_NUM) {
            $isUserActive = true;
        }

        if ($response['success'] && !$isUserActive) {
            $auth->logout();
            $response['success'] = false;
            $response['error']['message'] = __t('login_error_user_is_not_active');

            return $this->app->response($response);
        }

        if ($response['success']) {
            // Set logged user to the ACL
            $acl->setUserId($user['id']);
            $acl->setGroupId($user['group']);

            $app->hookEmitter->run('directus.authenticated', [$app, $user]);
            $app->hookEmitter->run('directus.authenticated.admin', [$app, $user]);
            unset($response['message']);
            $response['last_page'] = json_decode($user['last_page']);
            $userSession = $auth->getUserInfo();
            $set = [
                'ip' => get_request_ip(),
                'last_login' => DateUtils::now(),
                'access_token' => $userSession['access_token']
            ];
            $where = ['id' => $user['id']];
            $updateResult = $Users->ignoreFilters()->update($set, $where, null);

            $Activity = new DirectusActivityTableGateway($ZendDb, null);
            $Activity->recordLogin($user['id']);
        }

        return $this->app->response($response);
    }

    public function logout($inactive = null)
    {
        $app = $this->app;
        $auth = $app->container->get('auth');
        if ($auth->loggedIn()) {
            $auth->logout();
        }

        if ($inactive) {
            $app->redirect(get_directus_path('/login.php?inactive=1'));
        } else {
            $app->redirect(get_directus_path('/login.php'));
        }
    }

    public function resetPassword($token)
    {
        $app = $this->app;
        $auth = $app->container->get('auth');
        $ZendDb = $app->container->get('zenddb');

        $DirectusUsersTableGateway = new DirectusUsersTableGateway($ZendDb, null);
        $user = $DirectusUsersTableGateway->findOneBy('reset_token', $token);

        if (!$user) {
            $app->halt(200, __t('password_reset_incorrect_token'));
        }

        $expirationDate = new \DateTime($user['reset_expiration'], new \DateTimeZone('UTC'));
        if (DateUtils::hasPassed($expirationDate)) {
            $app->halt(200, __t('password_reset_expired_token'));
        }

        $password = StringUtils::randomString();
        $set = [];
        // @NOTE: this is not being used for hashing the password anymore
        $set['salt'] = StringUtils::randomString();
        $set['password'] = $auth->hashPassword($password, $set['salt']);
        $set['reset_token'] = '';

        // Skip ACL
        $DirectusUsersTableGateway = new \Zend\Db\TableGateway\TableGateway('directus_users', $ZendDb);
        $affectedRows = $DirectusUsersTableGateway->update($set, ['id' => $user['id']]);

        if (1 !== $affectedRows) {
            $app->halt(200, __t('password_reset_error'));
        }

        send_forgot_password_email($user, $password);

        $app->halt(200, __t('password_reset_new_temporary_password_sent'));
    }

    public function forgotPassword()
    {
        $app = $this->app;
        $ZendDb = $app->container->get('zenddb');

        $email = $app->request()->post('email');
        if (!isset($email)) {
            return $this->app->response([
                'success' => false,
                'error' => [
                    'message' => __t('invalid_email')
                ]
            ]);
        }

        $DirectusUsersTableGateway = new DirectusUsersTableGateway($ZendDb, null);
        $user = $DirectusUsersTableGateway->findOneBy('email', $email);

        if (false === $user) {
            return $this->app->response([
                'success' => false,
                'error' => [
                    'message' => __t('password_forgot_no_account_found')
                ]
            ]);
        }

        $set = [];
        $set['reset_token'] = StringUtils::randomString(30);
        $set['reset_expiration'] = DateUtils::inDays(2);

        // Skip ACL
        $DirectusUsersTableGateway = new \Zend\Db\TableGateway\TableGateway('directus_users', $ZendDb);
        $affectedRows = $DirectusUsersTableGateway->update($set, ['id' => $user['id']]);

        if (1 !== $affectedRows) {
            return $this->app->response([
                'success' => false
            ]);
        }

        send_reset_password_email($user, $set['reset_token']);

        return $this->app->response([
            'success' => true
        ]);
    }

    public function permissions()
    {
        $acl = $this->app->container->get('acl');

        return $this->app->response([
            'data' => $acl->getGroupPrivileges()
        ]);
    }

    public function session()
    {
        return $this->app->response($_SESSION);
    }

    public function clearSession()
    {
        $_SESSION = [];
        if (ini_get('session.use_cookies')) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000,
                $params['path'], $params['domain'],
                $params['secure'], $params['httponly']
            );
        }

        session_destroy();
        return $this->app->response($_SESSION);
    }
}
