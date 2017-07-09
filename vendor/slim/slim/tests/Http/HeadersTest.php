<?php
/**
 * Slim - a micro PHP 5 framework
 *
 * @author      Josh Lockhart <info@slimframework.com>
 * @copyright   2011 Josh Lockhart
 * @link        http://www.slimframework.com
 * @license     http://www.slimframework.com/license
 * @version     2.6.1
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

class HeadersTest extends PHPUnit_Framework_TestCase
{
    public function testNormalizesKey()
    {
        $h = new \Slim\Http\Headers();
        $h->set('Http_Content_Type', 'text/html');
        $prop = new \ReflectionProperty($h, 'data');
        $prop->setAccessible(true);
        $this->assertArrayHasKey('Content-Type', $prop->getValue($h));
    }

    public function testExtractHeaders()
    {
        $test = array(
            'HTTP_HOST' => 'foo.com',
            'SERVER_NAME' => 'foo',
            'CONTENT_TYPE' => 'text/html',
            'X_FORWARDED_FOR' => '127.0.0.1'
        );
        $results = \Slim\Http\Headers::extract($test);
        $this->assertEquals(array(
            'HTTP_HOST' => 'foo.com',
            'CONTENT_TYPE' => 'text/html',
            'X_FORWARDED_FOR' => '127.0.0.1'
        ), $results);
    }
}
