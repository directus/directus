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

class My_Middleware extends \Slim\Middleware
{
    public function call()
    {
        echo "Before";
        $this->next->call();
        echo "After";
    }
}

class My_Application
{
    public function call()
    {
        echo "Application";
    }
}

class MiddlewareTest extends PHPUnit_Framework_TestCase
{
    /**
     * Get and set application
     */
    public function testGetAndSetApplication()
    {
        $app = new My_Application();
        $mw = new My_Middleware();
        $mw->setApplication($app);
        $this->assertSame($app, $mw->getApplication());
    }

    /**
     * Get and set next middleware
     */
    public function testGetAndSetNextMiddleware()
    {
        $mw1 = new My_Middleware();
        $mw2 = new My_Middleware();
        $mw1->setNextMiddleware($mw2);
        $this->assertSame($mw2, $mw1->getNextMiddleware());
    }

    /**
     * Test call
     */
    public function testCall()
    {
        $this->expectOutputString('BeforeApplicationAfter');
        $app = new My_Application();
        $mw = new My_Middleware();
        $mw->setNextMiddleware($app);
        $mw->call();
    }
}
