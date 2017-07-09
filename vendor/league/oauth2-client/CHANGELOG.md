# OAuth 2.0 Client Changelog

## 2.2.1

_Released: 2017-04-25_

* Fix potential type error when HTTP 500 errors are encountered
* Allow broader range of `random_compat` versions

## 2.2.0

_Released: 2017-02-01_

* Allow base URLs to contain query parameters
* Protect against `+` being improperly encoded in URL parameters
* Remove misleading `state` option from authorization parameters
* Stop generating more random bytes than necessary

## 2.1.0

_Released: 2017-01-24_

* Allow `expires_in` with a value of `0`

## 2.0.0

_Released: 2017-01-12_

* Rename `getResponse()` to `getParsedResponse()`
* Add `getResponse()` method that returns the unparsed PSR-7 `Response` instance
* Removed `RandomFactory`, switched to native random functions

## 1.4.1

_Released: 2016-04-29_

* Add `QueryBuilderTrait` to standardize query string generation.

## 1.4.0

_Released: 2016-04-19_

* Add `AccessToken::getValues()` to access additional vendor data provided with tokens.

## 1.3.0

_Released: 2016-02-13_

* Enable dynamic parameters being passed into the authorization URL.
* Minor documentation updates.

## 1.2.0

_Released: 2016-01-23_

* Add `resource_owner_id` to the JSON-serialized representation of the access token.
* Minor documentation updates and improved test coverage.

## 1.1.0

_Released: 2015-11-13_

* Add `ArrayAccessorTrait`, update `AbstractProvider` to utilize.
* Use `expires` to serialize access tokens.
* Documentation updates.

## 1.0.2

_Released: 2015-09-22_

* Allow access tokens to be created from storage (see #431).
* Minor fixes and documentation updates.

## 1.0.1

_Released: 2015-08-26_

* Allow required parameters checked using the `RequiredParameterTrait` to be set as `false`, `null`, `"0"`, etc.

## 1.0.0

_Released: 2015-08-19_

* We are running code-quality builds through Scrutinizer, and we are running unit test builds on the new Travis CI container-based infrastructure.
* Cleaned up code, as recommended by Scrutinizer.
* Documentation updates.

## 1.0.0-beta2

_Released: 2015-08-12_

* BREAK: Add toArray() to ResourceOwnerInterface.
* Always attempt to parse responses as JSON and fallback on failure.
* Add dot notation support to access token resource owner ID.
* Use the Bearer authorization header for the generic provider.
* Documentation updates.

## 1.0.0-beta1

_Released: 2015-07-16_

* API for 1.0 is now frozen!
* BREAK: Convert all uses of "User" to "ResourceOwner" to more closely match the OAuth 2.0 specification.
* BREAK: Rename `StandardProvider` to `GenericProvider`.
* BREAK: Move access token creation to the `AbstractProvider`. It was previously handled in the `AbstractGrant`.
* FIX: Add `Content-Type` header with value of `application/x-www-form-urlencoded` to the request header when retrieving access tokens. This adheres to the OAuth 2.0 specification and fixes issues where certain OAuth servers expect this header.
* Enhanced `json_encode()` serialization of AccessToken; when using `json_encode()` on an AccessToken, it will return a JSON object with these properties: `access_token`, `refresh_token`, and `expires_in`.

## 1.0.0-alpha2

_Released: 2015-07-04_

* BREAK: Renamed `AbstractProvider::ACCESS_TOKEN_METHOD_GET` to `AbstractProvider::METHOD_GET`.
* BREAK: Renamed `AbstractProvider::ACCESS_TOKEN_METHOD_POST` to `AbstractProvider::METHOD_POST`.
* BREAK: Renamed `AbstractProvider::prepareUserDetails()` to `AbstractProvider::createUser()`.
* BREAK: Renamed `AbstractProvider::getUserDetails()` to `AbstractProvider::getUser()`.
* BREAK: Removed `$token` parameter from `AbstractProvider::getDefaultHeaders()`.
* BREAK: Modify `AbstractProvider::getBaseAccessTokenUrl()` to accept a required array of parameters, allowing providers the ability to vary the access token URL, based on the parameters.
* Removed newline characters from MAC Authorization header.
* Documentation updates, notably:
  - Moved list of providers to `README.PROVIDERS.md`.
  - Moved provider creation notes to `README.PROVIDER-GUIDE.md`.

## 1.0.0-alpha1

_Released: 2015-06-25_

This release contains numerous BC breaks from the 0.x series. Please note these breaks and refer to the [upgrade guide](GUIDE-UPGRADING.md).

* BREAK: Requires PHP 5.5.0 and greater.
* BREAK: All providers have been moved to separate repositories, one for each provider.
* BREAK: All `public` properties have been set as `protected` or `private` and getters/setters have been introduced for access to these properties.
* BREAK: The `Provider\ProviderInterface` has been removed. Please extend from and override `Provider\AbstractProvider`.
* BREAK: The `Entity\User` has been removed. Providers should implement the `Provider\UserInterface` and provide user functionality instead of expecting it in this base library.
* BREAK: The `Grant\GrantInterface` has been removed. Providers needing to provide a new grant type should extend from and override `Grant\AbstractGrant`.
* A generic `Provider\StandardProvider` has been introduced, which may be used as a client to integrate with most OAuth 2.0 compatible servers.
* A `Grant\GrantFactory` has been introduced as a means to register and retrieve singleton grants from a registry.
* Introduced traits for bearer and MAC authorization (`Tool\BearerAuthorizationTrait` and `Tool\MacAuthorizationTrait`), which providers may use to enable these header authorization types.

## 0.12.1

_Released: 2015-06-20_

* FIX: Scope separators for LinkedIn and Instagram are now correctly a single space

## 0.12.0

_Released: 2015-06-15_

* BREAK: LinkedIn Provider: Default scopes removed from LinkedIn Provider. See "[Managing LinkedIn Scopes](https://github.com/thephpleague/oauth2-client/blob/9cea9864c2e89bce1b922d1e37ba5378b3b0b264/README.md#managing-linkedin-scopes)" in the README for information on how to set scopes. See [#327](https://github.com/thephpleague/oauth2-client/pull/327) and [#307](https://github.com/thephpleague/oauth2-client/pull/307) for details on this change.
* FIX: LinkedIn Provider: A scenario existed in which `publicProfileUrl` was not set, generating a PHP notice; this has been fixed.
* FIX: Instagram Provider: Fixed scope separator.
* Documentation updates and corrections.


## 0.11.0

_Released: 2015-04-25_

* Identity Provider: Better handling of error responses
* Documentation updates


## 0.10.1

_Released: 2015-04-02_

* FIX: Invalid JSON triggering fatal error
* FIX: Sending headers along with auth `getAccessToken()` requests
* Now running Travis CI tests on PHP 7
* Documentation updates


## 0.10.0

_Released: 2015-03-10_

* Providers: Added `getHeaders()` to ProviderInterface and updated AbstractProvider to provide the method
* Providers: Updated all bundled providers to support new `$authorizationHeader` property
* Identity Provider: Update IDPException to account for empty strings
* Identity Provider: Added `getResponseBody()` method to IDPException
* Documentation updates, minor bug fixes, and coding standards fixes


## 0.9.0

_Released: 2015-02-24_

* Add `AbstractProvider::prepareAccessTokenResult()` to provide additional token response preparation to providers
* Remove custom provider code from AccessToken
* Add links to README for Dropbox and Square providers


## 0.8.1

_Released: 2015-02-12_

* Allow `approval_prompt` to be set by providers. This fixes an issue where some providers have problems if the `approval_prompt` is present in the query string.


## 0.8.0

_Released: 2015-02-10_

* Facebook Provider: Upgrade to Graph API v2.2
* Google Provider: Add `access_type` parameter for Google authorization URL
* Get a more reliable response body on errors


## 0.7.2

_Released: 2015-02-03_

* GitHub Provider: Fix regression
* Documentation updates


## 0.7.1

_Released: 2015-01-06_

* Google Provider: fixed issue where Google API was not returning the user ID


## 0.7.0

_Released: 2014-12-29_

* Improvements to Provider\AbstractProvider (addition of `userUid()`, `userEmail()`, and `userScreenName()`)
* GitHub Provider: Support for GitHub Enterprise
* GitHub Provider: Methods to allow fetching user email addresses
* Google Provider: Updated scopes and endpoints to remove deprecated values
* Documentation updates, minor bug fixes, and coding standards fixes


## 0.6.0

_Released: 2014-12-03_

* Added ability to specify a redirect handler for providers through use of a callback (see [Provider\AbstractProvider::setRedirectHandler()](https://github.com/thephpleague/oauth2-client/blob/55de45401eaa21f53c0b2414091da6f3b0f3fcb7/src/Provider/AbstractProvider.php#L314-L317))
* Updated authorize and token URLs for the Microsoft provider; the old URLs had been phased out and were no longer working (see #146)
* Increased test coverage
* Documentation updates, minor bug fixes, and coding standards fixes


## 0.5.0

_Released: 2014-11-28_

* Added `ClientCredentials` and `Password` grants
* Added support for providers to set their own `uid` parameter key name
* Added support for Google's `hd` (hosted domain) parameter
* Added support for providing a custom `state` parameter to the authorization URL
* LinkedIn `pictureUrl` is now an optional response element
* Added Battle.net provider package link to README
* Added Meetup provider package link to README
* Added `.gitattributes` file
* Increased test coverage
* A number of documentation fixes, minor bug fixes, and coding standards fixes


## 0.4.0

_Released: 2014-10-28_

* Added  `ProviderInterface` and removed `IdentityProvider`.
* Expose generated state to allow for CSRF validation.
* Renamed `League\OAuth2\Client\Provider\User` to `League\OAuth2\Client\Entity\User`.
* Entity: User: added `gender` and `locale` properties
* Updating logic for populating the token expiration time.


## 0.3.0

_Released: 2014-04-26_

* This release made some huge leaps forward, including 100% unit-coverage and a bunch of new features.


## 0.2.0

_Released: 2013-05-28_

* No release notes available.


## 0.1.0

_Released: 2013-05-25_

* Initial release.
