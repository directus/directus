<?php

namespace Directus\Middleware;

use Directus\Auth\RequestNonceProvider;

/**
 * Interrupt the request if the request does not contain a valid nonce.
 */
class MustHaveRequestNonce extends \Directus\Middleware {

	/**
	 * @var \Directus\Auth\RequestNonceProvider
	 */
	private $requestNonceProvider;

	/**
	 * @param array                $routeWhitelist
	 * @param RequestNonceProvider $requestNonceProvider
	 */
	public function __construct($routeWhitelist = array(), RequestNonceProvider $requestNonceProvider) {
		parent::__construct($routeWhitelist);
		$this->requestNonceProvider = $requestNonceProvider;
	}

	public function call() {

		$outcome = parent::call();

		// Did \Directus\Middleware detect that the route matches the whitelist?
		// If so, skip enforcement.
		// NOTE: $this->next->call() has already run!
		if(self::MATCHES_ROUTE_WHITELIST == $outcome)
			return;

		if(!$this->requestNonceProvider->requestHasValidNonce())
			$this->app->halt(401, "Invalid request (nonce).");

		$response = $this->app->response();
        $newNonces = $this->requestNonceProvider->getNewNoncesThisRequest();

        $nonce_options = $this->requestNonceProvider->getOptions();

	    $response[$nonce_options['nonce_response_header']] = implode($newNonces, ",");

	    // $log = $this->app->getLog();
	    // $log->info("REQUEST_URI:");
	    // $log->info($_SERVER['REQUEST_URI']);
	    // $log->info("Nonce pool size:");
	    // $log->info(count($_SESSION['request_nonces']));
	    // $log->info("Received nonce:");
	    // $log->info($this->requestNonceProvider->getRequestNonce());
	    // $log->info("New nonces:");
	    // $log->info(print_r($newNonces, true));

		/** All good, proceed. */
		$this->next->call();
	}
}