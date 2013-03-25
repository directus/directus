<?php

namespace Directus;

class Middleware extends \Slim\Middleware {

	const MATCHES_ROUTE_WHITELIST = 1;

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
	 * @param array $routeWhitelist
	 */
	public function __construct(array $routeWhitelist) {
		$this->routeWhitelist = $routeWhitelist;
	}

	public function call() {

		/**
		 * Don't protect the patterns specified on initialization.
		 */
		$path = $this->app->request()->getPathInfo();
		foreach ($this->routeWhitelist as $pattern) {
			if(preg_match($pattern, $path)) {
				$this->next->call();
				// Indicate to the middleware extending this to
				// skip their enforcement
				return self::MATCHES_ROUTE_WHITELIST;
			}
		}

		parent::call();

	}

}