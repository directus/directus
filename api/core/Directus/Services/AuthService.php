<?php

namespace Directus\Services;

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
}