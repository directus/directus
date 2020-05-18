<?php

namespace Directus\Authentication;

use Directus\Application\Application;

use Directus\Authentication\Exception\ExpiredTokenException;
use Directus\Authentication\Exception\InvalidOTPException;
use Directus\Authentication\Exception\InvalidTokenException;
use Directus\Authentication\Exception\InvalidUserCredentialsException;
use Directus\Authentication\Exception\Missing2FAPasswordException;
use Directus\Authentication\Exception\UserInactiveException;
use Directus\Authentication\Exception\UserNotAuthenticatedException;
use Directus\Authentication\Exception\UserNotFoundException;
use Directus\Authentication\Exception\UserWithEmailNotFoundException;
use Directus\Authentication\Exception\UserSuspendedException;
use Directus\Database\TableGatewayFactory;
use Directus\Database\Schema\SchemaManager;
use Directus\Database\TableGateway\DirectusActivityTableGateway;
use Directus\Database\TableGateway\DirectusUsersTableGateway;
use Directus\Authentication\User\Provider\UserProviderInterface;
use Directus\Authentication\User\UserInterface;
use Directus\Exception\Exception;
use function Directus\get_api_project_from_request;
use function Directus\get_project_config;
use function Directus\get_directus_setting;
use Directus\Util\ArrayUtils;
use Directus\Util\DateTimeUtils;
use Directus\Util\JWTUtils;
use PragmaRX\Google2FA\Google2FA;

class Provider
{
    /**
     * The user ID of the public API user.
     *
     * @var integer
     */
    const PUBLIC_USER_ID = 0;

    /**
     * Whether the user has been authenticated or not
     *
     * @var bool
     */
    protected $authenticated = false;

    /**
     * Authenticated user information
     *
     * @var UserInterface
     */
    protected $user;

    /**
     * User Provider
     *
     * @var UserProviderInterface
     */
    protected $userProvider;

    /**
     * @var string
     */
    protected $secretKey;

    /**
     * @var string
     */
    protected $publicKey;

    /**
     * JWT time to live in minutes
     *
     * @var int
     */
    protected $ttl;

    public function __construct(UserProviderInterface $userProvider, array $options = [])
    {
        if (!isset($options['secret_key']) || !is_string($options['secret_key'])) {
            throw new Exception('auth: secret key is required and it must be a string');
        }

        $ttl = get_directus_setting('auth_token_ttl', ArrayUtils::get($options, 'auth.ttl', 20));
        if (!is_numeric($ttl)) {
            throw new Exception('ttl must be a number');
        }

        $this->userProvider = $userProvider;
        $this->user = null;
        $this->secretKey = $options['secret_key'];
        $this->publicKey = ArrayUtils::get($options, 'public_key');
        $this->ttl = (int) $ttl;
    }

    /**
     * @throws UserNotAuthenticatedException
     */
    protected function enforceUserIsAuthenticated()
    {
        if (!$this->check()) {
            throw new UserNotAuthenticatedException('Attempting to inspect a non-authenticated user');
        }
    }

    /**
     * Signing In a user
     *
     * Creating the user token and resetting previous token
     *
     * @param array $credentials
     *
     * @return UserInterface
     *
     * @throws InvalidUserCredentialsException
     * @throws Missing2FAPasswordException
     * @throws UserInactiveException
     */
    public function login(array $credentials)
    {
        $email = ArrayUtils::get($credentials, 'email');
        $password = ArrayUtils::get($credentials, 'password');
        $otp = ArrayUtils::get($credentials, 'otp');

        $user = null;
        if ($email && $password) {
            // Verify Credentials
            $user = $this->findUserWithCredentials($email, $password, $otp);
            $this->setUser($user);
        }

        return $user;
    }

    /**
     * Finds a user with the given conditions
     *
     * @param array $conditions
     * @return User\User
     *
     * @throws UserInactiveException
     * @throws UserNotFoundException
     */
    public function findUserWithConditions(array $conditions)
    {
        $user = $this->userProvider->findWhere($conditions);

        $this->validateUser($user);

        return $user;
    }

    /**
     * Returns a user if the credentials matches
     *
     * @param string $email
     * @param string $password
     *
     * @return UserInterface
     *
     * @throws InvalidUserCredentialsException
     * @throws InvalidOTPException
     * @throws Missing2FAPasswordException
     */
    public function findUserWithCredentials($email, $password, $otp = null)
    {
        $hookEmitter = Application::getInstance()->getContainer()->get('hook_emitter');
	    
        try {
            $user = $this->findUserWithEmail($email);
        } catch (UserWithEmailNotFoundException $e) {
            throw new InvalidUserCredentialsException();
        }

        // Verify that the user has an id (exists), it returns empty user object otherwise
        if (!password_verify($password, $user->get('password'))) {
			
			$hookEmitter->run('auth.fail', [$user, 'app']);
            $this->recordActivityAndCheckLoginAttempt($user);
            throw new InvalidUserCredentialsException();
        }

        $tfa_secret = $user->get2FASecret();

        if ($tfa_secret) {
            $ga = new Google2FA();

            if ($otp == null) {
                throw new Missing2FAPasswordException();
            }

            if (!$ga->verifyKey($tfa_secret, $otp, 2)) {
                throw new InvalidOTPException();
            }
        }

        $this->user = $user;
        
        $hookEmitter->run('auth.success', [$user, 'app']);

        return $user;
    }

    /**
     * Record invalid credentials action and throw exception if the maximum invalid login attempts reached.
     */
    public function recordActivityAndCheckLoginAttempt($user)
    {
        $userId = $user->get('id');
        $activityTableGateway = TableGatewayFactory::create(SchemaManager::COLLECTION_ACTIVITY, ['acl' => false]);

        // Added this before calculation as system may throw the exception here.
        $activityTableGateway->recordAction($userId, SchemaManager::COLLECTION_USERS, DirectusActivityTableGateway::ACTION_INVALID_CREDENTIALS);

        $loginAttemptsAllowed = get_directus_setting('login_attempts_allowed');

        if (!empty($loginAttemptsAllowed)) {

            // We added 'Invalid credentials' entry before this condition so need to increase this counter with 1
            $totalLoginAttemptsAllowed = $loginAttemptsAllowed + 1;

            $invalidLoginAttempts = $activityTableGateway->getInvalidLoginAttempts($userId, $totalLoginAttemptsAllowed);
            if (!empty($invalidLoginAttempts)) {
                $lastInvalidCredentialsEntry = current($invalidLoginAttempts);
                $firstInvalidCredentialsEntry = end($invalidLoginAttempts);

                $lastLoginAttempt = $activityTableGateway->getLastLoginOrStatusUpdateAttempt($userId);

                if (!empty($lastLoginAttempt) && !in_array($lastLoginAttempt['id'], range($firstInvalidCredentialsEntry['id'], $lastInvalidCredentialsEntry['id'])) &&  count($invalidLoginAttempts) > $loginAttemptsAllowed) {

                    $tableGateway = TableGatewayFactory::create(SchemaManager::COLLECTION_USERS, ['acl' => false]);
                    $update = [
                        'status' => DirectusUsersTableGateway::STATUS_SUSPENDED
                    ];
                    $tableGateway->update($update, ['id' => $userId]);
                    throw new UserSuspendedException();
                }
            }
        }
    }

    /**
     * Returns a user with the given email if exists
     * Otherwise throw an UserNotFoundException
     *
     * @param $email
     *
     * @return User\User
     *
     * @throws UserWithEmailNotFoundException
     */
    public function findUserWithEmail($email)
    {
        $user = $this->userProvider->findByEmail($email);

        try {
            $this->validateUser($user);
        } catch (UserNotFoundException $e) {
            throw new UserWithEmailNotFoundException($email);
        }

        return $user;
    }

    /**
     * Checks if the user is active
     *
     * @param UserInterface $user
     *
     * @return bool
     */
    public function isActive(UserInterface $user)
    {
        $userProvider = $this->userProvider;

        // TODO: Cast attributes values
        return $user->get('status') == $userProvider::STATUS_ACTIVE;
    }

    /**
     * Checks if the user is suspended
     *
     * @param UserInterface $user
     *
     * @return bool
     */
    public function isSuspended(UserInterface $user)
    {
        $userProvider = $this->userProvider;

        // TODO: Cast attributes values
        return $user->get('status') == $userProvider::STATUS_SUSPENDED;
    }

    /**
     * Authenticate an user using a JWT Token
     *
     * @param string $token
     * @param bool $ignoreOrigin
     *
     * @return UserInterface
     *
     * @throws InvalidTokenException
     */
    public function authenticateWithToken($token, $ignoreOrigin = false)
    {
        $payload = $this->getTokenPayload($token, $ignoreOrigin);
        if (!JWTUtils::hasPayloadType(JWTUtils::TYPE_AUTH, $payload)) {
            throw new InvalidTokenException();
        }

        $conditions = [
            'id' => $payload->id,
            // 'group' => $payload->group
        ];

        $user = $this->findUserWithConditions($conditions);

        if ($user) {
            $this->setUser($user);
        }

        return $user;
    }

    public function authenticateWithEmail($email)
    {
        $user = $this->userProvider->findByEmail($email);

        if (!$user) {
            throw new UserWithEmailNotFoundException($email);
        }

        $this->setUser($user);

        return $user;
    }

    /**
     * Authenticate an user using a private token
     *
     * @param string $token
     *
     * @return UserInterface
     *
     * @throws UserInactiveException
     */
    public function authenticateWithPrivateToken($token)
    {
        $user = $this->findUserWithConditions([
            'token' => $token
        ]);

        if ($user) {
            $this->setUser($user);
        }

        return $user;
    }

    /**
     * Force a user id to be the logged user
     *
     * TODO: Change this method name
     *
     * @param UserInterface $user The User account's ID.
     *
     * @return UserInterface
     *
     * @throws UserNotFoundException
     */
    public function forceUserLogin(UserInterface $user)
    {
        $this->setUser($user);

        return $user;
    }

    /**
     * Check if a user is logged in.
     *
     * @return boolean
     */
    public function check()
    {
        return $this->authenticated;
    }

    /**
     * Retrieve metadata about the currently logged in user.
     *
     * @param null|string $attribute
     *
     * @return mixed|array Authenticated user metadata.
     *
     * @throws  \Directus\Authentication\Exception\UserNotAuthenticatedException
     */
    public function getUserAttributes($attribute = null)
    {
        $this->enforceUserIsAuthenticated();
        $user = $this->user->toArray();

        if ($attribute !== null) {
            return array_key_exists($attribute, $user) ? $user[$attribute] : null;
        }

        return $user;
    }

    /**
     * Gets authenticated user object
     *
     * @return UserInterface|null
     */
    public function getUser()
    {
        return $this->user;
    }

    /**
     * Gets the user provider
     *
     * @return UserProviderInterface
     */
    public function getUserProvider()
    {
        return $this->userProvider;
    }

    /**
     * Generates a new access token
     *
     * @param UserInterface $user
     *
     * @param bool $needs2FA Whether the User needs 2FA
     *
     * @return string
     */
    public function generateAuthToken(UserInterface $user)
    {
        $payload = [
            'id' => (int) $user->getId(),
            // 'group' => $user->getGroupId(),
            'exp' => $this->getNewExpirationTime(),
            'ttl' => $this->ttl,
        ];


        return $this->generateToken(JWTUtils::TYPE_AUTH, $payload);
    }

    /**
     * Generates a new request token used to SSO to request an Access Token
     *
     * @param UserInterface $user
     *
     * @return string
     */
    public function generateRequestToken(UserInterface $user)
    {
        $payload = [
            'type' => 'request_token',
            'id' => (int) $user->getId(),
            // 'group' => (int) $user->getGroupId(),
            'exp' => time() + ($this->ttl * DateTimeUtils::MINUTE_IN_SECONDS),
            'ttl' => $this->ttl,
            'url' => \Directus\get_url(),
            'project' => \Directus\get_api_project_from_request()
        ];

        return $this->generateToken(JWTUtils::TYPE_SSO_REQUEST_TOKEN, $payload);
    }

    /**
     * Generates a new reset password token
     *
     * @param UserInterface $user
     *
     * @return string
     */
    public function generateResetPasswordToken(UserInterface $user)
    {
        $payload = [
            'id' => (int) $user->getId(),
            'email' => $user->getEmail(),
            // TODO: Separate time expiration for reset password token
            'exp' => $this->getNewExpirationTime(),
            'ttl' => $this->ttl
        ];

        return $this->generateToken(JWTUtils::TYPE_RESET_PASSWORD, $payload);
    }

    /**
     * Generate invitation token
     *
     * @param array $payload
     *
     * @return string
     */
    public function generateInvitationToken(array $payload)
    {
        return $this->generateToken(JWTUtils::TYPE_INVITATION, $payload);
    }

    /**
     * Generates a new JWT token
     *
     * @param string $type
     * @param array $payload
     *
     * @return string
     */
    public function generateToken($type, array $payload)
    {
        $payload['type'] = (string) $type;
        $payload['key'] = $this->getPublicKey();
        $payload['project'] = get_api_project_from_request();

        return JWTUtils::encode($payload, $this->getSecretKey($payload['project']), $this->getTokenAlgorithm());
    }

    /**
     * Refresh valid token expiration
     *
     * @param $token
     *
     * @return string
     *
     * @throws ExpiredTokenException
     * @throws InvalidTokenException
     */
    public function refreshToken($token, $needs2FA = false)
    {
        $payload = $this->getTokenPayload($token);

        if (!JWTUtils::hasPayloadType(JWTUtils::TYPE_AUTH, $payload)) {
            throw new InvalidTokenException();
        }
        $payload->exp = $this->getNewExpirationTime();

        $payload->needs2FA = $needs2FA;

        return JWTUtils::encode($payload, $this->getSecretKey(get_api_project_from_request()), $this->getTokenAlgorithm());
    }

    /**
     * Checks if the payload matches the public key
     *
     * @param object $payload
     *
     * @return bool
     */
    public function hasPayloadPublicKey($payload)
    {
        return JWTUtils::hasPayloadKey($this->getPublicKey(), $payload);
    }

    /**
     * Checks if the payload matches the project name
     *
     * @param object $payload
     *
     * @return bool
     */
    public function hasPayloadProjectName($payload)
    {
        return JWTUtils::hasPayloadProjectName(get_api_project_from_request(), $payload);
    }

    /**
     * Checks if the origin of the token in from this project configuration
     *
     * @param object $payload
     *
     * @return bool
     */
    public function isPayloadLocal($payload)
    {
        return $this->hasPayloadPublicKey($payload) && $this->hasPayloadProjectName($payload);
    }

    /**
     * Throws an exception if the payload origin doesn't match this project configuration
     *
     * @param object $payload
     *
     * @throws InvalidTokenException
     */
    public function validatePayloadOrigin($payload)
    {
        if (!$this->isPayloadLocal($payload)) {
            throw new InvalidTokenException();
        }
    }

    /**
     * Run the hashing algorithm on a password and salt value.
     *
     * @param  string $password
     *
     * @return string
     */
    public function hashPassword($password)
    {
        // TODO: Create a library to hash/verify passwords up to the user which algorithm to use
        return password_hash($password, PASSWORD_BCRYPT, ['cost' => 10]);
    }

    /**
     * Authentication secret key
     *
     * @param string $project
     *
     * @return string
     */
    public function getSecretKey($project)
    {
        if ($project) {
            $config = get_project_config($project);

            return $config->get('auth.secret_key');
        }

        return $this->secretKey;
    }

    /**
     * Authentication public key
     *
     * @return string
     */
    public function getPublicKey()
    {
        return $this->publicKey;
    }

    /**
     * @return int
     */
    public function getNewExpirationTime()
    {
        return time() + ($this->ttl * DateTimeUtils::MINUTE_IN_SECONDS);
    }

    /**
     * Verifies and Returns the payload if valid
     *
     * @param string $token
     * @param bool $ignoreOrigin
     *
     * @return object
     *
     * @throws InvalidTokenException
     */
    protected function getTokenPayload($token, $ignoreOrigin = false)
    {
        $projectName = $ignoreOrigin ? JWTUtils::getPayload($token, 'project') : null;
        $payload = JWTUtils::decode($token, $this->getSecretKey($projectName), [$this->getTokenAlgorithm()]);

        if ($ignoreOrigin !== true && !$this->isPayloadLocal($payload)) {
            // Empty payload, log this as debug?
            throw new InvalidTokenException();
        }

        return $payload;
    }

    /**
     * Return the token encoding algorithm
     *
     * @return string
     */
    protected function getTokenAlgorithm()
    {
        return 'HS256';
    }

    /**
     * Sets the given user as authenticated
     *
     * @param UserInterface $user
     *
     * @throws UserInactiveException
     * @throws UserNotFoundException
     */
    protected function setUser(UserInterface $user)
    {
        $this->validateUser($user);

        $this->authenticated = true;
        $this->user = $user;
    }

    /**
     * Validates an user object
     *
     * @param UserInterface|null $user
     *
     * @throws UserInactiveException
     * @throws UserNotFoundException
     */
    protected function validateUser($user)
    {
        if (!($user instanceof UserInterface) || !$user->getId()) {
            throw new UserNotFoundException();
        }

        if ($this->isSuspended($user)) {
            throw new UserSuspendedException();
        }

        if (!$this->isActive($user)) {
            throw new UserInactiveException();
        }
    }
}
