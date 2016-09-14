<?php

use Directus\Auth\Provider as Auth;

class ProviderTest extends PHPUnit_Framework_TestCase
{
    /**
     * Authentication provider
     *
     * @var \Directus\Auth\Provider
     */
    protected $provider;

    /**
     * @var \Zend\Db\Adapter\Adapter
     */
    protected $adapter;

    /**
     * @var \Directus\Session\Session;
     */
    protected $session;

    /**
     * Authentication prefix
     *
     * @var string
     */
    protected $prefix = 'directus_';

    public function setUp()
    {
        $this->adapter = get_mock_adapter($this);
        $this->session = get_array_session();

        $this->provider = new Auth($this->adapter, $this->session, $this->prefix);
    }

    public function tearUp()
    {
        $this->adapter = $this->session = $this->provider = null;
    }

    /**
     * @expectedException RuntimeException
     */
    public function testInvalidPrefix()
    {
        $adapter = get_mock_adapter($this);
        $session = get_array_session();

        $this->provider = new Auth($adapter, $session, 1);
    }

    public function testSessionKey()
    {
        $auth = $this->provider;

        $sessionKey = $auth->getSessionKey();
        $this->assertInternalType('string', $sessionKey);

        $auth->setSessionKey('user');
        $this->assertSame($this->prefix . 'user', $auth->getSessionKey());
    }

    public function testLoginLegacyPassword()
    {
        $auth = $this->provider;
        $password = '123456';
        $salt = 'salt';
        $passwordHashed = sha1($password);

        // failed login
        $result = $auth->login(1, $passwordHashed, $salt, $password);
        $this->assertFalse($result);

        $passwordHashed = sha1($salt . $password);
        $result = $auth->login(1, $passwordHashed, $salt, $password);
        $this->assertTrue($result);
    }

    public function testLogin()
    {
        $auth = $this->provider;
        $password = '123456';
        $salt = 'salt';

        $passwordHashed = $auth->hashPassword($password, $salt);
        $result = $auth->login(1, $passwordHashed, $salt, $password);
        $this->assertTrue($result);
    }

    /**
     * @expectedException \Directus\Auth\Exception\UserAlreadyLoggedInException
     */
    public function testLoginSuccessfulTwice()
    {
        $this->testLogin();
        $this->testLoginLegacyPassword();
    }

    /**
     * @expectedException \InvalidArgumentException
     */
    public function testRefreshCallable()
    {
        $this->provider->setUserCacheRefreshProvider(true);
    }

    /**
     * @expectedException \RuntimeException
     */
    public function testGetUserRecordException()
    {
        $this->testLogin();
        $this->provider->getUserRecord();
    }

    public function testGetUserRecord()
    {
        $this->testLogin();

        $userData = [
            'id' => 1,
            'email' => 'admin@demo.local'
        ];

        $this->provider->setUserCacheRefreshProvider(function($id) use ($userData) {
           return $userData;
        });

        $data = $this->provider->getUserRecord();
        $this->assertSame($data, $userData);
    }

    public function testExpireCachedUserRecord()
    {
        $auth = $this->provider;
        $auth->expireCachedUserRecord();
        $this->assertNull($this->session->get($auth::USER_RECORD_CACHE_SESSION_KEY));
    }

    /**
     * @expectedException \Directus\Auth\Exception\UserIsntLoggedInException
     */
    public function testGetUserInfoException()
    {
        $adapter = get_mock_adapter($this);
        $session = get_array_session();
        $provider = new Auth($adapter, $session, $this->prefix);

        $provider->getUserInfo();
    }

    public function testGetUserInfo()
    {
        $this->testLogin();
        $this->assertInternalType('array', $this->provider->getUserInfo());

        $this->assertSame(1, $this->provider->getUserInfo('id'));
    }

    public function testLoggedIn()
    {
        $this->assertFalse($this->provider->loggedIn());
        $this->testLogin();
        $this->assertTrue($this->provider->loggedIn());

        $adapter = get_mock_adapter($this, ['result_count' => 1]);
        $session = get_array_session();

        $provider = new Auth($adapter, $session, $this->prefix);

        $session->set($this->prefix . $provider->getSessionKey(), [
            'id' => 1,
            'access_token' => 'accessTokenTest'
        ]);

        $this->assertTrue($provider->loggedIn());
    }

    public function testSetLoggedUser()
    {
        $this->provider->setLoggedUser(2);

        $this->assertSame(2, $this->provider->getUserInfo('id'));
        $this->assertTrue($this->provider->loggedIn());
    }

    /**
     * @expectedException \Directus\Auth\Exception\UserIsntLoggedInException
     */
    public function testLogoutException()
    {
        $adapter = get_mock_adapter($this);
        $session = get_array_session();
        $provider = new Auth($adapter, $session, $this->prefix);

        $provider->logout();
    }

    public function testLogout()
    {
        $this->testLogin();
        $this->provider->logout();
        $session = $this->session->get($this->provider->getSessionKey());
        $this->assertEmpty($session);
    }
}
