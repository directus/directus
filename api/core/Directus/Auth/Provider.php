<?php

/**
 * Directus – <http://getdirectus.com>
 *
 * @link      The canonical repository – <https://github.com/directus/directus>
 * @copyright Copyright 2006-2016 RANGER Studio, LLC – <http://rangerstudio.com>
 * @license   GNU General Public License (v3) – <http://www.gnu.org/copyleft/gpl.html>
 */

namespace Directus\Auth;

use Directus\Auth\Exception\UserAlreadyLoggedInException;
use Directus\Auth\Exception\UserIsntLoggedInException;
use Directus\Bootstrap;
use Directus\Session\Session;
use Directus\Util\ArrayUtils;
use Directus\Util\StringUtils;
use Zend\Db\Adapter\Adapter;
use Zend\Db\TableGateway\TableGateway;

/**
 * Authentication Provider
 *
 * @author Daniel Bickett <daniel@rngr.org>
 * @author Jason El-Massih <jason@rngr.org>
 * @author Welling Guzmán <welling@rngr.org>
 */
class Provider
{
    const USER_RECORD_CACHE_SESSION_KEY = 'auth_provider_user_record_cache';

    protected $prependedSessionKey = false;
    protected $authenticated;
    protected $userCacheRefreshProvider;

    /**
     * The user ID of the public API user.
     *
     * @var integer
     */
    protected $PUBLIC_USER_ID = 0;

    /**
     * The key where we store authentication information on the session array.
     *
     * @var string
     */
    protected $SESSION_KEY = 'auth_user';

    /**
     * Db Connection
     *
     * @var Adapter
     */
    protected $dbConnection;

    /**
     * Session object
     *
     * @var Session
     */
    protected $session;

    /**
     * Session prefix
     *
     * @var array
     */
    protected $prefix;

    public function __construct(Adapter $dbConnection, Session $session, $prefix = 'directus_')
    {
        $this->dbConnection = $dbConnection;
        $this->session = $session;
        $this->prefix = $prefix;

        if (!is_string($this->prefix) || empty($prefix)) {
            throw new \RuntimeException(__t('you_must_define_session_prefix_in_configuration'));
        }
    }

    /**
     * Change where authentication information is stored on the session array.
     *
     * @param string $key
     *
     * @return  null
     */
    public function setSessionKey($key)
    {
        $this->SESSION_KEY = $key;
        $this->prependedSessionKey = false;
        $this->prependSessionKey();
    }

    /**
     * Get the session key
     *
     * @return string
     */
    public function getSessionKey()
    {
        return $this->SESSION_KEY;
    }

    /**
     * Prepend the prefix to the key
     *
     * @return void
     */
    protected function prependSessionKey()
    {
        // @TODO: Prepend should be done immediately
        if (!$this->prependedSessionKey) {
            $this->SESSION_KEY = $this->prefix . $this->SESSION_KEY;
            $this->prependedSessionKey = true;
        }
    }

    /**
     * @throws UserIsntLoggedInException
     */
    protected function enforceUserIsAuthenticated()
    {
        $this->prependSessionKey();
        if (!$this->loggedIn()) {
            throw new UserIsntLoggedInException(__t('attempting_to_inspect_the_authenticated_user_when_a_user_is_not_authenticated'));
        }
    }

    /**
     * Attempt authentication after user submission.
     *
     * @param  int $uid The User account's ID.
     * @param  string $password The User account's (actual) hashed password string.
     * @param  string $salt The User account's salt string.
     * @param  string $passwordAttempt The User's attempted, unhashed password string.
     *
     * @return boolean
     */
    public function login($uid, $password, $salt, $passwordAttempt)
    {
        $this->prependSessionKey();
        if ($this->needsReHashPassword($password, $salt, $passwordAttempt)) {
            $password = $this->hashPassword($passwordAttempt);
            // TODO: Pass the user table instead
            $zendDb = $this->dbConnection;
            $usersTable = new TableGateway('directus_users', $zendDb);
            $usersTable->update([
                'password' => $password,
                'access_token' => sha1($uid . StringUtils::random())
            ], ['id' => $uid]);
        }

        if (password_verify($passwordAttempt, $password)) {
            $this->completeLogin($uid);
            return true;
        }

        return false;
    }

    public static function verify($email, $password)
    {
        return self::getUserByAuthentication($email, $password) !== false;
    }

    public static function getUserByAuthentication($email, $password)
    {
        self::prependSessionKey();
        $zendDb = Bootstrap::get('zendDb');
        $usersTable = new TableGateway('directus_users', $zendDb);
        $user = $usersTable->select(['email' => $email])->current();
        $correct = false;

        if ($user) {
            $passwordHash = $user['password'];
            $correct = password_verify($password, $passwordHash);
        }

        return $correct ? $user : false;
    }

    /**
     * Force a user id to be the logged user
     *
     * @param  int $uid The User account's ID.
     *
     * @return boolean
     */
    public function setLoggedUser($uid)
    {
        $this->authenticated = false;
        $this->completeLogin($uid);
    }

    /**
     * De-authenticate the logged-in user.
     *
     * @return null
     *
     * @throws  \Directus\Auth\Exception\UserIsntLoggedInException
     */
    public function logout()
    {
        $this->prependSessionKey();
        $this->enforceUserIsAuthenticated();
        $this->expireCachedUserRecord();
        $this->session->set($this->SESSION_KEY, []);
    }

    /**
     * Check if a user is logged in.
     *
     * @return boolean
     */
    public function loggedIn()
    {
        if ($this->authenticated != null) {
            return $this->authenticated;
        }

        $this->prependSessionKey();
        if (!$this->session->isStarted()) {
            $this->session->start();
        }

        $this->authenticated = $isLoggedIn = false;
        $ZendDb = $this->dbConnection;
        $session = $this->session->get($this->SESSION_KEY);
        if (is_array($session) && ArrayUtils::contains($session, ['id', 'access_token'])) {
            $DirectusUsersTableGateway = new TableGateway('directus_users', $ZendDb);

            $user = $DirectusUsersTableGateway->select([
                'id' => $session['id'],
                'access_token' => $session['access_token']
            ]);

            if ($user->count()) {
                $this->authenticated = $isLoggedIn = true;
            }
        }

        return $isLoggedIn;
    }

    /**
     * Retrieve metadata about the currently logged in user.
     *
     * @param null|string $attribute
     *
     * @return mixed|array Authenticated user metadata.
     *
     * @throws  \Directus\Auth\Exception\UserIsntLoggedInException
     */
    public function getUserInfo($attribute = null)
    {
        $this->prependSessionKey();
        $this->enforceUserIsAuthenticated();

        $info = $this->session->get($this->SESSION_KEY);
        if ($attribute !== null) {
            return array_key_exists($attribute, $info) ? $info[$attribute] : null;
        }

        return $info;
    }

    public function expireCachedUserRecord()
    {
        $this->prependSessionKey();

        $this->session->set(self::USER_RECORD_CACHE_SESSION_KEY, null);
    }

    public function getUserRecord()
    {
        $this->prependSessionKey();
        $this->enforceUserIsAuthenticated();

        $userRefreshProvider = $this->userCacheRefreshProvider;
        if (!is_callable($userRefreshProvider)) {
            throw new \RuntimeException(__t('undefined_user_cache_refresh_provider'));
        }

        /**
         * @todo  tmp until cache expiration is nailed down.
         */
        $userInfo = $this->getUserInfo();

        return $userRefreshProvider($userInfo['id']);
    }

    public function setUserCacheRefreshProvider($callable)
    {
        $this->prependSessionKey();
        if (!is_callable($callable)) {
            throw new \InvalidArgumentException(__t('argument_must_be_callable'));
        }

        $this->userCacheRefreshProvider = $callable;
    }

    /**
     * After a successful login attempt, registers the user in the session.
     *
     * @param  int $uid The User account's ID.
     *
     * @return null
     *
     * @throws  \Directus\Auth\Exception\UserAlreadyLoggedInException
     */
    private function completeLogin($uid)
    {
        $this->prependSessionKey();
        if ($this->loggedIn()) {
            throw new UserAlreadyLoggedInException(__t('attempting_to_authenticate_a_user_when_a_user_is_already_authenticated'));
        }

        $user = ['id' => $uid, 'access_token' => sha1($uid . StringUtils::randomString())];
        $this->session->set($this->SESSION_KEY, $user);
        $this->authenticated = true;
    }

    /**
     * Run the hashing algorithm on a password and salt value.
     *
     * @param  string $password
     * @param  string $salt
     *
     * @return string
     */
    public function hashPassword($password, $salt = '')
    {
        return password_hash($password, PASSWORD_DEFAULT, ['cost' => 12]);
    }

    /**
     * Check if the password hash needs to be rehashed
     *
     * @param  string $password The User account's (actual) hashed password string.
     * @param  string $salt The User account's salt string.
     * @param  string $passwordAttempt The User's attempted, unhashed password string.
     *
     * @return boolean
     */
    public function needsReHashPassword($password, $salt, $passwordAttempt)
    {
        // if this was the old hash algorithm (sha1), it needs to be rehashed
        if (sha1($salt . $passwordAttempt) === $password) {
            return true;
        }

        return false;
    }
}
