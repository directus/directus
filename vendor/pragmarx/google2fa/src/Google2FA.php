<?php

namespace PragmaRX\Google2FA;

use PragmaRX\Google2FA\Exceptions\SecretKeyTooShortException;
use PragmaRX\Google2FA\Support\Base32;
use PragmaRX\Google2FA\Support\Constants;
use PragmaRX\Google2FA\Support\QRCode;

class Google2FA
{
    use QRCode, Base32;

    /**
     * Length of the Token generated.
     */
    protected $oneTimePasswordLength = 6;

    /**
     * Interval between key regeneration.
     */
    protected $keyRegeneration = 30;

    /**
     * Secret.
     */
    protected $secret;

    /**
     * Window.
     */
    protected $window = 1; // Keys will be valid for 60 seconds

    /**
     * Find a valid One Time Password.
     *
     * @param $secret
     * @param $key
     * @param $window
     * @param $startingTimestamp
     * @param $timestamp
     * @param string $oldTimestamp
     *
     * @throws \PragmaRX\Google2FA\Exceptions\SecretKeyTooShortException
     * @throws \PragmaRX\Google2FA\Exceptions\InvalidCharactersException
     * @throws \PragmaRX\Google2FA\Exceptions\IncompatibleWithGoogleAuthenticatorException
     *
     * @return bool
     */
    public function findValidOTP(
        $secret,
        $key,
        $window,
        $startingTimestamp,
        $timestamp,
        $oldTimestamp = Constants::ARGUMENT_NOT_SET
    ) {
        for (
            ;
            $startingTimestamp <= $timestamp + $this->getWindow($window);
            $startingTimestamp++
        ) {
            if (
                hash_equals($this->oathHotp($secret, $startingTimestamp), $key)
            ) {
                return $oldTimestamp === Constants::ARGUMENT_NOT_SET
                    ? true
                    : $startingTimestamp;
            }
        }

        return false;
    }

    /**
     * Generate a digit secret key in base32 format.
     *
     * @param int    $length
     * @param string $prefix
     *
     * @throws Exceptions\InvalidCharactersException
     * @throws Exceptions\IncompatibleWithGoogleAuthenticatorException
     *
     * @return string
     */
    public function generateSecretKey($length = 16, $prefix = '')
    {
        return $this->generateBase32RandomKey($length, $prefix);
    }

    /**
     * Get the current one time password for a key.
     *
     * @param $secret
     *
     * @throws \PragmaRX\Google2FA\Exceptions\SecretKeyTooShortException
     * @throws \PragmaRX\Google2FA\Exceptions\InvalidCharactersException
     * @throws \PragmaRX\Google2FA\Exceptions\IncompatibleWithGoogleAuthenticatorException
     *
     * @return string
     */
    public function getCurrentOtp($secret)
    {
        return $this->oathHotp($secret, $this->getTimestamp());
    }

    /**
     * Get key regeneration.
     *
     * @return mixed
     */
    public function getKeyRegeneration()
    {
        return $this->keyRegeneration;
    }

    /**
     * Get OTP length.
     *
     * @return mixed
     */
    public function getOneTimePasswordLength()
    {
        return $this->oneTimePasswordLength;
    }

    /**
     * Get secret.
     *
     * @param string|null $secret
     *
     * @return mixed
     */
    public function getSecret($secret = null)
    {
        return is_null($secret) ? $this->secret : $secret;
    }

    /**
     * Returns the current Unix Timestamp divided by the $keyRegeneration
     * period.
     *
     * @return int
     **/
    public function getTimestamp()
    {
        return (int) floor(microtime(true) / $this->keyRegeneration);
    }

    /**
     * Get the OTP window.
     *
     * @param null|int $window
     *
     * @return mixed
     */
    public function getWindow($window = null)
    {
        return is_null($window) ? $this->window : $window;
    }

    /**
     * Make a window based starting timestamp.
     *
     * @param $window
     * @param $timestamp
     * @param $oldTimestamp
     *
     * @return mixed
     */
    private function makeStartingTimestamp($window, $timestamp, $oldTimestamp)
    {
        return $oldTimestamp === Constants::ARGUMENT_NOT_SET
            ? $timestamp - $this->getWindow($window)
            : max($timestamp - $this->getWindow($window), $oldTimestamp + 1);
    }

    /**
     * Get/use a starting timestamp for key verification.
     *
     * @param string|int|null $timestamp
     *
     * @return int
     */
    protected function makeTimestamp($timestamp = null)
    {
        if (is_null($timestamp)) {
            return $this->getTimestamp();
        }

        return (int) $timestamp;
    }

    /**
     * Takes the secret key and the timestamp and returns the one time
     * password.
     *
     * @param string $secret  - Secret key in binary form.
     * @param int    $counter - Timestamp as returned by getTimestamp.
     *
     * @throws \PragmaRX\Google2FA\Exceptions\SecretKeyTooShortException
     * @throws \PragmaRX\Google2FA\Exceptions\InvalidCharactersException
     * @throws Exceptions\IncompatibleWithGoogleAuthenticatorException
     *
     * @return string
     */
    public function oathHotp($secret, $counter)
    {
        $secret = $this->base32Decode($this->getSecret($secret));

        if (strlen($secret) < 8) {
            throw new SecretKeyTooShortException();
        }

        // Counter must be 64-bit int
        $bin_counter = pack('N*', 0, $counter);

        $hash = hash_hmac('sha1', $bin_counter, $secret, true);

        return str_pad(
            $this->oathTruncate($hash),
            $this->getOneTimePasswordLength(),
            '0',
            STR_PAD_LEFT
        );
    }

    /**
     * Extracts the OTP from the SHA1 hash.
     *
     * @param string $hash
     *
     * @return int
     **/
    public function oathTruncate($hash)
    {
        $offset = ord($hash[19]) & 0xf;

        $temp = unpack('N', substr($hash, $offset, 4));

        return substr(
            $temp[1] & 0x7fffffff,
            -$this->getOneTimePasswordLength()
        );
    }

    /**
     * Remove invalid chars from a base 32 string.
     *
     * @param $string
     *
     * @return mixed
     */
    public function removeInvalidChars($string)
    {
        return preg_replace(
            '/[^' . Constants::VALID_FOR_B32 . ']/',
            '',
            $string
        );
    }

    /**
     * Setter for the enforce Google Authenticator compatibility property.
     *
     * @param mixed $enforceGoogleAuthenticatorCompatibility
     *
     * @return $this
     */
    public function setEnforceGoogleAuthenticatorCompatibility(
        $enforceGoogleAuthenticatorCompatibility
    ) {
        $this->enforceGoogleAuthenticatorCompatibility = $enforceGoogleAuthenticatorCompatibility;

        return $this;
    }

    /**
     * Set key regeneration.
     *
     * @param mixed $keyRegeneration
     */
    public function setKeyRegeneration($keyRegeneration)
    {
        $this->keyRegeneration = $keyRegeneration;
    }

    /**
     * Set OTP length.
     *
     * @param mixed $oneTimePasswordLength
     */
    public function setOneTimePasswordLength($oneTimePasswordLength)
    {
        $this->oneTimePasswordLength = $oneTimePasswordLength;
    }

    /**
     * Set secret.
     *
     * @param mixed $secret
     */
    public function setSecret($secret)
    {
        $this->secret = $secret;
    }

    /**
     * Set the OTP window.
     *
     * @param mixed $window
     */
    public function setWindow($window)
    {
        $this->window = $window;
    }

    /**
     * Verifies a user inputted key against the current timestamp. Checks $window
     * keys either side of the timestamp.
     *
     * @param string          $key          - User specified key
     * @param null|string     $secret
     * @param null|int        $window
     * @param null|int        $timestamp
     * @param null|string|int $oldTimestamp
     *
     * @throws \PragmaRX\Google2FA\Exceptions\SecretKeyTooShortException
     * @throws \PragmaRX\Google2FA\Exceptions\InvalidCharactersException
     * @throws \PragmaRX\Google2FA\Exceptions\IncompatibleWithGoogleAuthenticatorException
     *
     * @return bool|int
     */
    public function verify(
        $key,
        $secret = null,
        $window = null,
        $timestamp = null,
        $oldTimestamp = Constants::ARGUMENT_NOT_SET
    ) {
        return $this->verifyKey(
            $secret,
            $key,
            $window,
            $timestamp,
            $oldTimestamp
        );
    }

    /**
     * Verifies a user inputted key against the current timestamp. Checks $window
     * keys either side of the timestamp.
     *
     * @param string          $secret
     * @param string          $key          - User specified key
     * @param null|int        $window
     * @param null|int        $timestamp
     * @param null|string|int $oldTimestamp
     *
     * @throws \PragmaRX\Google2FA\Exceptions\SecretKeyTooShortException
     * @throws \PragmaRX\Google2FA\Exceptions\InvalidCharactersException
     * @throws \PragmaRX\Google2FA\Exceptions\IncompatibleWithGoogleAuthenticatorException
     *
     * @return bool|int
     */
    public function verifyKey(
        $secret,
        $key,
        $window = null,
        $timestamp = null,
        $oldTimestamp = Constants::ARGUMENT_NOT_SET
    ) {
        $timestamp = $this->makeTimestamp($timestamp);

        return $this->findValidOTP(
            $secret,
            $key,
            $window,
            $this->makeStartingTimestamp($window, $timestamp, $oldTimestamp),
            $timestamp,
            $oldTimestamp
        );
    }

    /**
     * Verifies a user inputted key against the current timestamp. Checks $window
     * keys either side of the timestamp, but ensures that the given key is newer than
     * the given oldTimestamp. Useful if you need to ensure that a single key cannot
     * be used twice.
     *
     * @param string   $secret
     * @param string   $key          - User specified key
     * @param int      $oldTimestamp - The timestamp from the last verified key
     * @param int|null $window
     * @param int|null $timestamp
     *
     * @throws \PragmaRX\Google2FA\Exceptions\SecretKeyTooShortException
     * @throws \PragmaRX\Google2FA\Exceptions\InvalidCharactersException
     * @throws \PragmaRX\Google2FA\Exceptions\IncompatibleWithGoogleAuthenticatorException
     *
     * @return bool|int - false (not verified) or the timestamp of the verified key
     */
    public function verifyKeyNewer(
        $secret,
        $key,
        $oldTimestamp,
        $window = null,
        $timestamp = null
    ) {
        return $this->verifyKey(
            $secret,
            $key,
            $window,
            $timestamp,
            $oldTimestamp
        );
    }
}
