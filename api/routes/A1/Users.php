<?php

namespace Directus\API\Routes\A1;

use Directus\Application\Route;
use Directus\Database\TableGateway\DirectusUsersTableGateway;
use Directus\Mail\Mail;
use Directus\Util\ArrayUtils;
use Directus\Util\DateUtils;
use Directus\Util\StringUtils;
use Directus\Util\Validator;
use Directus\View\JsonView;

class Users extends Route
{
    // /1.1/users
    public function all()
    {
        $entries = new Entries($this->app);

        return $entries->rows('directus_users');
    }

    // /1.1/users/:id
    public function get($id)
    {
        $entries = new Entries($this->app);

        return $entries->row('directus_users', $id);
    }

    // /1.1/users/invitation
    public function invite()
    {
        $email = $this->app->request()->post('email');

        if (!Validator::email($email)) {
            $this->app->response()->setStatus(400);
            return JsonView::render([
                'success' => false,
                'error' => [
                    'code' => 'invalid_email',
                    'message' => 'invalid_email'
                ]
            ]);
        }

        // @TODO: Builder/Service to get table gateway
        // $usersRepository = $repositoryCollection->get('users');
        // $usersRepository->add();
        $ZendDb = $this->app->container->get('zenddb');
        $acl = $this->app->container->get('acl');
        $auth = $this->app->container->get('auth');
        $tableGateway = new DirectusUsersTableGateway($ZendDb, $acl);

        $token = StringUtils::randomString(128);
        $result = $tableGateway->insert([
            STATUS_COLUMN_NAME => STATUS_DRAFT_NUM,
            'email' => $email,
            'token' => StringUtils::randomString(32),
            'invite_token' => $token,
            'invite_date' => DateUtils::now(),
            'invite_sender' => $auth->getUserInfo('id'),
            'invite_accepted' => 0
        ]);

        $response = [];
        if ($result) {
            $data = ['token' => $token];
            Mail::send('mail/user-invitation.twig.html', $data, function ($message) use ($email) {
                $message->setSubject('Invitation');
                $message->setTo($email);
            });
        }

        return JsonView::render($response);
    }
}
