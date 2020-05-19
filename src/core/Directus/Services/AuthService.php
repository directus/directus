<?php

namespace Directus\Services;

use function Directus\get_directus_path;
use function Directus\get_api_project_from_request;
use function Directus\get_url;
use Directus\Util\DateTimeUtils;
use Directus\Authentication\Exception\ExpiredRequestTokenException;
use Directus\Authentication\Exception\InvalidRequestTokenException;
use Directus\Authentication\Exception\InvalidTokenException;
use Directus\Authentication\Sso\AbstractSocialProvider;
use Directus\Authentication\Exception\ExpiredResetPasswordToken;
use Directus\Authentication\Exception\InvalidResetPasswordTokenException;
use Directus\Authentication\Exception\UserNotFoundException;
use Directus\Authentication\Exception\UserWithEmailNotFoundException;
use Directus\Authentication\Exception\TFAEnforcedException;
use Directus\Authentication\Sso\OneSocialProvider;
use Directus\Authentication\Provider;
use Directus\Authentication\Sso\Social;
use Directus\Authentication\Sso\TwoSocialProvider;
use Directus\Authentication\User\UserInterface;
use Directus\Database\Schema\SchemaManager;
use Directus\Database\TableGateway\DirectusActivityTableGateway;
use Directus\Database\TableGateway\DirectusUserSessionsTableGateway;
use Directus\Exception\UnauthorizedException;
use Directus\Exception\UnprocessableEntityException;
use Directus\Util\ArrayUtils;
use Directus\Util\JWTUtils;
use Directus\Util\StringUtils;
use Zend\Db\Sql\Update;

class AuthService extends AbstractService
{
    const AUTH_VALIDATION_ERROR_CODE = 114;

    /**
     * Gets the user token using the authentication email/password combination
     *
     * @param string $email
     * @param string $password
     * @param string $otp
     *
     * @return array
     *
     * @throws UnauthorizedException
     */
    public function loginWithCredentials($email, $password, $otp = null, $mode = null)
    {
        $this->validateCredentials($email, $password, $otp);

        /** @var Provider $auth */
        $auth = $this->container->get('auth');

        /** @var UserInterface $user */
        $user = $auth->login([
            'email' => $email,
            'password' => $password,
            'otp' => $otp
        ]);

        $hookEmitter = $this->container->get('hook_emitter');
        $hookEmitter->run('auth.request:credentials', [$user]);

        // TODO: Move to the hook above
        /** @var DirectusActivityTableGateway $activityTableGateway */
        $activityTableGateway = $this->createTableGateway('directus_activity', false);
        $activityTableGateway->recordLogin($user->get('id'));

        /** @var UsersService $usersService */
        $usersService = new UsersService($this->container);
        $tfa_enforced = $usersService->has2FAEnforced($user->getId());

        switch ($mode) {
            case DirectusUserSessionsTableGateway::TOKEN_COOKIE:
                $user = $this->findOrCreateStaticToken($user);
                $responseData['user'] = $user;
                break;
            case DirectusUserSessionsTableGateway::TOKEN_JWT:
            default:
                $token = $this->generateAuthToken($user);
                $user = $user->toArray();
                $responseData = [
                    'token' => $token,
                    'user' => $user
                ];
        }
        $responseObject['data'] = $responseData;

        if (!is_null($user)) {
            $needs2FA = $tfa_enforced && $user['2fa_secret'] == null;
            if ($needs2FA) {
                $responseObject['error'] = [
                    'code' => TFAEnforcedException::ERROR_CODE,
                    'message' => TFAEnforcedException::ERROR_MESSAGE
                ];
            }
        }
        return $responseObject;
    }

    /**
     * @param array $user
     *
     * @return array
     *
     */
    public function findOrCreateStaticToken(&$user)
    {
        $user = $user->toArray();
        if (empty($user['token'])) {
            $token = StringUtils::randomString(24, false);
            $userTable = $this->createTableGateway(SchemaManager::COLLECTION_USERS, false);
            $Update = new Update(SchemaManager::COLLECTION_USERS);
            $Update->set(['token' => $token]);
            $Update->where([
                'id' => $user['id']
            ]);
            $userTable->updateWith($Update);
            $user['token'] = $token;
        }
        return $user;
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
            $iconUrl = $iconPath;
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

    public function handleAuthenticationRequestCallback($name, $generateRequestToken = false, $mode = null)
    {
        /** @var Social $socialAuth */
        $socialAuth = $this->container->get('external_auth');
        /** @var AbstractSocialProvider $service */
        $service = $socialAuth->get($name);

        $serviceUser = $service->handle();

        $user = $this->authenticateWithEmail($serviceUser->getEmail());

        switch ($mode) {
            case DirectusUserSessionsTableGateway::TOKEN_COOKIE:
                $user = $this->findOrCreateStaticToken($user);
                $responseData['user'] = $user;
                break;
            case DirectusUserSessionsTableGateway::TOKEN_JWT:
            default:
                $token = $generateRequestToken ? $this->generateRequestToken($user) : $this->generateAuthToken($user);
                $responseData = [
                    'token' => $token,
                    'user' => $user->toArray()
                ];
        }

        return [
            'data' => $responseData
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
     * @param $reset_url
     */
    public function sendResetPasswordToken($email, $reset_url)
    {
        $this->validate(['email' => $email], ['email' => 'required|email']);

        /** @var Provider $auth */
        $auth = $this->container->get('auth');
        $user = $auth->findUserWithEmail($email);
        $resetToken = $auth->generateResetPasswordToken($user);

        // Storing the reset_token into password_reset_token to validate it.
        $userProvider = $auth->getUserProvider();
        $userProvider->update($user, [
            'password_reset_token' => $resetToken,
        ]);
        // Sending the project key in the query param makes sure the app will use the correct project
        // to send the new password to

        if ($reset_url) {
            $resetUrl = $reset_url . '?token=' . $resetToken;
        } else {
            $resetUrl = get_url() . 'admin/#/reset-password?token=' . $resetToken . '&project=' . get_api_project_from_request();
        }

        \Directus\send_forgot_password_email($user->toArray(), $resetUrl);
    }

    public function resetPasswordWithToken($token, $newPassword)
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

        if ($user->password_reset_token == null || $user->password_reset_token != $token) {
            throw new ExpiredResetPasswordToken($token);
        }

        $userProvider->update($user, [
            'password_reset_token' => null,
            'password' => $auth->hashPassword($newPassword)
        ]);
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

        $payload = JWTUtils::getPayload($token);
        $userProvider = $auth->getUserProvider();
        $user = $userProvider->find($payload->id);

        /** @var UsersService $usersService */
        $usersService = new UsersService($this->container);

        $tfa_enforced = $usersService->has2FAEnforced($user->getId());

        if ($tfa_enforced && $user->get2FASecret() == null) {
            $new_token = $auth->refreshToken($token, true);
        } else {
            $new_token = $auth->refreshToken($token);
        }

        return ['data' => ['token' => $new_token]];
    }

    /**
     * Validates email+password+otp credentials
     *
     * @param $email
     * @param $password
     * @param $otp
     *
     * @throws UnprocessableEntityException
     */
    protected function validateCredentials($email, $password, $otp)
    {
        $payload = [
            'email' => $email,
            'password' => $password,
            'otp' => $otp
        ];
        $constraints = [
            'email' => 'required|string|email',
            'password' => 'required|string',
        ];

        // throws an exception if the constraints are not met
        $this->validate($payload, $constraints, self::AUTH_VALIDATION_ERROR_CODE);
    }
}
