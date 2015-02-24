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

class HeadersTest extends PHPUnit_Framework_TestCase
{
    /**
     * Test constructor without args
     */
    public function testConstructorWithoutArgs()
    {
        $h = new \Slim\Http\Headers();
        $this->assertEquals(0, count($h));
    }

    /**
     * Test constructor with args
     */
    public function testConstructorWithArgs()
    {
        $h = new \Slim\Http\Headers(array('Content-Type' => 'text/html'));
        $this->assertEquals(1, count($h));
    }

    /**
     * Test get and set header
     */
    public function testSetAndGetHeader()
    {
        $h = new \Slim\Http\Headers();
        $h['Content-Type'] = 'text/html';
        $this->assertEquals('text/html', $h['Content-Type']);
        $this->assertEquals('text/html', $h['Content-type']);
        $this->assertEquals('text/html', $h['content-type']);
    }

    /**
     * Test get non-existent header
     */
    public function testGetNonExistentHeader()
    {
        $h = new \Slim\Http\Headers();
        $this->assertNull($h['foo']);
    }

    /**
     * Test isset header
     */
    public function testHeaderIsSet()
    {
        $h = new \Slim\Http\Headers();
        $h['Content-Type'] = 'text/html';
        $this->assertTrue(isset($h['Content-Type']));
        $this->assertTrue(isset($h['Content-type']));
        $this->assertTrue(isset($h['content-type']));
        $this->assertFalse(isset($h['foo']));
    }

    /**
     * Test unset header
     */
    public function testUnsetHeader()
    {
        $h = new \Slim\Http\Headers();
        $h['Content-Type'] = 'text/html';
        $this->assertEquals(1, count($h));
        unset($h['Content-Type']);
        $this->assertEquals(0, count($h));
    }

    /**
     * Test merge headers
     */
    public function testMergeHeaders()
    {
        $h = new \Slim\Http\Headers();
        $h['Content-Type'] = 'text/html';
        $this->assertEquals(1, count($h));
        $h->merge(array('Content-type' => 'text/csv', 'content-length' => 10));
        $this->assertEquals(2, count($h));
        $this->assertEquals('text/csv', $h['content-type']);
        $this->assertEquals(10, $h['Content-length']);
    }

    /**
     * Test iteration
     */
    public function testIteration()
    {
        $h = new \Slim\Http\Headers();
        $h['One'] = 'Foo';
        $h['Two'] = 'Bar';
        $output = '';
        foreach ($h as $key => $value) {
            $output .= $key . $value;
        }
        $this->assertEquals('OneFooTwoBar', $output);
    }

    /**
     * Test outputs header name in original form, not canonical form
     */
    public function testOutputsOriginalNotCanonicalName()
    {
        $h = new \Slim\Http\Headers();
        $h['X-Powered-By'] = 'Slim';
        $h['Content-Type'] = 'text/csv';
        $keys = array();
        foreach ($h as $name => $value) {
            $keys[] = $name;
        }
        $this->assertContains('X-Powered-By', $keys);
        $this->assertContains('Content-Type', $keys);
    }
}
