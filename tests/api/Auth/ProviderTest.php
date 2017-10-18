<?php

use Directus\Authentication\Provider as Auth;

class ProviderTest extends PHPUnit_Framework_TestCase
{
    /**
     * Authentication provider
     *
     * @var \Directus\Authentication\Provider
     */
    protected $provider;

    /**
     * @var \Zend\Db\Adapter\Adapter
     */
    protected $adapter;

    /**
     * @var \Directus\Database\TableGateway\BaseTableGateway
     */
    protected $table;

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
        $this->table = $this->getTableGateway($this->adapter);

        $this->provider = new Auth($this->table, $this->session, $this->prefix);
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
        $session = get_array_session();

        $this->provider = new Auth($this->table, $session, 1);
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
        $result = $auth->login(1, $passwordHashed, $salt, $password, true);
        $this->assertFalse($result);

        $passwordHashed = sha1($salt . $password);
        $result = $auth->login(1, $passwordHashed, $salt, $password, true);
        $this->assertTrue($result);
    }

    public function testLogin()
    {
        $auth = $this->provider;
        $password = '123456';
        $salt = 'salt';

        $passwordHashed = $auth->hashPassword($password, $salt);
        $result = $auth->login(1, $passwordHashed, $salt, $password, true);
        $this->assertTrue($result);
    }

    public function testSuccessAuthenticationByUser()
    {
        $password = '123456';
        $salt = 'salt';

        $adapter = get_mock_adapter($this, ['result_data' => [
            'password' => $this->provider->hashPassword($password, $salt)
        ]]);

        $table = $this->getTableGateway($adapter);
        $auth = new \Directus\Authentication\Provider($table, $this->session);

        $user = $auth->getUserByAuthentication('email@mail.com', '123456');
        $this->assertNotEquals($user, false);

        $this->assertTrue($auth->verify('email@mail.com', '123456'));
    }

    public function testFailAuthenticationByUser()
    {
        $password = 'secret';
        $salt = 'salt';

        $adapter = get_mock_adapter($this, ['result_data' => [
            'password' => $this->provider->hashPassword($password, $salt)
        ]]);

        $table = $this->getTableGateway($adapter);
        $auth = new \Directus\Authentication\Provider($table, $this->session);

        $user = $auth->getUserByAuthentication('email@mail.com', '123456');
        $this->assertFalse($user);

        $this->assertFalse($auth->verify('email@mail.com', '123456'));
    }

    /**
     * @expectedException \Directus\Authentication\Exception\UserAlreadyLoggedInException
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
     * @expectedException \Directus\Authentication\Exception\UserIsntLoggedInException
     */
    public function testGetUserInfoException()
    {
        $session = get_array_session();
        $provider = new Auth($this->table, $session, $this->prefix);

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
        $table = $this->getTableGateway($adapter);
        $session = get_array_session();

        $provider = new Auth($table, $session, $this->prefix);

        $session->set($this->prefix . $provider->getSessionKey(), [
            'id' => 1,
            'access_token' => 'accessTokenTest'
        ]);

        $this->assertTrue($provider->loggedIn());
    }

    public function testSetLoggedUser()
    {
        $this->provider->setLoggedUser(2, true);

        $this->assertSame(2, $this->provider->getUserInfo('id'));
        $this->assertTrue($this->provider->loggedIn());
    }

    /**
     * @expectedException \Directus\Authentication\Exception\UserIsntLoggedInException
     */
    public function testLogoutException()
    {
        $session = get_array_session();
        $provider = new Auth($this->table, $session, $this->prefix);

        $provider->logout(true);
    }

    public function testLogout()
    {
        $this->testLogin();
        $this->provider->logout(true);
        $session = $this->session->get($this->provider->getSessionKey());
        $this->assertEmpty($session);
    }

    /**
     * @param $adapter
     *
     * @return \Directus\Database\TableGateway\DirectusUsersTableGateway
     */
    protected function getTableGateway($adapter)
    {
        return new \Directus\Database\TableGateway\DirectusUsersTableGateway($adapter);
    }
}
