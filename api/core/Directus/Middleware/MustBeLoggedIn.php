<?php

namespace Directus\Middleware;

/**
 * Interrupt the request if the user is not authenticated.
 */
class MustBeLoggedIn extends \Slim\Middleware {

	/**
	 * @var \Directus\Auth\Provider
	 */
	protected $authProvider = null;

	/**
	 * Array of route regex patterns for which the authentication
	 * requirement should not be enforced.
	 * @var array
	 *
	 * @todo  I would much prefer if this were an array of route names, however
	 * the route object seems to be null: $this->app->router()->getCurrentRoute()
	 */
	protected $routeWhitelist = array();

	/**
	 * @param \Directus\Auth\Provider $authProvider
	 * @param array                   $routeWhitelist
	 */
	public function __construct(\Directus\Auth\Provider $authProvider, $routeWhitelist = array()) {
		$this->authProvider = $authProvider;
		$this->routeWhitelist = $routeWhitelist;
	}

	public function call() {

		/**
		 * Don't protect the patterns specified on initialization.
		 */
		$path = $this->app->request()->getPathInfo();
		foreach ($this->routeWhitelist as $pattern) {
			if(preg_match($pattern, $path))
				return $this->next->call();
		}

		if(!$this->authProvider->loggedIn()) {
			$response = $this->app->response();
			$this->app->halt(403, "You must be logged in to access the API.");
		}

		/** All good, proceed. */
		$this->next->call();
	}
}