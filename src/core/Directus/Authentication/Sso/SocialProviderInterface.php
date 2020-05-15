<?php

namespace Directus\Authentication\Sso;

use Directus\Authentication\User\UserInterface;
use Directus\Collection\Collection;

interface SocialProviderInterface
{
    /**
     * Returns the authentication request url
     *
     * @return string
     */
    public function getRequestAuthorizationUrl();

    /**
     * Redirects to the authentication request url
     *
     * @return void
     */
    public function request();

    /**
     * @return UserInterface
     *
     * @throws \Exception
     */
    public function handle();

    /**
     * Gets the provider config object
     *
     * @return Collection
     */
    public function getConfig();

    /**
     * Gets user object using the authorization code
     *
     * @param array $data
     *
     * @return SocialUser
     */
    public function getUserFromCode(array $data);
}
