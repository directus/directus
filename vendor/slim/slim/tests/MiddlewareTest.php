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

class MyMiddleware extends \Slim\Middleware
{
    public function call() {}
}

class MiddlewareTest extends PHPUnit_Framework_TestCase
{
    public function testSetApplication()
    {
        $app = new stdClass();
        $mw = new MyMiddleware();
        $mw->setApplication($app);

        $this->assertAttributeSame($app, 'app', $mw);
    }

    public function testGetApplication()
    {
        $app = new stdClass();
        $mw = new MyMiddleware();
        $property = new \ReflectionProperty($mw, 'app');
        $property->setAccessible(true);
        $property->setValue($mw, $app);

        $this->assertSame($app, $mw->getApplication());
    }

    public function testSetNextMiddleware()
    {
        $mw1 = new MyMiddleware();
        $mw2 = new MyMiddleware();
        $mw1->setNextMiddleware($mw2);

        $this->assertAttributeSame($mw2, 'next', $mw1);
    }

    public function testGetNextMiddleware()
    {
        $mw1 = new MyMiddleware();
        $mw2 = new MyMiddleware();
        $property = new \ReflectionProperty($mw1, 'next');
        $property->setAccessible(true);
        $property->setValue($mw1, $mw2);

        $this->assertSame($mw2, $mw1->getNextMiddleware());
    }
}
