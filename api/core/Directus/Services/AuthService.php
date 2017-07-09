<?php

namespace Directus\Services;

use Directus\Database\TableGateway\DirectusPrivilegesTableGateway;
use Directus\Database\TableGateway\DirectusUsersTableGateway;

class AuthService extends AbstractService
{
    /**
     * Gets the user token using the authentication email/password combination
     *
     * @param $email
     * @param $password
     *
     * @return null|string
     */
    public function requestToken($email, $password)
    {
        $auth = $this->app->container->get('auth');

        if ($email && $password) {
            $user = $auth->getUserByAuthentication($email, $password);

            if ($user) {
                return $user['token'];
            }
        }

        return null;
    }

    public function authenticateUserWithEmail($email)
    {
        $container = $this->app->container;

        $dbConnection = $container->get('zenddb');
        $acl = $container->get('acl');
        $Users = new DirectusUsersTableGateway($dbConnection, $acl);
        $user = $Users->findOneBy('email', $email);

        if (!$user) {
            throw new \InvalidArgumentException(sprintf('User with email "%s" not found.', $email));
        }

        $authentication = $container->get('auth');
        $authentication->setLoggedUser($user['id']);

        $privilegesTable = new DirectusPrivilegesTableGateway($dbConnection, $acl);
        $privileges = $privilegesTable->getGroupPrivileges($user['group']);
        $acl->setGroupPrivileges($privileges);

        // @TODO: Adding an user should auto set its ID and GROUP
        $acl->setUserId($user['id']);
        $acl->setGroupId($user['group']);

        return $user;
    }
}
