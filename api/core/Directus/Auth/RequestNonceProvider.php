<?php

namespace Directus\Auth;

class RequestNonceProvider {

	private $options = array();

	private $valid_nonce_this_request = null;

	private $new_nonces_this_request = array();

	public function __construct($options = array()) {
		$default_options = array(
			'nonce_pool_size' => 10,
			'nonce_request_field_name' => 'directus_request_nonce'
		);

		$this->options = array_merge($default_options, $options);

		if("" == session_id())
			session_start();

		if(!isset($_SESSION['request_nonces']))
			$_SESSION['request_nonces'] = array();

		$this->nonce_pool = &$_SESSION['request_nonces'];

		if(empty($this->nonce_pool))
			$this->replenishNoncePool();
	}

	/**
	 * If the nonce pool is less than its configured size, fill it up.
	 * @return null
	 */
	private function replenishNoncePool() {
		if(count($this->nonce_pool) < $this->options['nonce_pool_size']) {
			for($i = 0; $i < $this->options['nonce_pool_size']; $i++) {
				$nonce = $this->makeNonce();
				$this->nonce_pool[] = $nonce;
				$this->new_nonces_this_request[] = $nonce;
			}
		}
	}

	/**
	 * Allows for easy swapping out of nonce generator.
	 * @return string One unique nonce
	 */
	private function makeNonce() {
		return uniqid();
	}

	/**
	 * If the request ($_REQUEST) has a value in the configured nonce field,
	 * either in the GET or POST data, return it. Otherwise return False.
	 * @return mixed The nonce string or False if it isn't present.
	 */
	public function getRequestNonce() {
		$nonce_field_name = $this->options['nonce_request_field_name'];
		if(isset($_REQUEST[$nonce_field_name]))
			return $_REQUEST[$nonce_field_name];
		return false;
	}

	/**
	 * @return boolean Does the request have a populated nonce field.
	 */
	public function requestHasNonce() {
		$nonce = $this->getRequestNonce();
		return !empty($nonce);
	}

	/**
	 * Check if the request contains a valid nonce.
	 * If it does, remove the used nonce from the nonce pool, and replenish the pool.
	 * @return boolean Does the request contain a valid nonce.
	 */
	public function requestHasValidNonce() {
		// Cache this request's result
		if(is_null($this->valid_nonce_this_request)) {
			$request_nonce = $this->getRequestNonce();
			$this->valid_nonce_this_request = false;
			if($index = array_search($request_nonce, $this->nonce_pool)) {
				$this->valid_nonce_this_request = true;
				// Remove the used nonce from the nonce pool
				unset($this->nonce_pool[$index]);
				$this->replenishNoncePool();
			}
		}
		return $this->valid_nonce_this_request;
	}

	public function getNewNoncesThisRequest() {
		if(is_null($this->valid_nonce_this_request)) {
			$message = "You can fetch new nonces after checking the request for old ones.";
			throw new NoncesAreGeneratedAfterCheckingRequestException($message);
		}
		return $this->new_nonces_this_request;
	}

}

/**
 * Exceptions
 */

class NoncesAreGeneratedAfterCheckingRequestException extends \Exception {}
