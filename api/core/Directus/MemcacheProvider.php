<?php

namespace Directus;

use Memcache;

/**
 * Class MemcacheProvider
 * @package Directus
 * Wraps the standard memcache methods to provide namespacing between branches/databases (namespace set in directus config-- untracked)
 */
class MemcacheProvider
{

    protected static $MEMCACHED_ENABLED = true;
    /**
     * Adds localhost memcache server only
     */
    protected static $LOCAL = false;
    /**
     * Default expire time for cache if not passes into a cache setter method
     */
    const DEFAULT_CACHE_EXPIRE_SECONDS = 300;
    /**
     * @todo populate these using config
     * @var array
     */
    private $memcachedServerAddresses = [
        'development' => [],
        'production' => []
    ];

    /**
     * @var bool
     */
    private $mc = false;

    /**
     * Instantiates memcache only if the extension is loaded and adds server(s) to the pool
     */
    public function __construct()
    {

        if (isset($_SERVER['SERVER_NAME'])) {
            if (false !== strpos($_SERVER['SERVER_NAME'], 'localhost')) {
                self::$MEMCACHED_ENABLED = false;
            }
        }

        $this->mc = false;
        if (extension_loaded('memcache') && self::$MEMCACHED_ENABLED && count($this->memcachedServerAddresses[DIRECTUS_ENV])) {
            $this->mc = new Memcache();
            if (self::$LOCAL) {
                $this->mc->addServer('127.0.0.1', 11211);
            } else {
                $servers = $this->memcachedServerAddresses[DIRECTUS_ENV];
                foreach ($servers as $s) {
                    $this->mc->addserver($s, 11211);
                }
            }
        }
    }

    /**
     * Set the cache
     *
     * @param $key
     * @param $val
     * @param $compressionFlag
     * @param $expire - seconds to expire in
     * @return bool - success/fail
     */
    public function set($key, $val, $compressionFlag, $expire = self::DEFAULT_CACHE_EXPIRE_SECONDS)
    {
        if ($this->mc) {
            $setSuccess = $this->mc->set($key, $val, $compressionFlag, $expire);
            return $setSuccess;
        }
    }

    /**
     * Get from the cache
     *
     * @param $key
     * @return mixed - Cache return data, or false if nothing retrieved from cache
     */
    public function get($key)
    {
        if ($this->mc) {
            $cacheReturn = $this->mc->get($key);
            return $cacheReturn;
        }
    }

    /**
     * The main method for usage, attempts to retrieve value for a given key, else calls given anonymous
     * function and caches the result at the given key, and returns the retval of anonymous function
     *
     * @param string $key - Key to look up in cache
     * @param callable $functionReturningVal - Anonymous function to call, cache, and return retval unless retreived from memcache
     * @param int $expire - Key expire time in seconds, or can be set to a specific time by providing a unix timestamp
     * @return mixed - Returns retrieved data from cache or else returns the return value of passed-in anonymous function
     *
     */
    public function getOrCache($key, $functionReturningVal, $expire = self::DEFAULT_CACHE_EXPIRE_SECONDS)
    {
        if ($this->mc && $this->mc->getStats()) {
            $key = MEMCACHED_ENV_NAMESPACE . '/' . $key;
            $cacheReturn = $this->get($key);
            if (!$cacheReturn) {
                $val = $functionReturningVal();
                $this->set($key, $val, MEMCACHE_COMPRESSED, $expire);
                return $val;
            }
            return $cacheReturn;
        }
        return $functionReturningVal();
    }

    /**
     * @param $key - Key to delete
     * @return bool - success or fail
     */
    public function delete($key)
    {
        if ($this->mc && $this->mc->getStats()) {
            $key = MEMCACHED_ENV_NAMESPACE . '/' . $key;
            return $this->mc->delete($key);
        }
        return false;
    }

    /**
     * Flushes the entire cache on the server (e.g. cloud-1, cloud-2, cloud-3 for ALL environments)
     *
     * @return bool - success or fail
     */
    public function flush()
    {
        if ($this->mc && $this->mc->getStats()) {
            return $this->mc->flush();
        }
        return false;
    }

    /**
     * Shortcut for appending to a cached array.
     */
    public function appendToEntry($cacheKey, $value, $expire = self::DEFAULT_CACHE_EXPIRE_SECONDS)
    {
        $set = [$value];
        $entry = $this->get($cacheKey);
        if ($entry) {
            $set = $entry;
            $set[] = $value;
        }
        return $this->set($cacheKey, $set, MEMCACHE_COMPRESSED, $expire);
    }

    /**
     * Shortcut for deleting all keys within a namespace key
     */
    public function deleteNamespaceKeys($namespaceKey)
    {
        $keys = $this->get($namespaceKey);
        if ($keys) {
            foreach ($keys as $key) {
                $this->delete($key);
            }
            return true;
        }
        return false;
    }

    /**
     * Static key generation functions provided to enforce key consistency throughout
     * application and also serve as documentation of keys in use.
     *
     * @param $classId
     * @return string
     */
    public static function getKeyDirectusUserFind($userId)
    {
        return 'directus_users?user_id=' . $userId;
    }

    public static function getKeyDirectusTables()
    {
        return 'directus_tables';
    }

    public static function getKeyDirectusGroupPrivileges($userId)
    {
        return 'directus_group_privileges?group_id=' . $userId;
    }

    public static function getKeyDirectusStorageAdapters()
    {
        return 'directus_storage_adapters';
    }

    public static function getKeyDirectusCountMessages($uid)
    {
        return 'directus_count_messages?uid=' . $uid;
    }

    public static function getKeyDirectusMessagesNewerThan($maxId, $uid)
    {
        return 'directus_get_messages_newer_than?uid=' . $uid . '&maxId=' . $maxId;
    }

    public static function getKeyDirectusGroupSchema($userGroupId, $versionHash)
    {
        return 'directus_schema_by_group_and_version?group_id=' . $userGroupId . '&version=' . $versionHash;
    }

}
