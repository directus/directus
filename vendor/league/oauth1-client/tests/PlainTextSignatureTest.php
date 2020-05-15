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

use League\OAuth1\Client\Signature\PlainTextSignature;
use Mockery as m;
use PHPUnit_Framework_TestCase;

class PlainTextSignatureTest extends PHPUnit_Framework_TestCase
{
    /**
     * Close mockery.
     *
     * @return void
     */
    public function tearDown()
    {
        m::close();
    }

    public function testSigningRequest()
    {
        $signature = new PlainTextSignature($this->getMockClientCredentials());
        $this->assertEquals('clientsecret&', $signature->sign($uri = 'http://www.example.com/'));

        $signature->setCredentials($this->getMockCredentials());
        $this->assertEquals('clientsecret&tokensecret', $signature->sign($uri));
        $this->assertEquals('PLAINTEXT', $signature->method());
    }

    protected function getMockClientCredentials()
    {
        $clientCredentials = m::mock('League\OAuth1\Client\Credentials\ClientCredentialsInterface');
        $clientCredentials->shouldReceive('getSecret')->andReturn('clientsecret');
        return $clientCredentials;
    }

    protected function getMockCredentials()
    {
        $credentials = m::mock('League\OAuth1\Client\Credentials\CredentialsInterface');
        $credentials->shouldReceive('getSecret')->andReturn('tokensecret');
        return $credentials;
    }
}
