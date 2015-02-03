<?php
/**
 * Slim - a micro PHP 5 framework
 *
 * @author      Josh Lockhart <info@slimframework.com>
 * @copyright   2011 Josh Lockhart
 * @link        http://www.slimframework.com
 * @license     http://www.slimframework.com/license
 * @version     2.2.0
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

class SlimHttpUtilTest extends PHPUnit_Framework_TestCase
{
    /**
     * Test strip slashes when magic quotes disabled
     */
    public function testStripSlashesWithoutMagicQuotes()
    {
        $data = "This should have \"quotes\" in it";
        $stripped = \Slim\Http\Util::stripSlashesIfMagicQuotes($data, false);
        $this->assertEquals($data, $stripped);
    }

    /**
     * Test strip slashes from array when magic quotes disabled
     */
    public function testStripSlashesFromArrayWithoutMagicQuotes()
    {
        $data = array("This should have \"quotes\" in it", "And this \"too\" has quotes");
        $stripped = \Slim\Http\Util::stripSlashesIfMagicQuotes($data, false);
        $this->assertEquals($data, $stripped);
    }

    /**
     * Test strip slashes when magic quotes enabled
     */
    public function testStripSlashesWithMagicQuotes()
    {
        $data = "This should have \"quotes\" in it";
        $stripped = \Slim\Http\Util::stripSlashesIfMagicQuotes($data, true);
        $this->assertEquals('This should have "quotes" in it', $stripped);
    }

    /**
     * Test strip slashes from array when magic quotes enabled
     */
    public function testStripSlashesFromArrayWithMagicQuotes()
    {
        $data = array("This should have \"quotes\" in it", "And this \"too\" has quotes");
        $stripped = \Slim\Http\Util::stripSlashesIfMagicQuotes($data, true);
        $this->assertEquals($data = array('This should have "quotes" in it', 'And this "too" has quotes'), $stripped);
    }

    /**
     * Test encrypt and decrypt with valid data
     */
    public function testEncryptAndDecryptWithValidData()
    {
        $data = 'foo';
        $key = 'secret';
        $iv = md5('initializationVector');
        $encrypted = \Slim\Http\Util::encrypt($data, $key, $iv);
        $decrypted = \Slim\Http\Util::decrypt($encrypted, $key, $iv);
        $this->assertEquals($data, $decrypted);
        $this->assertTrue($data !== $encrypted);
    }

    /**
     * Test encrypt when data is empty string
     */
    public function testEncryptWhenDataIsEmptyString()
    {
        $data = '';
        $key = 'secret';
        $iv = md5('initializationVector');
        $encrypted = \Slim\Http\Util::encrypt($data, $key, $iv);
        $this->assertEquals('', $encrypted);
    }

    /**
     * Test decrypt when data is empty string
     */
    public function testDecryptWhenDataIsEmptyString()
    {
        $data = '';
        $key = 'secret';
        $iv = md5('initializationVector');
        $decrypted = \Slim\Http\Util::decrypt($data, $key, $iv);
        $this->assertEquals('', $decrypted);
    }

    /**
     * Test encrypt when IV and key sizes are too long
     */
    public function testEncryptAndDecryptWhenKeyAndIvAreTooLong()
    {
        $data = 'foo';
        $key = 'abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyz';
        $iv = 'abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyz';
        $encrypted = \Slim\Http\Util::encrypt($data, $key, $iv);
        $decrypted = \Slim\Http\Util::decrypt($encrypted, $key, $iv);
        $this->assertEquals($data, $decrypted);
        $this->assertTrue($data !== $encrypted);
    }

    public function testEncodeAndDecodeSecureCookieWithValidData()
    {
        //Prepare cookie value
        $value = 'foo';
        $expires = time() + 86400;
        $secret = 'password';
        $algorithm = MCRYPT_RIJNDAEL_256;
        $mode = MCRYPT_MODE_CBC;
        $encodedValue = \Slim\Http\Util::encodeSecureCookie($value, $expires, $secret, $algorithm, $mode);
        $decodedValue = \Slim\Http\Util::decodeSecureCookie($encodedValue, $secret, $algorithm, $mode);

        //Test secure cookie value
        $parts = explode('|', $encodedValue);
        $this->assertEquals(3, count($parts));
        $this->assertEquals($expires, $parts[0]);
        $this->assertEquals($value, $decodedValue);
    }

    /**
     * Test encode/decode secure cookie with old expiration
     *
     * In this test, the expiration date is purposefully set to a time before now.
     * When decoding the encoded cookie value, FALSE is returned since the cookie
     * will have expired before it is decoded.
     */
    public function testEncodeAndDecodeSecureCookieWithOldExpiration()
    {
        $value = 'foo';
        $expires = time() - 100;
        $secret = 'password';
        $algorithm = MCRYPT_RIJNDAEL_256;
        $mode = MCRYPT_MODE_CBC;
        $encodedValue = \Slim\Http\Util::encodeSecureCookie($value, $expires, $secret, $algorithm, $mode);
        $decodedValue = \Slim\Http\Util::decodeSecureCookie($encodedValue, $secret, $algorithm, $mode);
        $this->assertFalse($decodedValue);
    }

    /**
     * Test encode/decode secure cookie with tampered data
     *
     * In this test, the encoded data is purposefully changed to simulate someone
     * tampering with the client-side cookie data. When decoding the encoded cookie value,
     * FALSE is returned since the verification key will not match.
     */
    public function testEncodeAndDecodeSecureCookieWithTamperedData()
    {
        $value = 'foo';
        $expires = time() + 86400;
        $secret = 'password';
        $algorithm = MCRYPT_RIJNDAEL_256;
        $mode = MCRYPT_MODE_CBC;
        $encodedValue = \Slim\Http\Util::encodeSecureCookie($value, $expires, $secret, $algorithm, $mode);
        $encodedValueParts = explode('|', $encodedValue);
        $encodedValueParts[1] = $encodedValueParts[1] . 'changed';
        $encodedValue = implode('|', $encodedValueParts);
        $decodedValue = \Slim\Http\Util::decodeSecureCookie($encodedValue, $secret, $algorithm, $mode);
        $this->assertFalse($decodedValue);
    }

    public function testSetCookieHeaderWithNameAndValue()
    {
        $name = 'foo';
        $value = 'bar';
        $header = array();
        \Slim\Http\Util::setCookieHeader($header, $name, $value);
        $this->assertEquals('foo=bar', $header['Set-Cookie']);
    }

    public function testSetCookieHeaderWithNameAndValueWhenCookieAlreadySet()
    {
        $name = 'foo';
        $value = 'bar';
        $header = array('Set-Cookie' => 'one=two');
        \Slim\Http\Util::setCookieHeader($header, $name, $value);
        $this->assertEquals("one=two\nfoo=bar", $header['Set-Cookie']);
    }

    public function testSetCookieHeaderWithNameAndValueAndDomain()
    {
        $name = 'foo';
        $value = 'bar';
        $domain = 'foo.com';
        $header = array();
        \Slim\Http\Util::setCookieHeader($header, $name, array(
            'value' => $value,
            'domain' => $domain
        ));
        $this->assertEquals('foo=bar; domain=foo.com', $header['Set-Cookie']);
    }

    public function testSetCookieHeaderWithNameAndValueAndDomainAndPath()
    {
        $name = 'foo';
        $value = 'bar';
        $domain = 'foo.com';
        $path = '/foo';
        $header = array();
        \Slim\Http\Util::setCookieHeader($header, $name, array(
            'value' => $value,
            'domain' => $domain,
            'path' => $path
        ));
        $this->assertEquals('foo=bar; domain=foo.com; path=/foo', $header['Set-Cookie']);
    }

    public function testSetCookieHeaderWithNameAndValueAndDomainAndPathAndExpiresAsString()
    {
        $name = 'foo';
        $value = 'bar';
        $domain = 'foo.com';
        $path = '/foo';
        $expires = '2 days';
        $expiresFormat = gmdate('D, d-M-Y H:i:s e', strtotime($expires));
        $header = array();
        \Slim\Http\Util::setCookieHeader($header, $name, array(
            'value' => $value,
            'domain' => $domain,
            'path' => '/foo',
            'expires' => $expires
        ));
        $this->assertEquals('foo=bar; domain=foo.com; path=/foo; expires=' . $expiresFormat, $header['Set-Cookie']);
    }

    public function testSetCookieHeaderWithNameAndValueAndDomainAndPathAndExpiresAsInteger()
    {
        $name = 'foo';
        $value = 'bar';
        $domain = 'foo.com';
        $path = '/foo';
        $expires = strtotime('2 days');
        $expiresFormat = gmdate('D, d-M-Y H:i:s e', $expires);
        $header = array();
        \Slim\Http\Util::setCookieHeader($header, $name, array(
            'value' => $value,
            'domain' => $domain,
            'path' => '/foo',
            'expires' => $expires
        ));
        $this->assertEquals('foo=bar; domain=foo.com; path=/foo; expires=' . $expiresFormat, $header['Set-Cookie']);
    }

    public function testSetCookieHeaderWithNameAndValueAndDomainAndPathAndExpiresAsZero()
    {
        $name = 'foo';
        $value = 'bar';
        $domain = 'foo.com';
        $path = '/foo';
        $expires = 0;
        $header = array();
        \Slim\Http\Util::setCookieHeader($header, $name, array(
            'value' => $value,
            'domain' => $domain,
            'path' => '/foo',
            'expires' => $expires
        ));
        $this->assertEquals('foo=bar; domain=foo.com; path=/foo', $header['Set-Cookie']);
    }

    public function testSetCookieHeaderWithNameAndValueAndDomainAndPathAndExpiresAndSecure()
    {
        $name = 'foo';
        $value = 'bar';
        $domain = 'foo.com';
        $path = '/foo';
        $expires = strtotime('2 days');
        $expiresFormat = gmdate('D, d-M-Y H:i:s e', $expires);
        $secure = true;
        $header = array();
        \Slim\Http\Util::setCookieHeader($header, $name, array(
            'value' => $value,
            'domain' => $domain,
            'path' => '/foo',
            'expires' => $expires,
            'secure' => $secure
        ));
        $this->assertEquals('foo=bar; domain=foo.com; path=/foo; expires=' . $expiresFormat . '; secure', $header['Set-Cookie']);
    }

    public function testSetCookieHeaderWithNameAndValueAndDomainAndPathAndExpiresAndSecureAndHttpOnly()
    {
        $name = 'foo';
        $value = 'bar';
        $domain = 'foo.com';
        $path = '/foo';
        $expires = strtotime('2 days');
        $expiresFormat = gmdate('D, d-M-Y H:i:s e', $expires);
        $secure = true;
        $httpOnly = true;
        $header = array();
        \Slim\Http\Util::setCookieHeader($header, $name, array(
            'value' => $value,
            'domain' => $domain,
            'path' => '/foo',
            'expires' => $expires,
            'secure' => $secure,
            'httponly' => $httpOnly
        ));
        $this->assertEquals('foo=bar; domain=foo.com; path=/foo; expires=' . $expiresFormat . '; secure; HttpOnly', $header['Set-Cookie']);
    }

    public function testDeleteCookieHeaderWithSurvivingCookie()
    {
        $header = array('Set-Cookie' => "foo=bar\none=two");
        \Slim\Http\Util::deleteCookieHeader($header, 'foo');
        $this->assertEquals(1, preg_match("@^one=two\nfoo=; expires=@", $header['Set-Cookie']));
    }

    public function testDeleteCookieHeaderWithoutSurvivingCookie()
    {
        $header = array('Set-Cookie' => "foo=bar");
        \Slim\Http\Util::deleteCookieHeader($header, 'foo');
        $this->assertEquals(1, preg_match("@foo=; expires=@", $header['Set-Cookie']));
    }

    public function testDeleteCookieHeaderWithMatchingDomain()
    {
        $header = array('Set-Cookie' => "foo=bar; domain=foo.com");
        \Slim\Http\Util::deleteCookieHeader($header, 'foo', array(
            'domain' => 'foo.com'
        ));
        $this->assertEquals(1, preg_match("@foo=; domain=foo.com; expires=@", $header['Set-Cookie']));
    }

    public function testDeleteCookieHeaderWithoutMatchingDomain()
    {
        $header = array('Set-Cookie' => "foo=bar; domain=foo.com");
        \Slim\Http\Util::deleteCookieHeader($header, 'foo', array(
            'domain' => 'bar.com'
        ));
        $this->assertEquals(1, preg_match("@foo=bar; domain=foo\.com\nfoo=; domain=bar\.com@", $header['Set-Cookie']));
    }

    /**
     * Test parses Cookie: HTTP header
     */
    public function testParsesCookieHeader()
    {
        $header = 'foo=bar; one=two; colors=blue';
        $result = \Slim\Http\Util::parseCookieHeader($header);
        $this->assertEquals(3, count($result));
        $this->assertEquals('bar', $result['foo']);
        $this->assertEquals('two', $result['one']);
        $this->assertEquals('blue', $result['colors']);
    }

    public function testParsesCookieHeaderWithCommaSeparator()
    {
        $header = 'foo=bar, one=two, colors=blue';
        $result = \Slim\Http\Util::parseCookieHeader($header);
        $this->assertEquals(3, count($result));
        $this->assertEquals('bar', $result['foo']);
        $this->assertEquals('two', $result['one']);
        $this->assertEquals('blue', $result['colors']);
    }

    public function testPrefersLeftmostCookieWhenManyCookiesWithSameName()
    {
        $header = 'foo=bar; foo=beer';
        $result = \Slim\Http\Util::parseCookieHeader($header);
        $this->assertEquals('bar', $result['foo']);
    }
}
