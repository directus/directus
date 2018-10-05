<?php namespace League\OAuth1\Client\Tests;
/**
 * Part of the Sentry package.
 *
 * NOTICE OF LICENSE
 *
 * Licensed under the 3-clause BSD License.
 *
 * This source file is subject to the 3-clause BSD License that is
 * bundled with this package in the LICENSE file.  It is also available at
 * the following URL: http://www.opensource.org/licenses/BSD-3-Clause
 *
 * @package    Sentry
 * @version    2.0.0
 * @author     Cartalyst LLC
 * @license    BSD License (3-clause)
 * @copyright  (c) 2011 - 2013, Cartalyst LLC
 * @link       http://cartalyst.com
 */

use League\OAuth1\Client\Credentials\ClientCredentials;
use Mockery as m;
use PHPUnit_Framework_TestCase;

class ServerTest extends PHPUnit_Framework_TestCase
{
    /**
     * Setup resources and dependencies.
     *
     * @return void
     */
    public static function setUpBeforeClass()
    {
        require_once __DIR__.'/stubs/ServerStub.php';
    }

    /**
     * Close mockery.
     *
     * @return void
     */
    public function tearDown()
    {
        m::close();
    }

    public function testCreatingWithArray()
    {
        $server = new ServerStub($this->getMockClientCredentials());

        $credentials = $server->getClientCredentials();
        $this->assertInstanceOf('League\OAuth1\Client\Credentials\ClientCredentialsInterface', $credentials);
        $this->assertEquals('myidentifier', $credentials->getIdentifier());
        $this->assertEquals('mysecret', $credentials->getSecret());
        $this->assertEquals('http://app.dev/', $credentials->getCallbackUri());
    }

    public function testCreatingWithObject()
    {
        $credentials = new ClientCredentials;
        $credentials->setIdentifier('myidentifier');
        $credentials->setSecret('mysecret');
        $credentials->setCallbackUri('http://app.dev/');

        $server = new ServerStub($credentials);

        $this->assertEquals($credentials, $server->getClientCredentials());
    }

    /**
     * @expectedException InvalidArgumentException
     **/
    public function testCreatingWithInvalidInput()
    {
        $server = new ServerStub(uniqid());
    }

    public function testGettingTemporaryCredentials()
    {
        $server = m::mock('League\OAuth1\Client\Tests\ServerStub[createHttpClient]', array($this->getMockClientCredentials()));

        $server->shouldReceive('createHttpClient')->andReturn($client = m::mock('stdClass'));

        $me = $this;
        $client->shouldReceive('post')->with('http://www.example.com/temporary', m::on(function($options) use ($me) {
            $headers = $options['headers'];

            $me->assertTrue(isset($headers['Authorization']));

            // OAuth protocol specifies a strict number of
            // headers should be sent, in the correct order.
            // We'll validate that here.
            $pattern = '/OAuth oauth_consumer_key=".*?", oauth_nonce="[a-zA-Z0-9]+", oauth_signature_method="HMAC-SHA1", oauth_timestamp="\d{10}", oauth_version="1.0", oauth_callback="'.preg_quote('http%3A%2F%2Fapp.dev%2F', '/').'", oauth_signature=".*?"/';

            $matches = preg_match($pattern, $headers['Authorization']);
            $me->assertEquals(1, $matches, 'Asserting that the authorization header contains the correct expression.');

            return true;
        }))->once()->andReturn($response = m::mock('stdClass'));
        $response->shouldReceive('getBody')->andReturn('oauth_token=temporarycredentialsidentifier&oauth_token_secret=temporarycredentialssecret&oauth_callback_confirmed=true');

        $credentials = $server->getTemporaryCredentials();
        $this->assertInstanceOf('League\OAuth1\Client\Credentials\TemporaryCredentials', $credentials);
        $this->assertEquals('temporarycredentialsidentifier', $credentials->getIdentifier());
        $this->assertEquals('temporarycredentialssecret', $credentials->getSecret());
    }

    public function testGettingAuthorizationUrl()
    {
        $server = new ServerStub($this->getMockClientCredentials());

        $expected = 'http://www.example.com/authorize?oauth_token=foo';

        $this->assertEquals($expected, $server->getAuthorizationUrl('foo'));

        $credentials = m::mock('League\OAuth1\Client\Credentials\TemporaryCredentials');
        $credentials->shouldReceive('getIdentifier')->andReturn('foo');
        $this->assertEquals($expected, $server->getAuthorizationUrl($credentials));
    }

    /**
     * @expectedException InvalidArgumentException
     */
    public function testGettingTokenCredentialsFailsWithManInTheMiddle()
    {
        $server = new ServerStub($this->getMockClientCredentials());

        $credentials = m::mock('League\OAuth1\Client\Credentials\TemporaryCredentials');
        $credentials->shouldReceive('getIdentifier')->andReturn('foo');

        $server->getTokenCredentials($credentials, 'bar', 'verifier');
    }

    public function testGettingTokenCredentials()
    {
        $server = m::mock('League\OAuth1\Client\Tests\ServerStub[createHttpClient]', array($this->getMockClientCredentials()));

        $temporaryCredentials = m::mock('League\OAuth1\Client\Credentials\TemporaryCredentials');
        $temporaryCredentials->shouldReceive('getIdentifier')->andReturn('temporarycredentialsidentifier');
        $temporaryCredentials->shouldReceive('getSecret')->andReturn('temporarycredentialssecret');

        $server->shouldReceive('createHttpClient')->andReturn($client = m::mock('stdClass'));

        $me = $this;
        $client->shouldReceive('post')->with('http://www.example.com/token', m::on(function($options) use ($me) {
            $headers = $options['headers'];
            $body = $options['form_params'];

            $me->assertTrue(isset($headers['Authorization']));
            $me->assertFalse(isset($headers['User-Agent']));

            // OAuth protocol specifies a strict number of
            // headers should be sent, in the correct order.
            // We'll validate that here.
            $pattern = '/OAuth oauth_consumer_key=".*?", oauth_nonce="[a-zA-Z0-9]+", oauth_signature_method="HMAC-SHA1", oauth_timestamp="\d{10}", oauth_version="1.0", oauth_token="temporarycredentialsidentifier", oauth_signature=".*?"/';

            $matches = preg_match($pattern, $headers['Authorization']);
            $me->assertEquals(1, $matches, 'Asserting that the authorization header contains the correct expression.');

            $me->assertSame($body, array('oauth_verifier' => 'myverifiercode'));

            return true;
        }))->once()->andReturn($response = m::mock('stdClass'));
        $response->shouldReceive('getBody')->andReturn('oauth_token=tokencredentialsidentifier&oauth_token_secret=tokencredentialssecret');

        $credentials = $server->getTokenCredentials($temporaryCredentials, 'temporarycredentialsidentifier', 'myverifiercode');
        $this->assertInstanceOf('League\OAuth1\Client\Credentials\TokenCredentials', $credentials);
        $this->assertEquals('tokencredentialsidentifier', $credentials->getIdentifier());
        $this->assertEquals('tokencredentialssecret', $credentials->getSecret());
    }

    public function testGettingTokenCredentialsWithUserAgent()
    {
        $userAgent = 'FooBar';
        $server = m::mock('League\OAuth1\Client\Tests\ServerStub[createHttpClient]', array($this->getMockClientCredentials()));

        $temporaryCredentials = m::mock('League\OAuth1\Client\Credentials\TemporaryCredentials');
        $temporaryCredentials->shouldReceive('getIdentifier')->andReturn('temporarycredentialsidentifier');
        $temporaryCredentials->shouldReceive('getSecret')->andReturn('temporarycredentialssecret');

        $server->shouldReceive('createHttpClient')->andReturn($client = m::mock('stdClass'));

        $me = $this;
        $client->shouldReceive('post')->with('http://www.example.com/token', m::on(function($options) use ($me, $userAgent) {
            $headers = $options['headers'];
            $body = $options['form_params'];

            $me->assertTrue(isset($headers['Authorization']));
            $me->assertTrue(isset($headers['User-Agent']));
            $me->assertEquals($userAgent, $headers['User-Agent']);

            // OAuth protocol specifies a strict number of
            // headers should be sent, in the correct order.
            // We'll validate that here.
            $pattern = '/OAuth oauth_consumer_key=".*?", oauth_nonce="[a-zA-Z0-9]+", oauth_signature_method="HMAC-SHA1", oauth_timestamp="\d{10}", oauth_version="1.0", oauth_token="temporarycredentialsidentifier", oauth_signature=".*?"/';

            $matches = preg_match($pattern, $headers['Authorization']);
            $me->assertEquals(1, $matches, 'Asserting that the authorization header contains the correct expression.');

            $me->assertSame($body, array('oauth_verifier' => 'myverifiercode'));

            return true;
        }))->once()->andReturn($response = m::mock('stdClass'));
        $response->shouldReceive('getBody')->andReturn('oauth_token=tokencredentialsidentifier&oauth_token_secret=tokencredentialssecret');

        $credentials = $server->setUserAgent($userAgent)->getTokenCredentials($temporaryCredentials, 'temporarycredentialsidentifier', 'myverifiercode');
        $this->assertInstanceOf('League\OAuth1\Client\Credentials\TokenCredentials', $credentials);
        $this->assertEquals('tokencredentialsidentifier', $credentials->getIdentifier());
        $this->assertEquals('tokencredentialssecret', $credentials->getSecret());

    }

    public function testGettingUserDetails()
    {
        $server = m::mock('League\OAuth1\Client\Tests\ServerStub[createHttpClient,protocolHeader]', array($this->getMockClientCredentials()));

        $temporaryCredentials = m::mock('League\OAuth1\Client\Credentials\TokenCredentials');
        $temporaryCredentials->shouldReceive('getIdentifier')->andReturn('tokencredentialsidentifier');
        $temporaryCredentials->shouldReceive('getSecret')->andReturn('tokencredentialssecret');

        $server->shouldReceive('createHttpClient')->andReturn($client = m::mock('stdClass'));

        $me = $this;
        $client->shouldReceive('get')->with('http://www.example.com/user', m::on(function($options) use ($me) {
            $headers = $options['headers'];

            $me->assertTrue(isset($headers['Authorization']));

            // OAuth protocol specifies a strict number of
            // headers should be sent, in the correct order.
            // We'll validate that here.
            $pattern = '/OAuth oauth_consumer_key=".*?", oauth_nonce="[a-zA-Z0-9]+", oauth_signature_method="HMAC-SHA1", oauth_timestamp="\d{10}", oauth_version="1.0", oauth_token="tokencredentialsidentifier", oauth_signature=".*?"/';

            $matches = preg_match($pattern, $headers['Authorization']);
            $me->assertEquals(1, $matches, 'Asserting that the authorization header contains the correct expression.');

            return true;
        }))->once()->andReturn($response = m::mock('stdClass'));
        $response->shouldReceive('getBody')->once()->andReturn(json_encode(array('foo' => 'bar', 'id' => 123, 'contact_email' => 'baz@qux.com', 'username' => 'fred')));

        $user = $server->getUserDetails($temporaryCredentials);
        $this->assertInstanceOf('League\OAuth1\Client\Server\User', $user);
        $this->assertEquals('bar', $user->firstName);
        $this->assertEquals(123, $server->getUserUid($temporaryCredentials));
        $this->assertEquals('baz@qux.com', $server->getUserEmail($temporaryCredentials));
        $this->assertEquals('fred', $server->getUserScreenName($temporaryCredentials));
    }

    public function testGettingHeaders()
    {
        $server = new ServerStub($this->getMockClientCredentials());

        $tokenCredentials = m::mock('League\OAuth1\Client\Credentials\TokenCredentials');
        $tokenCredentials->shouldReceive('getIdentifier')->andReturn('mock_identifier');
        $tokenCredentials->shouldReceive('getSecret')->andReturn('mock_secret');

        // OAuth protocol specifies a strict number of
        // headers should be sent, in the correct order.
        // We'll validate that here.
        $pattern = '/OAuth oauth_consumer_key=".*?", oauth_nonce="[a-zA-Z0-9]+", oauth_signature_method="HMAC-SHA1", oauth_timestamp="\d{10}", oauth_version="1.0", oauth_token="mock_identifier", oauth_signature=".*?"/';

        // With a GET request
        $headers = $server->getHeaders($tokenCredentials, 'GET', 'http://example.com/');
        $this->assertTrue(isset($headers['Authorization']));

        $matches = preg_match($pattern, $headers['Authorization']);
        $this->assertEquals(1, $matches, 'Asserting that the authorization header contains the correct expression.');

        // With a POST request
        $headers = $server->getHeaders($tokenCredentials, 'POST', 'http://example.com/', array('body' => 'params'));
        $this->assertTrue(isset($headers['Authorization']));

        $matches = preg_match($pattern, $headers['Authorization']);
        $this->assertEquals(1, $matches, 'Asserting that the authorization header contains the correct expression.');
    }

    protected function getMockClientCredentials()
    {
        return array(
            'identifier' => 'myidentifier',
            'secret' => 'mysecret',
            'callback_uri' => 'http://app.dev/',
        );
    }
}
