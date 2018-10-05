<?php

namespace League\OAuth2\Client\Provider;

class AppSecretProof
{
    /**
     * The app secret proof to sign requests made to the Graph API
     * @see https://developers.facebook.com/docs/graph-api/securing-requests#appsecret_proof
     *
     * @param string $appSecret
     * @param string $accessToken
     * @return string
     */
    public static function create($appSecret, $accessToken)
    {
        return hash_hmac('sha256', $accessToken, $appSecret);
    }
}
