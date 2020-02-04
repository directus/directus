<?php

namespace Directus\Config;

use Directus\Exception\UnauthorizedException;
use RuntimeException;

/**
 * Config context interface.
 */
class SuperAdminToken
{
    /**
     * Environment variable name.
     */
    public const ENV_NAME = 'DIRECTUS_SUPER_ADMIN_TOKEN';

    /**
     * Gets the super admin token.
     *
     * @return string
     */
    public static function get()
    {
        if (!static::exists()) {
            throw new RuntimeException('Cannot find super admin token variable.');
        }

        if (Context::is_env()) {
            return getenv(static::ENV_NAME);
        }

        $fileData = json_decode(file_get_contents(static::path()), true);

        return $fileData['super_admin_token'];
    }

    /**
     * Gets the token file path.
     */
    public static function path()
    {
        $basePath = \Directus\get_app_base_path();

        return $basePath.'/config/__api.json';
    }

    /**
     * Check if super admin token exists.
     */
    public static function exists()
    {
        if (Context::is_env()) {
            if (getenv(static::ENV_NAME) === false) {
                return false;
            }

            return true;
        }

        return file_exists(static::path());
    }

    /**
     * Validates if the token is valid. Doesn't throw exceptions.
     *
     * @param string $token Token string
     *
     * @return bool
     */
    public static function validate($token)
    {
        return $token === static::get();
    }

    /**
     * Asserts the super admin token.
     *
     * @param string $token Token string
     *
     * @return bool
     */
    public static function assert($token)
    {
        if (!static::validate($token)) {
            throw new UnauthorizedException('Permission denied: Superadmin Only');
        }

        return true;
    }
}
