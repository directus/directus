<?php
/**
 * Slim - a micro PHP 5 framework
 *
 * @author      Josh Lockhart <info@slimframework.com>
 * @copyright   2011 Josh Lockhart
 * @link        http://www.slimframework.com
 * @license     http://www.slimframework.com/license
 * @version     2.6.1
 * @package     Slim
 *
 * MIT LICENSE
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
namespace Slim\Http;

/**
 * Slim HTTP Utilities
 *
 * This class provides useful methods for handling HTTP requests.
 *
 * @package Slim
 * @author  Josh Lockhart
 * @since   1.0.0
 */
class Util
{
    /**
     * Strip slashes from string or array
     *
     * This method strips slashes from its input. By default, this method will only
     * strip slashes from its input if magic quotes are enabled. Otherwise, you may
     * override the magic quotes setting with either TRUE or FALSE as the send argument
     * to force this method to strip or not strip slashes from its input.
     *
     * @param  array|string    $rawData
     * @param  bool            $overrideStripSlashes
     * @return array|string
     */
    public static function stripSlashesIfMagicQuotes($rawData, $overrideStripSlashes = null)
    {
        $strip = is_null($overrideStripSlashes) ? get_magic_quotes_gpc() : $overrideStripSlashes;
        if ($strip) {
            return self::stripSlashes($rawData);
        }

        return $rawData;
    }

    /**
     * Strip slashes from string or array
     * @param  array|string $rawData
     * @return array|string
     */
    protected static function stripSlashes($rawData)
    {
        return is_array($rawData) ? array_map(array('self', 'stripSlashes'), $rawData) : stripslashes($rawData);
    }

    /**
     * Encrypt data
     *
     * This method will encrypt data using a given key, vector, and cipher.
     * By default, this will encrypt data using the RIJNDAEL/AES 256 bit cipher. You
     * may override the default cipher and cipher mode by passing your own desired
     * cipher and cipher mode as the final key-value array argument.
     *
     * @param  string $data     The unencrypted data
     * @param  string $key      The encryption key
     * @param  string $iv       The encryption initialization vector
     * @param  array  $settings Optional key-value array with custom algorithm and mode
     * @return string
     */
    public static function encrypt($data, $key, $iv, $settings = array())
    {
        if ($data === '' || !extension_loaded('mcrypt')) {
            return $data;
        }

        //Merge settings with defaults
        $defaults = array(
            'algorithm' => MCRYPT_RIJNDAEL_256,
            'mode' => MCRYPT_MODE_CBC
        );
        $settings = array_merge($defaults, $settings);

        //Get module
        $module = mcrypt_module_open($settings['algorithm'], '', $settings['mode'], '');

        //Validate IV
        $ivSize = mcrypt_enc_get_iv_size($module);
        if (strlen($iv) > $ivSize) {
            $iv = substr($iv, 0, $ivSize);
        }

        //Validate key
        $keySize = mcrypt_enc_get_key_size($module);
        if (strlen($key) > $keySize) {
            $key = substr($key, 0, $keySize);
        }

        //Encrypt value
        mcrypt_generic_init($module, $key, $iv);
        $res = @mcrypt_generic($module, $data);
        mcrypt_generic_deinit($module);

        return $res;
    }

    /**
     * Decrypt data
     *
     * This method will decrypt data using a given key, vector, and cipher.
     * By default, this will decrypt data using the RIJNDAEL/AES 256 bit cipher. You
     * may override the default cipher and cipher mode by passing your own desired
     * cipher and cipher mode as the final key-value array argument.
     *
     * @param  string $data     The encrypted data
     * @param  string $key      The encryption key
     * @param  string $iv       The encryption initialization vector
     * @param  array  $settings Optional key-value array with custom algorithm and mode
     * @return string
     */
    public static function decrypt($data, $key, $iv, $settings = array())
    {
        if ($data === '' || !extension_loaded('mcrypt')) {
            return $data;
        }

        //Merge settings with defaults
        $defaults = array(
            'algorithm' => MCRYPT_RIJNDAEL_256,
            'mode' => MCRYPT_MODE_CBC
        );
        $settings = array_merge($defaults, $settings);

        //Get module
        $module = mcrypt_module_open($settings['algorithm'], '', $settings['mode'], '');

        //Validate IV
        $ivSize = mcrypt_enc_get_iv_size($module);
        if (strlen($iv) > $ivSize) {
            $iv = substr($iv, 0, $ivSize);
        }

        //Validate key
        $keySize = mcrypt_enc_get_key_size($module);
        if (strlen($key) > $keySize) {
            $key = substr($key, 0, $keySize);
        }

        //Decrypt value
        mcrypt_generic_init($module, $key, $iv);
        $decryptedData = @mdecrypt_generic($module, $data);
        $res = rtrim($decryptedData, "\0");
        mcrypt_generic_deinit($module);

        return $res;
    }

    /**
     * Serialize Response cookies into raw HTTP header
     * @param  \Slim\Http\Headers $headers The Response headers
     * @param  \Slim\Http\Cookies $cookies The Response cookies
     * @param  array              $config  The Slim app settings
     */
    public static function serializeCookies(\Slim\Http\Headers &$headers, \Slim\Http\Cookies $cookies, array $config)
    {
        if ($config['cookies.encrypt']) {
            foreach ($cookies as $name => $settings) {
                if (is_string($settings['expires'])) {
                    $expires = strtotime($settings['expires']);
                } else {
                    $expires = (int) $settings['expires'];
                }

                $settings['value'] = static::encodeSecureCookie(
                    $settings['value'],
                    $expires,
                    $config['cookies.secret_key'],
                    $config['cookies.cipher'],
                    $config['cookies.cipher_mode']
                );
                static::setCookieHeader($headers, $name, $settings);
            }
        } else {
            foreach ($cookies as $name => $settings) {
                static::setCookieHeader($headers, $name, $settings);
            }
        }
    }

    /**
     * Encode secure cookie value
     *
     * This method will create the secure value of an HTTP cookie. The
     * cookie value is encrypted and hashed so that its value is
     * secure and checked for integrity when read in subsequent requests.
     *
     * @param string $value     The insecure HTTP cookie value
     * @param int    $expires   The UNIX timestamp at which this cookie will expire
     * @param string $secret    The secret key used to hash the cookie value
     * @param int    $algorithm The algorithm to use for encryption
     * @param int    $mode      The algorithm mode to use for encryption
     * @return string
     */
    public static function encodeSecureCookie($value, $expires, $secret, $algorithm, $mode)
    {
        $key = hash_hmac('sha1', (string) $expires, $secret);
        $iv = self::getIv($expires, $secret);
        $secureString = base64_encode(
            self::encrypt(
                $value,
                $key,
                $iv,
                array(
                    'algorithm' => $algorithm,
                    'mode' => $mode
                )
            )
        );
        $verificationString = hash_hmac('sha1', $expires . $value, $key);

        return implode('|', array($expires, $secureString, $verificationString));
    }

    /**
     * Decode secure cookie value
     *
     * This method will decode the secure value of an HTTP cookie. The
     * cookie value is encrypted and hashed so that its value is
     * secure and checked for integrity when read in subsequent requests.
     *
     * @param string $value     The secure HTTP cookie value
     * @param string $secret    The secret key used to hash the cookie value
     * @param int    $algorithm The algorithm to use for encryption
     * @param int    $mode      The algorithm mode to use for encryption
     * @return bool|string
     */
    public static function decodeSecureCookie($value, $secret, $algorithm, $mode)
    {
        if ($value) {
            $value = explode('|', $value);
            if (count($value) === 3 && ((int) $value[0] === 0 || (int) $value[0] > time())) {
                $key = hash_hmac('sha1', $value[0], $secret);
                $iv = self::getIv($value[0], $secret);
                $data = self::decrypt(
                    base64_decode($value[1]),
                    $key,
                    $iv,
                    array(
                        'algorithm' => $algorithm,
                        'mode' => $mode
                    )
                );
                $verificationString = hash_hmac('sha1', $value[0] . $data, $key);
                if ($verificationString === $value[2]) {
                    return $data;
                }
            }
        }

        return false;
    }

    /**
     * Set HTTP cookie header
     *
     * This method will construct and set the HTTP `Set-Cookie` header. Slim
     * uses this method instead of PHP's native `setcookie` method. This allows
     * more control of the HTTP header irrespective of the native implementation's
     * dependency on PHP versions.
     *
     * This method accepts the Slim_Http_Headers object by reference as its
     * first argument; this method directly modifies this object instead of
     * returning a value.
     *
     * @param  array  $header
     * @param  string $name
     * @param  string $value
     */
    public static function setCookieHeader(&$header, $name, $value)
    {
        //Build cookie header
        if (is_array($value)) {
            $domain = '';
            $path = '';
            $expires = '';
            $secure = '';
            $httponly = '';
            if (isset($value['domain']) && $value['domain']) {
                $domain = '; domain=' . $value['domain'];
            }
            if (isset($value['path']) && $value['path']) {
                $path = '; path=' . $value['path'];
            }
            if (isset($value['expires'])) {
                if (is_string($value['expires'])) {
                    $timestamp = strtotime($value['expires']);
                } else {
                    $timestamp = (int) $value['expires'];
                }
                if ($timestamp !== 0) {
                    $expires = '; expires=' . gmdate('D, d-M-Y H:i:s e', $timestamp);
                }
            }
            if (isset($value['secure']) && $value['secure']) {
                $secure = '; secure';
            }
            if (isset($value['httponly']) && $value['httponly']) {
                $httponly = '; HttpOnly';
            }
            $cookie = sprintf('%s=%s%s', urlencode($name), urlencode((string) $value['value']), $domain . $path . $expires . $secure . $httponly);
        } else {
            $cookie = sprintf('%s=%s', urlencode($name), urlencode((string) $value));
        }

        //Set cookie header
        if (!isset($header['Set-Cookie']) || $header['Set-Cookie'] === '') {
            $header['Set-Cookie'] = $cookie;
        } else {
            $header['Set-Cookie'] = implode("\n", array($header['Set-Cookie'], $cookie));
        }
    }

    /**
     * Delete HTTP cookie header
     *
     * This method will construct and set the HTTP `Set-Cookie` header to invalidate
     * a client-side HTTP cookie. If a cookie with the same name (and, optionally, domain)
     * is already set in the HTTP response, it will also be removed. Slim uses this method
     * instead of PHP's native `setcookie` method. This allows more control of the HTTP header
     * irrespective of PHP's native implementation's dependency on PHP versions.
     *
     * This method accepts the Slim_Http_Headers object by reference as its
     * first argument; this method directly modifies this object instead of
     * returning a value.
     *
     * @param  array  $header
     * @param  string $name
     * @param  array  $value
     */
    public static function deleteCookieHeader(&$header, $name, $value = array())
    {
        //Remove affected cookies from current response header
        $cookiesOld = array();
        $cookiesNew = array();
        if (isset($header['Set-Cookie'])) {
            $cookiesOld = explode("\n", $header['Set-Cookie']);
        }
        foreach ($cookiesOld as $c) {
            if (isset($value['domain']) && $value['domain']) {
                $regex = sprintf('@%s=.*domain=%s@', urlencode($name), preg_quote($value['domain']));
            } else {
                $regex = sprintf('@%s=@', urlencode($name));
            }
            if (preg_match($regex, $c) === 0) {
                $cookiesNew[] = $c;
            }
        }
        if ($cookiesNew) {
            $header['Set-Cookie'] = implode("\n", $cookiesNew);
        } else {
            unset($header['Set-Cookie']);
        }

        //Set invalidating cookie to clear client-side cookie
        self::setCookieHeader($header, $name, array_merge(array('value' => '', 'path' => null, 'domain' => null, 'expires' => time() - 100), $value));
    }

    /**
     * Parse cookie header
     *
     * This method will parse the HTTP request's `Cookie` header
     * and extract cookies into an associative array.
     *
     * @param  string
     * @return array
     */
    public static function parseCookieHeader($header)
    {
        $cookies = array();
        $header = rtrim($header, "\r\n");
        $headerPieces = preg_split('@\s*[;,]\s*@', $header);
        foreach ($headerPieces as $c) {
            $cParts = explode('=', $c, 2);
            if (count($cParts) === 2) {
                $key = urldecode($cParts[0]);
                $value = urldecode($cParts[1]);
                if (!isset($cookies[$key])) {
                    $cookies[$key] = $value;
                }
            }
        }

        return $cookies;
    }

    /**
     * Generate a random IV
     *
     * This method will generate a non-predictable IV for use with
     * the cookie encryption
     *
     * @param  int    $expires The UNIX timestamp at which this cookie will expire
     * @param  string $secret  The secret key used to hash the cookie value
     * @return string Hash
     */
    private static function getIv($expires, $secret)
    {
        $data1 = hash_hmac('sha1', 'a'.$expires.'b', $secret);
        $data2 = hash_hmac('sha1', 'z'.$expires.'y', $secret);

        return pack("h*", $data1.$data2);
    }
}
