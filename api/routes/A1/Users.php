<?php

namespace Directus\API\Routes\A1;

use Directus\Application\Application;
use Directus\Application\Route;
use Directus\Bootstrap;
use Directus\Cache\Response;
use Directus\Database\TableGateway\DirectusUsersTableGateway;
use Directus\Database\TableGatewayFactory;
use Directus\Exception\Http\BadRequestException;
use Directus\Mail\Mail;
use Directus\Permissions\Acl;
use Directus\Util\ArrayUtils;
use Directus\Util\DateUtils;
use Directus\Util\StringUtils;
use Directus\Util\Validator;
use Directus\View\JsonView;

class Users extends Route
{
    /** @var $usersGateway DirectusUsersTableGateway */
    protected $usersGateway;

    public function __construct(Application $app)
    {
        parent::__construct($app);

        $this->usersGateway = TableGatewayFactory::create('directus_users');
    }

    // /1.1/users/:id
    public function get($id = null)
    {
        $id = $this->getUserId($id);
        $params = $this->app->request()->get();

        if ($id) {
            $params['id'] = $id;
        }

        $user = $this->getEntriesAndSetResponseCacheTags($this->usersGateway, $params);

        return $this->app->response($user);
    }

    // /1.1/users/invitation
    public function invite()
    {
        $email = $this->app->request()->post('email');

        $emails = explode(',', $email);
        foreach ($emails as $email) {
            $this->sendInvitationTo($email);
        }

        return $this->app->response([
            'success' => true
        ]);
    }

    // /1.1/users/:id
    public function update($id = null)
    {
        $id = $this->getUserId($id);

        $usersGateway = $this->usersGateway;
        $requestPayload = $this->app->request()->post();

        $email = $this->app->request()->post('email');

        if($email || $this->app->request()->getMethod() == 'POST') {
            $this->validateEmailOrFail($email);
        }

        switch ($this->app->request()->getMethod()) {
            case 'DELETE':
                $requestPayload = [];
                $requestPayload['id'] = $id;
                $requestPayload['status'] = $usersGateway::STATUS_HIDDEN;
                break;
            case 'PATCH':
            case 'PUT':
                $requestPayload['id'] = $id;
                break;
            case 'POST':
                $user = $usersGateway->findOneBy('email', $email);

                if ($user) {
                    $requestPayload['id'] = $user['id'];
                    $requestPayload['status'] = $usersGateway::STATUS_ACTIVE;
                }
                break;
        }

        if(!empty($requestPayload['email'])) {
            $avatar = DirectusUsersTableGateway::get_avatar($requestPayload['email']);
            $requestPayload['avatar'] = $avatar;
        }

        $user = $usersGateway->updateRecord($requestPayload);

        return $this->get($user['id']);
    }


    protected function sendInvitationTo($email)
    {
        $this->validateEmailOrFail($email);
        // @TODO: Builder/Service to get table gateway
        // $usersRepository = $repositoryCollection->get('users');
        // $usersRepository->add();
        $ZendDb = $this->app->container->get('zenddb');
        $acl = $this->app->container->get('acl');
        $auth = $this->app->container->get('auth');
        $tableGateway = new DirectusUsersTableGateway($ZendDb, $acl);

        $token = StringUtils::randomString(128);
        $result = $tableGateway->insert([
            'status' => STATUS_DRAFT_NUM,
            'email' => $email,
            'token' => StringUtils::randomString(32),
            'invite_token' => $token,
            'invite_date' => DateUtils::now(),
            'invite_sender' => $auth->getUserInfo('id'),
            'invite_accepted' => 0
        ]);

        if ($result) {
            send_user_invitation_email($email, $token);
        }
    }

    protected function getUserId($id = null)
    {
        if ($id === 'me') {
            /** @var Acl $acl */
            $acl = $this->app->container->get('acl');
            $id = $acl->getUserId();
        }

        return $id;
    }

    protected function validateEmailOrFail($email)
    {
        if (!Validator::email($email)) {
            throw new BadRequestException(__t('invalid_email'));
        }
    }
}
