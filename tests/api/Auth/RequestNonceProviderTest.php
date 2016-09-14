<?php

class RequestNonceProviderTest extends PHPUnit_Framework_TestCase
{
    protected $storage;
    protected $session;
    protected $nonceProvider;
    protected $nonceHeader;
    protected $nonces;
    protected $nonceValue;

    /**
     * @expectedException \Directus\Auth\Exception\RequestNonceHasntBeenProcessed
     */
    public function testNewNonceException()
    {
        $this->nonceProvider->getNewNoncesThisRequest();
    }

    public function testOptions()
    {
        $nonceProvider = $this->nonceProvider;

        $this->assertInternalType('array', $nonceProvider->getOptions());

        $options = $nonceProvider->getOptions();
        $this->assertSame(20, $options['nonce_pool_size']);
    }

    public function testEmptyNonce()
    {
        $storage = new \Directus\Session\Storage\ArraySessionStorage();
        $session = new \Directus\Session\Session($storage);
        $nonceProvider = new \Directus\Auth\RequestNonceProvider($session);

        $this->assertNotEmpty($nonceProvider->getAllNonces());
    }

    public function testNonce()
    {
        $nonceValue = $this->nonceValue;
        $nonceProvider = $this->nonceProvider;

        $this->assertEquals($this->nonces, $nonceProvider->getAllNonces());

        $this->assertFalse($nonceProvider->requestHasNonce());
        $this->assertFalse($nonceProvider->requestHasValidNonce());

        $this->assertNull($nonceProvider->getRequestNonce());
        $this->assertTrue($nonceProvider->nonceIsValid($nonceValue));

        // after a nonce is validated must be deleted from the nonce pool
        $this->assertFalse($nonceProvider->nonceIsValid($nonceValue));

        $_SERVER['HTTP_NONCE_HEADER'] = $nonceValue;

        $this->assertNotNull($nonceProvider->requestHasValidNonce());
        $this->assertSame($nonceValue, $nonceProvider->getRequestNonce());

        $this->assertInternalType('array', $nonceProvider->getNewNoncesThisRequest());
    }

   public function setUp()
    {
        $this->nonceValue = '123testnonce';
        $this->nonces = [
            'nonce1',
            'nonce2',
            'nonce3',
            'nonce4',
            'nonce5',
            $this->nonceValue
        ];

        $this->storage = new \Directus\Session\Storage\ArraySessionStorage();
        $this->storage->set('request_nonces', $this->nonces);
        $this->session = new \Directus\Session\Session($this->storage);
        $this->nonceHeader = 'nonce_header';

        $options = [
            'nonce_request_header' => $this->nonceHeader,
            'nonce_pool_size' => 20
        ];

        $this->nonceProvider = new \Directus\Auth\RequestNonceProvider($this->session, $options);
    }
}
