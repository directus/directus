<?php

namespace Directus\Middleware;

/**
 * Interrupt the request if the user is not authenticated.
 */
class MustBeLoggedIn extends \Slim\Middleware {

	protected $authProvider = null;

	public function __construct(\Directus\Auth\Provider $authProvider) {
		$this->authProvider = $authProvider;
	}

	public function call() {

		if(!$this->authProvider->loggedIn()) {
			$response = $this->app->response();
			$this->app->halt(403, "You must be logged in to access the API.");
		}

		/** All good, proceed. */
		$this->next->call();
	}
}