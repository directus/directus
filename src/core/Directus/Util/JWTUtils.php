<?php

namespace Directus\Util;

use Directus\Authentication\Exception\ExpiredTokenException;
use Directus\Authentication\Exception\InvalidTokenException;
use Directus\Exception\Exception;
use Firebase\JWT\JWT;

class JWTUtils
{
    const TYPE_AUTH                 = 'auth';
    const TYPE_SSO_REQUEST_TOKEN    = 'request_token';
    const TYPE_INVITATION           = 'invitation';
    const TYPE_RESET_PASSWORD       = 'reset_password';

    /**
     * @param string $jwt
     * @param string $key
     * @param array $allowed_algs
     *
     * @throws Exception
     *
     * @return object
     */
    public static function decode($jwt, $key, array $allowed_algs = [])
    {
        try {
            $payload = JWT::decode($jwt, $key, $allowed_algs);
        } catch (\Exception $e) {
            switch ($e->getMessage()) {
                case 'Expired token':
                    $exception = new ExpiredTokenException();
                    break;
                default:
                    $exception = new InvalidTokenException();
            }

            throw $exception;
        }

        return $payload;
    }

    /**
     * @param array|object $payload
     * @param string $key
     * @param string $alg
     * @param null $keyId
     * @param null $head
     *
     * @return string
     */
    public static function encode($payload, $key, $alg = 'HS256', $keyId = null, $head = null)
    {
        return JWT::encode($payload, $key, $alg, $keyId, $head);
    }

    /**
     * Checks whether a token is a JWT token
     *
     * @param $token
     *
     * @return bool
     */
    public static function isJWT($token)
    {
        if (!is_string($token)) {
            return false;
        }

        $parts = explode('.', $token);
        if (count($parts) != 3) {
            return false;
        }

        list($headb64, $bodyb64, $cryptob64) = $parts;
        if (null === ($header = JWT::jsonDecode(JWT::urlsafeB64Decode($headb64)))) {
            return false;
        }

        return $header->typ === 'JWT';
    }

    /**
     * Checks whether or not the payload has the given type
     *
     * @param string $type
     * @param object $payload
     *
     * @return bool
     */
    public static function hasPayloadType($type, $payload)
    {
        return static::hasPayloadAttr('type', $type, $payload);
    }

    /**
     * Checks whether or not the payload has the given key
     *
     * @param string $key
     * @param object $payload
     *
     * @return bool
     */
    public static function hasPayloadKey($key, $payload)
    {
        return static::hasPayloadAttr('key', $key, $payload);
    }

    /**
     * Checks whether or not the payload has the given project name
     *
     * @param string $project
     * @param object $payload
     *
     * @return bool
     */
    public static function hasPayloadProjectName($project, $payload)
    {
        return static::hasPayloadAttr('project', $project, $payload);
    }

    /**
     * Checks whether or not the payload has the given attribute
     *
     * @param string $key
     * @param mixed $value
     * @param object $payload
     *
     * @return bool
     */
    public static function hasPayloadAttr($key, $value, $payload)
    {
        return is_object($payload) && property_exists($payload, $key) && $payload->{$key} === $value;
    }

    /**
     * Get the token payload object
     *
     * @param string $token
     * @param string $attribute
     *
     * @return null|object
     */
    public static function getPayload($token, $attribute = null)
    {
        if (!is_string($token)) {
            return null;
        }

        $parts = explode('.', $token);
        if (count($parts) != 3) {
            return null;
        }

        list($headb64, $bodyb64, $cryptob64) = $parts;

        $payload = JWT::jsonDecode(JWT::urlsafeB64Decode($bodyb64));

        if ($attribute === null) {
            return $payload;
        }

        if (!is_string($attribute) || !property_exists($payload, $attribute)) {
            return null;
        }

        return $payload->{$attribute};
    }

    /**
     * Checks whether the token has expired
     *
     * @param $token
     *
     * @return bool|null
     */
    public static function hasExpired($token)
    {
        $expired = null;
        $payload = static::getPayload($token);

        if ($payload && isset($payload->exp)) {
            $expired = time() >= $payload->exp;
        }

        return $expired;
    }
}
