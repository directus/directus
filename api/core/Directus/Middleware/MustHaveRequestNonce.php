<?php

namespace Directus\Middleware;

use Directus\Auth\RequestNonceProvider;

/**
 * Interrupt the request if the request does not contain a valid nonce.
 */
class MustHaveRequestNonce extends \Slim\Middleware {

	/**
	 * @var \Directus\Auth\RequestNonceProvider
	 */
	private $requestNonceProvider;

	public function __construct(RequestNonceProvider $requestNonceProvider) {
		$this->requestNonceProvider = $requestNonceProvider;
	}

	public function call() {
		if(!$this->requestNonceProvider->requestHasValidNonce())
			$this->app->halt(401, "Invalid request (nonce).");

		/** All good, proceed. */
		$this->next->call();
	}
}