<?php

namespace Directus\Authentication\Sso;

use Directus\Authentication\User\User;

class SocialUser extends User
{
    /**
     * @return string
     */
    public function getToken()
    {
        return $this->get('social_token');
    }
}
