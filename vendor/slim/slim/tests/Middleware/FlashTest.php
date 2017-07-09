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

class SlimFlashTest extends PHPUnit_Framework_TestCase
{
    /**
     * Setup
     */
    public function setUp()
    {
        $_SESSION = array();
    }

    /**
     * Test set flash message for next request
     */
    public function testSetFlashForNextRequest()
    {
        $f = new \Slim\Middleware\Flash();
        $f->set('foo', 'bar');
        $f->save();
        $this->assertEquals('bar', $_SESSION['slim.flash']['foo']);
    }

    /**
     * Test set flash message for current request
     */
    public function testSetFlashForCurrentRequest()
    {
        $f = new \Slim\Middleware\Flash();
        $f->now('foo', 'bar');
        $this->assertEquals('bar', $f['foo']);
    }

    /**
     * Test loads flash from previous request
     */
    public function testLoadsFlashFromPreviousRequest()
    {
        $_SESSION['slim.flash'] = array('info' => 'foo');
        $f = new \Slim\Middleware\Flash();
        $f->loadMessages();
        $this->assertEquals('foo', $f['info']);
    }

    /**
     * Test keep flash message for next request
     */
    public function testKeepFlashFromPreviousRequest()
    {
        $_SESSION['slim.flash'] = array('info' => 'foo');
        $f = new \Slim\Middleware\Flash();
        $f->loadMessages();
        $f->keep();
        $f->save();
        $this->assertEquals('foo', $_SESSION['slim.flash']['info']);
    }

    /**
     * Test flash messages from previous request do not persist to next request
     */
    public function testFlashMessagesFromPreviousRequestDoNotPersist()
    {
        $_SESSION['slim.flash'] = array('info' => 'foo');
        $f = new \Slim\Middleware\Flash();
        $f->save();
        $this->assertEmpty($_SESSION['slim.flash']);
    }

    /**
     * Test set Flash using array access
     */
    public function testFlashArrayAccess()
    {
        $_SESSION['slim.flash'] = array('info' => 'foo');
        $f = new \Slim\Middleware\Flash();
        $f['info'] = 'bar';
        $f->save();
        $this->assertTrue(isset($f['info']));
        $this->assertEquals('bar', $f['info']);
        unset($f['info']);
        $this->assertFalse(isset($f['info']));
    }

    /**
     * Test iteration
     */
    public function testIteration()
    {
        $_SESSION['slim.flash'] = array('info' => 'foo', 'error' => 'bar');
        $f = new \Slim\Middleware\Flash();
        $f->loadMessages();
        $output = '';
        foreach ($f as $key => $value) {
            $output .= $key . $value;
        }
        $this->assertEquals('infofooerrorbar', $output);
    }

    /**
     * Test countable
     */
    public function testCountable()
    {
        $_SESSION['slim.flash'] = array('info' => 'foo', 'error' => 'bar');
        $f = new \Slim\MiddleWare\Flash();
        $f->loadMessages();
        $this->assertEquals(2, count($f));
    }


}
