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

class ClientCredentialsTest extends PHPUnit_Framework_TestCase
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

    public function testManipulating()
    {
        $credentials = new ClientCredentials;
        $this->assertNull($credentials->getIdentifier());
        $credentials->setIdentifier('foo');
        $this->assertEquals('foo', $credentials->getIdentifier());
        $this->assertNull($credentials->getSecret());
        $credentials->setSecret('foo');
        $this->assertEquals('foo', $credentials->getSecret());
    }
}