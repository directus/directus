<?php

namespace Directus\Middleware;

use \Directus\Auth\Provider as AuthProvider;

/**
 * Interrupt the request if the user is not authenticated.
 */
class MustBeLoggedIn extends \Directus\Middleware {

    /**
     * @var \Directus\Auth\Provider
     */
    protected $authProvider = null;

    /**
     * @param array                   $routeWhitelist
     * @param \Directus\Auth\Provider $authProvider
     */
    public function __construct($routeWhitelist = array(), AuthProvider $authProvider) {
        parent::__construct($routeWhitelist);
        $this->authProvider = $authProvider;
    }

    public function call() {
        $outcome = parent::call();

        // Did \Directus\Middleware detect that the route matches the whitelist?
        // If so, skip enforcement.
        // NOTE: $this->next->call() has already run!
        if(self::MATCHES_ROUTE_WHITELIST == $outcome)
            return;

        if(!$this->authProvider->loggedIn()) {
            $response = $this->app->response();
            $this->app->halt(401, "You must be logged in to access the API.");
        }

        /** All good, proceed. */
        $this->next->call();
    }
}