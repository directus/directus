<?php

namespace Directus\Services;

use Directus\Authentication\Exception\ExpiredRequestTokenException;
use Directus\Authentication\Exception\InvalidRequestTokenException;
use Directus\Authentication\Exception\InvalidTokenException;
use Directus\Authentication\Sso\AbstractSocialProvider;
use Directus\Authentication\Exception\ExpiredResetPasswordToken;
use Directus\Authentication\Exception\InvalidResetPasswordTokenException;
use Directus\Authentication\Exception\UserNotFoundException;
use Directus\Authentication\Exception\UserWithEmailNotFoundException;
use Directus\Authentication\Sso\OneSocialProvider;
use Directus\Authentication\Provider;
use Directus\Authentication\Sso\Social;
use Directus\Authentication\Sso\TwoSocialProvider;
use Directus\Authentication\User\UserInterface;
use Directus\Database\TableGateway\DirectusActivityTableGateway;
use Directus\Exception\UnauthorizedException;
use Directus\Exception\UnprocessableEntityException;
use Directus\Util\ArrayUtils;
use Directus\Util\JWTUtils;
use Directus\Util\StringUtils;

class AuthService extends AbstractService
{
    /**
     * Gets the user token using the authentication email/password combination
     *
     * @param string $email
     * @param string $password
     *
     * @return array
     *
     * @throws UnauthorizedException
     */
    public function loginWithCredentials($email, $password)
    {
        $this->validateCredentials($email, $password);

        /** @var Provider $auth */
        $auth = $this->container->get('auth');

        /** @var UserInterface $user */
        $user = $auth->login([
            'email' => $email,
            'password' => $password
        ]);

        $hookEmitter = $this->container->get('hook_emitter');
        $hookEmitter->run('auth.request:credentials', [$user]);

        // TODO: Move to the hook above
        /** @var DirectusActivityTableGateway $activityTableGateway */
        $activityTableGateway = $this->createTableGateway('directus_activity', false);
        $activityTableGateway->recordLogin($user->get('id'));

        return [
            'data' => [
                'token' => $this->generateAuthToken($user)
            ]
        ];
    }

    /**
     * @param string $name
     *
     * @return array
     */
    public function getAuthenticationRequestInfo($name)
    {
        return [
            'data' => $this->getSsoAuthorizationInfo($name)
        ];
    }

    /**
     * Gets the basic information of a sso service
     *
     * @param string $name
     *
     * @return array
     */
    public function getSsoBasicInfo($name)
    {
        /** @var Social $socialAuth */
        $socialAuth = $this->container->get('external_auth');
        /** @var AbstractSocialProvider $service */
        $service = $socialAuth->get($name);
        $basePath = $this->container->get('path_base');

        $iconUrl = null;
        $type = $service->getConfig()->get('custom') === true ? 'custom' : 'core';
        $iconPath = sprintf('/extensions/%s/auth/%s/icon.svg', $type, $name);
        if (file_exists($basePath . '/public' . $iconPath)) {
            $iconUrl = \Directus\get_url($iconPath);
        }

        return [
            'name' => $name,
            'icon' => $iconUrl
        ];
    }

    /**
     * @param string $name
     *
     * @return array
     */
    public function getSsoAuthorizationInfo($name)
    {
        /** @var Social $socialAuth */
        $socialAuth = $this->container->get('external_auth');
        /** @var AbstractSocialProvider $service */
        $service = $socialAuth->get($name);

        $authorizationInfo = [
            'authorization_url' => $service->getRequestAuthorizationUrl()
        ];

        if ($service instanceof TwoSocialProvider) {
            $authorizationInfo['state'] = $service->getProvider()->getState();
        }

        return $authorizationInfo;
    }

    /**
     * @param string $name
     *
     * @return array
     */
    public function getSsoCallbackInfo($name)
    {
        /** @var Social $socialAuth */
        $socialAuth = $this->container->get('external_auth');
        /** @var AbstractSocialProvider $service */
        $service = $socialAuth->get($name);

        return [
            'callback_url' => $service->getRequestAuthorizationUrl()
        ];
    }

    /**
     * Gets the given SSO service information
     *
     * @param string $name
     *
     * @return array
     */
    public function getSsoInfo($name)
    {
        return array_merge(
            $this->getSsoBasicInfo($name),
            $this->getSsoAuthorizationInfo($name),
            $this->getSsoCallbackInfo($name)
        );
    }

    public function handleAuthenticationRequestCallback($name, $generateRequestToken = false)
    {
        /** @var Social $socialAuth */
        $socialAuth = $this->container->get('external_auth');
        /** @var AbstractSocialProvider $service */
        $service = $socialAuth->get($name);

        $serviceUser = $service->handle();

        $user = $this->authenticateWithEmail($serviceUser->getEmail());
        if ($generateRequestToken) {
            $token = $this->generateRequestToken($user);
        } else {
            $token = $this->generateAuthToken($user);
        }

        return [
            'data' => [
                'token' => $token
            ]
        ];
    }

    /**
     * @param string $token
     * @param bool $ignoreOrigin
     *
     * @return UserInterface
     */
    public function authenticateWithToken($token, $ignoreOrigin = false)
    {
        if (JWTUtils::isJWT($token)) {
            $authenticated = $this->getAuth()->authenticateWithToken($token, $ignoreOrigin);
        } else {
            $authenticated = $this->getAuth()->authenticateWithPrivateToken($token);
        }

        return $authenticated;
    }

    /**
     * Authenticates a user with the given email
     *
     * @param $email
     *
     * @return \Directus\Authentication\User\User
     *
     * @throws UserWithEmailNotFoundException
     */
    public function authenticateWithEmail($email)
    {
        return $this->getAuth()->authenticateWithEmail($email);
    }

    /**
     * Authenticate an user with the SSO authorization code
     *
     * @param string $service
     * @param array $params
     *
     * @return array
     */
    public function authenticateWithSsoCode($service, array $params)
    {
        /** @var Social $socialAuth */
        $socialAuth = $this->container->get('external_auth');
        /** @var AbstractSocialProvider $service */
        $service = $socialAuth->get($service);

        if ($service instanceof OneSocialProvider) {
            $data = ArrayUtils::pick($params, ['oauth_token', 'oauth_verifier']);
        } else {
            $data = ArrayUtils::pick($params, ['code']);
        }

        $serviceUser = $service->getUserFromCode($data);
        $user = $this->authenticateWithEmail($serviceUser->getEmail());

        return [
            'data' => [
                'token' => $this->generateAuthToken($user)
            ]
        ];
    }

    /**
     * Gets the access token from a sso request token
     *
     * @param string $token
     *
     * @return array
     *
     * @throws ExpiredRequestTokenException
     * @throws InvalidRequestTokenException
     * @throws InvalidTokenException
     */
    public function authenticateWithSsoRequestToken($token)
    {
        if (!JWTUtils::isJWT($token)) {
            throw new InvalidRequestTokenException();
        }

        if (JWTUtils::hasExpired($token)) {
            throw new ExpiredRequestTokenException();
        }

        $payload = JWTUtils::getPayload($token);

        if (!JWTUtils::hasPayloadType(JWTUtils::TYPE_SSO_REQUEST_TOKEN, $payload)) {
            throw new InvalidRequestTokenException();
        }

        $auth = $this->getAuth();
        $auth->validatePayloadOrigin($payload);

        $user = $auth->findUserWithConditions([
            'id' => $payload->id
        ]);

        return [
            'data' => [
                'token' => $this->generateAuthToken($user)
            ]
        ];
    }

    /**
     * Generates JWT Token
     *
     * @param UserInterface $user
     *
     * @return string
     */
    public function generateAuthToken(UserInterface $user)
    {
        /** @var Provider $auth */
        $auth = $this->container->get('auth');

        return $auth->generateAuthToken($user);
    }

    /**
     * Generates a Request JWT Token use for SSO Authentication
     *
     * @param UserInterface $user
     *
     * @return string
     */
    public function generateRequestToken(UserInterface $user)
    {
        /** @var Provider $auth */
        $auth = $this->container->get('auth');

        return $auth->generateRequestToken($user);
    }

    /**
     * Sends a email with the reset password token
     *
     * @param $email
     */
    public function sendResetPasswordToken($email)
    {
        $this->validate(['email' => $email], ['email' => 'required|email']);

        /** @var Provider $auth */
        $auth = $this->container->get('auth');
        $user = $auth->findUserWithEmail($email);

        $resetToken = $auth->generateResetPasswordToken($user);

        \Directus\send_forgot_password_email($user->toArray(), $resetToken);
    }

    public function resetPasswordWithToken($token)
    {
        if (!JWTUtils::isJWT($token)) {
            throw new InvalidResetPasswordTokenException($token);
        }

        if (JWTUtils::hasExpired($token)) {
            throw new ExpiredResetPasswordToken($token);
        }

        $payload = JWTUtils::getPayload($token);

        if (!JWTUtils::hasPayloadType(JWTUtils::TYPE_RESET_PASSWORD, $payload)) {
            throw new InvalidResetPasswordTokenException($token);
        }

        $auth = $this->getAuth();
        $auth->validatePayloadOrigin($payload);

        $userProvider = $auth->getUserProvider();
        $user = $userProvider->find($payload->id);

        if (!$user) {
            throw new UserNotFoundException();
        }

        // Throw invalid token if the payload email is not the same as the current user email
        if (!property_exists($payload, 'email') || $payload->email !== $user->getEmail()) {
            throw new InvalidResetPasswordTokenException($token);
        }

        $newPassword = StringUtils::randomString(16);
        $userProvider->update($user, [
            'password' => $auth->hashPassword($newPassword)
        ]);

        \Directus\send_reset_password_email($user->toArray(), $newPassword);
    }

    public function refreshToken($token)
    {
        $this->validate([
            'token' => $token
        ], [
            'token' => 'required'
        ]);

        /** @var Provider $auth */
        $auth = $this->container->get('auth');

        return ['data' => ['token' => $auth->refreshToken($token)]];
    }

    /**
     * Validates email+password credentials
     *
     * @param $email
     * @param $password
     *
     * @throws UnprocessableEntityException
     */
    protected function validateCredentials($email, $password)
    {
        $payload = [
            'email' => $email,
            'password' => $password
        ];
        $constraints = [
            'email' => 'required|string|email',
            'password' => 'required|string'
        ];

        // throws an exception if the constraints are not met
        $this->validate($payload, $constraints);
    }
}
