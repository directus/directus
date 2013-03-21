<?php

namespace Directus\Auth;

class Provider {

	const SESSION_KEY = "auth_user";

	/**
	 * Attempt authentication after user submission.
	 * @param  int $uid             The User account's ID.
	 * @param  string $password        The User account's (actual) hashed password string.
	 * @param  string $salt            The User account's salt string.
	 * @param  string $passwordAttempt The User's attempted, unhashed password string.
	 * @return boolean
	 */
	public function login($uid, $password, $salt, $passwordAttempt) {
		$hashedPasswordAttempt = $this->hashPassword($passwordAttempt, $salt);
		if($password === $hashedPasswordAttempt) {
			$this->completeAuthentication($uid);
			return true;
		}
		return false;
	}

	/**
	 * De-authenticate the logged-in user.
	 * @return null
	 * @throws  \Directus\Auth\UserIsntLoggedInException
	 */
	public function logout() {
		if(!$this->loggedIn()) {
			throw new UserIsntLoggedInException("Attempting to de-authenticate a user when a user isn't \
				authenticated.");
		}
		$_SESSION[self::SESSION_KEY] = array();
	}

	/**
	 * Check if a user is logged in.
	 * @return boolean
	 */
	public function loggedIn() {
		return isset($_SESSION[self::SESSION_KEY]) && !empty($_SESSION[self::SESSION_KEY]);
	}
	/**
	 * Retrieve metadata about the currently logged in user.
	 * @return array Authenticated user metadata.
	 * @throws  \Directus\Auth\UserIsntLoggedInException
	 */
	public function getUserInfo() {
		if(!$this->loggedIn()) {
			throw new UserIsntLoggedInException("Attempting to inspect the authenticated user when \
				a user isn't authenticated.");
		}
		return $_SESSION[self::SESSION_KEY];
	}

	/**
	 * After a successful login attempt, registers the user in the session.
	 * @param  int $uid The User account's ID.
	 * @return null
	 * @throws  \Directus\Auth\UserAlreadyLoggedInException
	 */
	private function completeLogin($uid) {
		if($this->loggedIn()) {
			throw new UserAlreadyLoggedInException("Attempting to authenticate a user when a user is already \
				authenticated.");
		}
		$user = array( 'id' => $uid );
		$_SESSION[self::SESSION_KEY] = $user;
	}

	/**
	 * Run the hashing algorithm on a password and salt value.
	 * @param  string $password
	 * @param  string $salt
	 * @return string
	 */
	private function hashPassword($password, $salt) {
		$PHPass = new \Directus\Auth\PasswordHash(8, true);
		return $PHPass->HashPassword( $salt . $password );
	}

}

/**
 * Exceptions
 */

class UserAlreadyLoggedInException extends \Exception {}

class UserIsntLoggedInException extends \Exception {}