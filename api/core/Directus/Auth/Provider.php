<?php

namespace Directus\Auth;

use Directus\Bootstrap;

class Provider {

    const USER_RECORD_CACHE_SESSION_KEY = 'auth_provider_user_record_cache';

    protected static $prependedSessionKey = false;

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
            throw new \RuntimeException("You must define session.prefix in api/configuration.php - see example configuration file.");
        }
        self::$SESSION_KEY = $config['session']['prefix'] . self::$SESSION_KEY;
        self::$prependedSessionKey = true;
    }

    protected static function enforceUserIsAuthenticated() {
        self::prependSessionKey();
        if(!self::loggedIn()) {
            throw new UserIsntLoggedInException("Attempting to inspect the authenticated user when a user isn't authenticated.");
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
        self::prependSessionKey();
        if(php_sapi_name() != 'cli' && "" === session_id()) {
            session_start();
        }
        return isset($_SESSION[self::$SESSION_KEY]) && !empty($_SESSION[self::$SESSION_KEY]);
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
            throw new \RuntimeException("Undefined user cache refresh provider.");
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
            throw new \InvalidArgumentException("Argument must be callable");
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
            throw new UserAlreadyLoggedInException("Attempting to authenticate a user when a user is already authenticated.");
        }
        $user = array( 'id' => $uid );
        $_SESSION[self::$SESSION_KEY] = $user;
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
        // This is not working --
        $PHPass = new \Directus\Auth\PasswordHash(8, true);
        return $PHPass->HashPassword( $salt . $password );
    }

}

/**
 * Exceptions
 */

class UserAlreadyLoggedInException extends \Exception {}

class UserIsntLoggedInException extends \Exception {}