<?php

namespace Directus\Auth;

use Directus\Bootstrap;
use Directus\Util\StringUtils;
use Directus\Util\ArrayUtils;

class Provider {

    const USER_RECORD_CACHE_SESSION_KEY = 'auth_provider_user_record_cache';

    protected static $prependedSessionKey = false;
    protected static $authenticated;

    public static $userCacheRefreshProvider;

    /**
     * The user ID of the public API user.
     * @var integer
     */
    public static $PUBLIC_USER_ID = 0;

    /**
     * The key where we store authentication information on the session array.
     * @var string
     */
    public static $SESSION_KEY = "auth_user";

    /**
     * Change where authentication information is stored on the session array.
     * @param string $key
     * @return  null
     */
    public static function setSessionKey($key) {
        self::$SESSION_KEY = $key;
        self::$prependedSessionKey = false;
        self::prependSessionKey();
    }

    protected static function prependSessionKey() {
        if(self::$prependedSessionKey) {
            return;
        }
        $config = Bootstrap::get('config');
        if(!isset($config['session']) || !isset($config['session']['prefix']) || empty($config['session']['prefix'])) {
            throw new \RuntimeException(__t('you_must_define_session_prefix_in_configuration'));
        }
        self::$SESSION_KEY = $config['session']['prefix'] . self::$SESSION_KEY;
        self::$prependedSessionKey = true;
    }

    protected static function enforceUserIsAuthenticated() {
        self::prependSessionKey();
        if(!self::loggedIn()) {
            throw new UserIsntLoggedInException(__t('attempting_to_inspect_the_authenticated_user_when_a_user_is_not_authenticated'));
        }
    }

    /**
     * Attempt authentication after user submission.
     * @param  int $uid             The User account's ID.
     * @param  string $password        The User account's (actual) hashed password string.
     * @param  string $salt            The User account's salt string.
     * @param  string $passwordAttempt The User's attempted, unhashed password string.
     * @return boolean
     */
    public static function login($uid, $password, $salt, $passwordAttempt) {
        self::prependSessionKey();
        $hashedPasswordAttempt = self::hashPassword($passwordAttempt, $salt);
        if($password === $hashedPasswordAttempt) {
            self::completeLogin($uid);
            return true;
        }
        return false;
    }

    /**
     * Force a user id to be the logged user
     *
     * @param  int $uid             The User account's ID.
     * @return boolean
     */
    public static function setLoggedUser($uid) {
        self::completeLogin($uid);
    }

    /**
     * De-authenticate the logged-in user.
     * @return null
     * @throws  \Directus\Auth\UserIsntLoggedInException
     */
    public static function logout() {
        self::prependSessionKey();
        self::enforceUserIsAuthenticated();
        self::expireCachedUserRecord();
        $_SESSION[self::$SESSION_KEY] = array();
    }

    /**
     * Check if a user is logged in.
     * @return boolean
     */
    public static function loggedIn() {
        if (self::$authenticated != null) {
            return self::$authenticated;
        }

        self::prependSessionKey();
        if(php_sapi_name() != 'cli' && "" === session_id()) {
            session_start();
        }
        self::$authenticated = $isLoggedIn = false;
        $ZendDb = Bootstrap::get('ZendDb');
        $session = array();
        if (isset($_SESSION[self::$SESSION_KEY]) && !empty($_SESSION[self::$SESSION_KEY])) {
            $session = $_SESSION[self::$SESSION_KEY];
        }

        if (is_array($session) && ArrayUtils::contains($session, array('id', 'access_token'))) {
            $DirectusUsersTableGateway = new \Zend\Db\TableGateway\TableGateway('directus_users', $ZendDb);

            $user = $DirectusUsersTableGateway->select(array(
                'id' => $session['id'],
                'access_token' => $session['access_token']
            ));

            if ($user->count()) {
                self::$authenticated = $isLoggedIn = true;
            }
        }


        return $isLoggedIn;
    }

    /**
     * Retrieve metadata about the currently logged in user.
     * @return array Authenticated user metadata.
     * @throws  \Directus\Auth\UserIsntLoggedInException
     */
    public static function getUserInfo() {
        self::prependSessionKey();
        self::enforceUserIsAuthenticated();
        return $_SESSION[self::$SESSION_KEY];
    }

    public static function expireCachedUserRecord() {
        self::prependSessionKey();
        $_SESSION[self::USER_RECORD_CACHE_SESSION_KEY] = null;
    }

    public static function getUserRecord() {
        self::prependSessionKey();

        self::enforceUserIsAuthenticated();

        $userRefreshProvider = self::$userCacheRefreshProvider;
        if(!is_callable($userRefreshProvider)) {
            throw new \RuntimeException(__t('undefined_user_cache_refresh_provider'));
        }

        /**
         * @todo  tmp until cache expiration is nailed down.
         */
        $userInfo = self::getUserInfo();
        return $userRefreshProvider($userInfo['id']);

        if(!isset($_SESSION[self::USER_RECORD_CACHE_SESSION_KEY])) {
            self::expireCachedUserRecord();
        }
        $cachedUserRecord =& $_SESSION[self::USER_RECORD_CACHE_SESSION_KEY];
        if(is_null($cachedUserRecord)) {
            $userInfo = self::getUserInfo();
            $userRefreshProvider = self::$userCacheRefreshProvider;
            $cachedUserRecord = $userRefreshProvider($userInfo['id']);
        }
        return $cachedUserRecord;
    }

    public static function setUserCacheRefreshProvider($callable) {
        self::prependSessionKey();
        if(!is_callable($callable)) {
            throw new \InvalidArgumentException(__t('argument_must_be_callable'));
        }
        self::$userCacheRefreshProvider = $callable;
    }

    /**
     * After a successful login attempt, registers the user in the session.
     * @param  int $uid The User account's ID.
     * @return null
     * @throws  \Directus\Auth\UserAlreadyLoggedInException
     */
    private static function completeLogin($uid) {
        self::prependSessionKey();
        if(self::loggedIn()) {
            throw new UserAlreadyLoggedInException(__t('attempting_to_authenticate_a_user_when_a_user_is_already_authenticated'));
        }
        $user = array( 'id' => $uid, 'access_token' => sha1($uid.StringUtils::random()) );
        $_SESSION[self::$SESSION_KEY] = $user;
        self::$authenticated = true;
    }

    /**
     * Run the hashing algorithm on a password and salt value.
     * @param  string $password
     * @param  string $salt
     * @return string
     */
    public static function hashPassword($password, $salt = '') {
        $composite = $salt . $password;
        return sha1( $composite );
    }

}

/**
 * Exceptions
 */

class UserAlreadyLoggedInException extends \Exception {}

class UserIsntLoggedInException extends \Exception {}
