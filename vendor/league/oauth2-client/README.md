# OAuth 2.0 Client

This package makes it simple to integrate your application with [OAuth 2.0](http://oauth.net/2/) service providers.

[![Gitter Chat](https://img.shields.io/badge/gitter-join_chat-brightgreen.svg?style=flat-square)](https://gitter.im/thephpleague/oauth2-client)
[![Source Code](http://img.shields.io/badge/source-thephpleague/oauth2--client-blue.svg?style=flat-square)](https://github.com/thephpleague/oauth2-client)
[![Latest Version](https://img.shields.io/github/release/thephpleague/oauth2-client.svg?style=flat-square)](https://github.com/thephpleague/oauth2-client/releases)
[![Software License](https://img.shields.io/badge/license-MIT-brightgreen.svg?style=flat-square)](https://github.com/thephpleague/oauth2-client/blob/master/LICENSE)
[![Build Status](https://img.shields.io/travis/thephpleague/oauth2-client/master.svg?style=flat-square)](https://travis-ci.org/thephpleague/oauth2-client)
[![HHVM Status](https://img.shields.io/hhvm/league/oauth2-client.svg?style=flat-square)](http://hhvm.h4cc.de/package/league/oauth2-client)
[![Scrutinizer](https://img.shields.io/scrutinizer/g/thephpleague/oauth2-client/master.svg?style=flat-square)](https://scrutinizer-ci.com/g/thephpleague/oauth2-client/)
[![Coverage Status](https://img.shields.io/coveralls/thephpleague/oauth2-client/master.svg?style=flat-square)](https://coveralls.io/r/thephpleague/oauth2-client?branch=master)
[![Total Downloads](https://img.shields.io/packagist/dt/league/oauth2-client.svg?style=flat-square)](https://packagist.org/packages/league/oauth2-client)

---

We are all used to seeing those "Connect with Facebook/Google/etc." buttons around the internet, and social network integration is an important feature of most web applications these days. Many of these sites use an authentication and authorization standard called OAuth 2.0 ([RFC 6749](http://tools.ietf.org/html/rfc6749)).

This OAuth 2.0 client library will work with any OAuth provider that conforms to the OAuth 2.0 standard. Out-of-the-box, we provide a `GenericProvider` that may be used to connect to any service provider that uses [Bearer tokens](http://tools.ietf.org/html/rfc6750) (see example below).

Many service providers provide additional functionality above and beyond the OAuth 2.0 standard. For this reason, this library may be easily extended and wrapped to support this additional behavior. We provide links to [all known provider clients extending this library](docs/providers/thirdparty.md) (i.e. Facebook, GitHub, Google, Instagram, LinkedIn, etc.). If your provider isn't in the list, feel free to add it.

This package is compliant with [PSR-1][], [PSR-2][], [PSR-4][], and [PSR-7][]. If you notice compliance oversights, please send a patch via pull request. If you're interesting in contributing to this library, please take a look at our [contributing guidelines](CONTRIBUTING.md).

## Requirements

The following versions of PHP are supported.

* PHP 5.6
* PHP 7.0
* PHP 7.1
* PHP 7.2
* HHVM

## Providers

A list of official PHP League providers, as well as third-party providers, may be found in the [providers list README](docs/providers/thirdparty.md).

To build your own provider, please refer to the [provider guide README](README.PROVIDER-GUIDE.md).

## Usage

**In most cases, you'll want to use a specific provider client library rather than this base library.**

Take a look at [providers list README](docs/providers/thirdparty.md) to see a list of provider client libraries.

If using Composer to require a specific provider client library, you **do not need to also require this library**. Composer will handle the dependencies for you.

### Authorization Code Grant

The following example uses the out-of-the-box `GenericProvider` provided by this library. If you're looking for a specific provider (i.e. Facebook, Google, GitHub, etc.), take a look at our [list of provider client libraries](docs/providers/thirdparty.md). **HINT: You're probably looking for a specific provider.**

The authorization code grant type is the most common grant type used when authenticating users with a third-party service. This grant type utilizes a client (this library), a server (the service provider), and a resource owner (the user with credentials to a protected—or owned—resource) to request access to resources owned by the user. This is often referred to as _3-legged OAuth_, since there are three parties involved.

The following example illustrates this using [Brent Shaffer's](https://github.com/bshaffer) demo OAuth 2.0 application named **Lock'd In**. When running this code, you will be redirected to Lock'd In, where you'll be prompted to authorize the client to make requests to a resource on your behalf.

Now, you don't really have an account on Lock'd In, but for the sake of this example, imagine that you are already logged in on Lock'd In when you are redirected there.

```php
$provider = new \League\OAuth2\Client\Provider\GenericProvider([
    'clientId'                => 'demoapp',    // The client ID assigned to you by the provider
    'clientSecret'            => 'demopass',   // The client password assigned to you by the provider
    'redirectUri'             => 'http://example.com/your-redirect-url/',
    'urlAuthorize'            => 'http://brentertainment.com/oauth2/lockdin/authorize',
    'urlAccessToken'          => 'http://brentertainment.com/oauth2/lockdin/token',
    'urlResourceOwnerDetails' => 'http://brentertainment.com/oauth2/lockdin/resource'
]);

// If we don't have an authorization code then get one
if (!isset($_GET['code'])) {

    // Fetch the authorization URL from the provider; this returns the
    // urlAuthorize option and generates and applies any necessary parameters
    // (e.g. state).
    $authorizationUrl = $provider->getAuthorizationUrl();

    // Get the state generated for you and store it to the session.
    $_SESSION['oauth2state'] = $provider->getState();

    // Redirect the user to the authorization URL.
    header('Location: ' . $authorizationUrl);
    exit;

// Check given state against previously stored one to mitigate CSRF attack
} elseif (empty($_GET['state']) || (isset($_SESSION['oauth2state']) && $_GET['state'] !== $_SESSION['oauth2state'])) {

    if (isset($_SESSION['oauth2state'])) {
        unset($_SESSION['oauth2state']);
    }
    
    exit('Invalid state');

} else {

    try {

        // Try to get an access token using the authorization code grant.
        $accessToken = $provider->getAccessToken('authorization_code', [
            'code' => $_GET['code']
        ]);

        // We have an access token, which we may use in authenticated
        // requests against the service provider's API.
        echo 'Access Token: ' . $accessToken->getToken() . "<br>";
        echo 'Refresh Token: ' . $accessToken->getRefreshToken() . "<br>";
        echo 'Expired in: ' . $accessToken->getExpires() . "<br>";
        echo 'Already expired? ' . ($accessToken->hasExpired() ? 'expired' : 'not expired') . "<br>";

        // Using the access token, we may look up details about the
        // resource owner.
        $resourceOwner = $provider->getResourceOwner($accessToken);

        var_export($resourceOwner->toArray());

        // The provider provides a way to get an authenticated API request for
        // the service, using the access token; it returns an object conforming
        // to Psr\Http\Message\RequestInterface.
        $request = $provider->getAuthenticatedRequest(
            'GET',
            'http://brentertainment.com/oauth2/lockdin/resource',
            $accessToken
        );

    } catch (\League\OAuth2\Client\Provider\Exception\IdentityProviderException $e) {

        // Failed to get the access token or user details.
        exit($e->getMessage());

    }

}
```

### Refreshing a Token

Once your application is authorized, you can refresh an expired token using a refresh token rather than going through the entire process of obtaining a brand new token. To do so, simply reuse this refresh token from your data store to request a refresh.

_This example uses [Brent Shaffer's](https://github.com/bshaffer) demo OAuth 2.0 application named **Lock'd In**. See authorization code example above, for more details._

```php
$provider = new \League\OAuth2\Client\Provider\GenericProvider([
    'clientId'                => 'demoapp',    // The client ID assigned to you by the provider
    'clientSecret'            => 'demopass',   // The client password assigned to you by the provider
    'redirectUri'             => 'http://example.com/your-redirect-url/',
    'urlAuthorize'            => 'http://brentertainment.com/oauth2/lockdin/authorize',
    'urlAccessToken'          => 'http://brentertainment.com/oauth2/lockdin/token',
    'urlResourceOwnerDetails' => 'http://brentertainment.com/oauth2/lockdin/resource'
]);

$existingAccessToken = getAccessTokenFromYourDataStore();

if ($existingAccessToken->hasExpired()) {
    $newAccessToken = $provider->getAccessToken('refresh_token', [
        'refresh_token' => $existingAccessToken->getRefreshToken()
    ]);

    // Purge old access token and store new access token to your data store.
}
```

### Resource Owner Password Credentials Grant

Some service providers allow you to skip the authorization code step to exchange a user's credentials (username and password) for an access token. This is referred to as the "resource owner password credentials" grant type.

According to [section 1.3.3](http://tools.ietf.org/html/rfc6749#section-1.3.3) of the OAuth 2.0 standard (emphasis added):

> The credentials **should only be used when there is a high degree of trust**
> between the resource owner and the client (e.g., the client is part of the
> device operating system or a highly privileged application), and when other
> authorization grant types are not available (such as an authorization code).

**We do not advise using this grant type if the service provider supports the authorization code grant type (see above), as this reinforces the [password anti-pattern](https://agentile.com/the-password-anti-pattern) by allowing users to think it's okay to trust third-party applications with their usernames and passwords.**

That said, there are use-cases where the resource owner password credentials grant is acceptable and useful. Here's an example using it with [Brent Shaffer's](https://github.com/bshaffer) demo OAuth 2.0 application named **Lock'd In**. See authorization code example above, for more details about the Lock'd In demo application.

``` php
$provider = new \League\OAuth2\Client\Provider\GenericProvider([
    'clientId'                => 'demoapp',    // The client ID assigned to you by the provider
    'clientSecret'            => 'demopass',   // The client password assigned to you by the provider
    'redirectUri'             => 'http://example.com/your-redirect-url/',
    'urlAuthorize'            => 'http://brentertainment.com/oauth2/lockdin/authorize',
    'urlAccessToken'          => 'http://brentertainment.com/oauth2/lockdin/token',
    'urlResourceOwnerDetails' => 'http://brentertainment.com/oauth2/lockdin/resource'
]);

try {

    // Try to get an access token using the resource owner password credentials grant.
    $accessToken = $provider->getAccessToken('password', [
        'username' => 'demouser',
        'password' => 'testpass'
    ]);

} catch (\League\OAuth2\Client\Provider\Exception\IdentityProviderException $e) {

    // Failed to get the access token
    exit($e->getMessage());

}
```

### Client Credentials Grant

When your application is acting on its own behalf to access resources it controls/owns in a service provider, it may use the client credentials grant type. This is best used when the credentials for your application are stored privately and never exposed (e.g. through the web browser, etc.) to end-users. This grant type functions similarly to the resource owner password credentials grant type, but it does not request a user's username or password. It uses only the client ID and secret issued to your client by the service provider.

Unlike earlier examples, the following does not work against a functioning demo service provider. It is provided for the sake of example only.

``` php
// Note: the GenericProvider requires the `urlAuthorize` option, even though
// it's not used in the OAuth 2.0 client credentials grant type.

$provider = new \League\OAuth2\Client\Provider\GenericProvider([
    'clientId'                => 'XXXXXX',    // The client ID assigned to you by the provider
    'clientSecret'            => 'XXXXXX',    // The client password assigned to you by the provider
    'redirectUri'             => 'http://my.example.com/your-redirect-url/',
    'urlAuthorize'            => 'http://service.example.com/authorize',
    'urlAccessToken'          => 'http://service.example.com/token',
    'urlResourceOwnerDetails' => 'http://service.example.com/resource'
]);

try {

    // Try to get an access token using the client credentials grant.
    $accessToken = $provider->getAccessToken('client_credentials');

} catch (\League\OAuth2\Client\Provider\Exception\IdentityProviderException $e) {

    // Failed to get the access token
    exit($e->getMessage());

}
```

### Using a proxy

It is possible to use a proxy to debug HTTP calls made to a provider. All you need to do is set the `proxy` and `verify` options when creating your Provider instance. Make sure you enable SSL proxying in your proxy.

``` php
$provider = new \League\OAuth2\Client\Provider\GenericProvider([
    'clientId'                => 'XXXXXX',    // The client ID assigned to you by the provider
    'clientSecret'            => 'XXXXXX',    // The client password assigned to you by the provider
    'redirectUri'             => 'http://my.example.com/your-redirect-url/',
    'urlAuthorize'            => 'http://service.example.com/authorize',
    'urlAccessToken'          => 'http://service.example.com/token',
    'urlResourceOwnerDetails' => 'http://service.example.com/resource',
    'proxy'                   => '192.168.0.1:8888',
    'verify'                  => false
]);
```

## Install

Via Composer

``` bash
$ composer require league/oauth2-client
```

## Contributing

Please see [CONTRIBUTING](https://github.com/thephpleague/oauth2-client/blob/master/CONTRIBUTING.md) for details.

## License

The MIT License (MIT). Please see [License File](https://github.com/thephpleague/oauth2-client/blob/master/LICENSE) for more information.


[PSR-1]: https://github.com/php-fig/fig-standards/blob/master/accepted/PSR-1-basic-coding-standard.md
[PSR-2]: https://github.com/php-fig/fig-standards/blob/master/accepted/PSR-2-coding-style-guide.md
[PSR-4]: https://github.com/php-fig/fig-standards/blob/master/accepted/PSR-4-autoloader.md
[PSR-7]: https://github.com/php-fig/fig-standards/blob/master/accepted/PSR-7-http-message.md
