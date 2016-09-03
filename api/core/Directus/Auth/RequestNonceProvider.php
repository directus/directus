<?php

namespace Directus\Auth;

use Directus\Util\StringUtils;

class RequestNonceProvider
{

    /**
     * Define via constructor argument.
     * See constructor for defaults.
     * @var array
     */
    private $options = array();

    /**
     * Cache return val for #requestHasValidNonce()
     * Access using that function.
     * @var [type]
     */
    private $valid_nonce_this_request = null;

    /**
     * Cache return val for #getRequestNonce()
     * Access using that function.
     * @var array
     */
    private $nonce_this_request = null;

    /**
     * Populated by #replenishNoncePool()
     * Access using #getNewNoncesThisRequest()
     * @var array
     */
    private $new_nonces_this_request = array();

    public function __construct($options = array())
    {
        $default_options = array(
            'nonce_pool_size' => 10,
            'nonce_request_header' => 'X-Directus-Request-Nonce',
            'nonce_response_header' => 'X-Directus-New-Request-Nonces'
        );

        $this->options = array_merge($default_options, $options);

        if ('' == session_id()) {
            session_start();
        }

        if (!isset($_SESSION['request_nonces'])) {
            $_SESSION['request_nonces'] = array();
        }

        $this->nonce_pool = &$_SESSION['request_nonces'];

        if (empty($this->nonce_pool)) {
            $this->replenishNoncePool();
        }
    }

    /**
     * If the nonce pool is less than its configured size, fill it up.
     * @return null
     */
    private function replenishNoncePool()
    {
        if (count($this->nonce_pool) < $this->options['nonce_pool_size']) {
            for ($i = count($this->nonce_pool); $i < $this->options['nonce_pool_size']; $i++) {
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
    private function makeNonce()
    {
        do {
            $nonce = StringUtils::randomString();
        } while ($this->nonceExists($nonce));

        return $nonce;
    }

    /**
     * If the request headers have a value in the configured nonce header,
     * return it. Otherwise return False.
     * @return mixed The nonce string or False if it isn't present.
     */
    public function getRequestNonce()
    {
        if (is_null($this->nonce_this_request)) {
            $nonce_header = $this->options['nonce_request_header'];
            $this->nonce_this_request = false;
            $headerAsSuperglobalKey = 'HTTP_' . strtoupper(str_replace('-', '_', $nonce_header));
            if (isset($_SERVER[$headerAsSuperglobalKey])) {
                $this->nonce_this_request = $_SERVER[$headerAsSuperglobalKey];
            }
        }
        return $this->nonce_this_request;
    }

    /**
     * @return boolean Does the request have a populated nonce field.
     */
    public function requestHasNonce()
    {
        $nonce = $this->getRequestNonce();
        return !empty($nonce);
    }

    /**
     * Check if the request contains a valid nonce.
     * If it does, remove the used nonce from the nonce pool, and replenish the pool.
     * @return boolean Does the request contain a valid nonce.
     */
    public function requestHasValidNonce()
    {
        // Cache this request's result
        if (is_null($this->valid_nonce_this_request)) {
            $request_nonce = $this->getRequestNonce();
            $this->nonceIsValid($request_nonce);
        }
        return $this->valid_nonce_this_request;
    }

    public function nonceIsValid($nonce)
    {
        $this->valid_nonce_this_request = false;
        $index = array_search($nonce, $this->nonce_pool);
        if (false !== $index) {
            // Remove the used nonce from the nonce pool
            unset($this->nonce_pool[$index]);
            $this->replenishNoncePool();
            $this->valid_nonce_this_request = true;
        }
        return $this->valid_nonce_this_request;
    }

    /**
     * Check whether a nonce exists in the nonce pool
     * @param $nonce
     * @return bool
     */
    public function nonceExists($nonce)
    {
        $index = array_search($nonce, $this->nonce_pool);

        return $index !== false;
    }

    /**
     * @return array Array of string nonces
     */
    public function getNewNoncesThisRequest()
    {
        if (is_null($this->valid_nonce_this_request)) {
            $message = 'You can fetch new nonces after checking the request for old ones.';
            throw new RequestNonceHasntBeenProcessed($message);
        }
        // Force array on json encode
        return array_values($this->new_nonces_this_request);
    }

    /**
     * @return array Array of string nonces
     */
    public function getAllNonces()
    {
        // Force array on json encode
        return array_values($this->nonce_pool);
    }

    public function getOptions()
    {
        return $this->options;
    }

}

/**
 * Exceptions
 */
class RequestNonceHasntBeenProcessed extends \Exception
{
}
