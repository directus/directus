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

class ResponseTest extends PHPUnit_Framework_TestCase
{
    public function testConstructWithoutArgs()
    {
        $res = new \Slim\Http\Response();

        $this->assertAttributeEquals(200, 'status', $res);
        $this->assertAttributeEquals('', 'body', $res);
    }

    public function testConstructWithArgs()
    {
        $res = new \Slim\Http\Response('Foo', 201);

        $this->assertAttributeEquals(201, 'status', $res);
        $this->assertAttributeEquals('Foo', 'body', $res);
    }

    public function testGetStatus()
    {
        $res = new \Slim\Http\Response();

        $this->assertEquals(200, $res->getStatus());
    }

    public function testSetStatus()
    {
        $res = new \Slim\Http\Response();
        $res->setStatus(301);

        $this->assertAttributeEquals(301, 'status', $res);
    }

    /**
     * DEPRECATION WARNING!
     */
    public function testStatusGetOld()
    {
        $res = new \Slim\Http\Response('', 201);
        $this->assertEquals(201, $res->status());
    }

    /**
     * DEPRECATION WARNING!
     */
    public function testStatusSetOld()
    {
        $res = new \Slim\Http\Response();
        $prop = new \ReflectionProperty($res, 'status');
        $prop->setAccessible(true);
        $res->status(301);

        $this->assertEquals(301, $prop->getValue($res));
    }

    public function testGetBody()
    {
        $res = new \Slim\Http\Response();
        $property = new \ReflectionProperty($res, 'body');
        $property->setAccessible(true);
        $property->setValue($res, 'foo');

        $this->assertEquals('foo', $res->getBody());
    }

    public function testSetBody()
    {
        $res = new \Slim\Http\Response('bar');
        $res->setBody('foo'); // <-- Should replace body

        $this->assertAttributeEquals('foo', 'body', $res);
    }

    public function testWrite()
    {
        $res = new \Slim\Http\Response();
        $property = new \ReflectionProperty($res, 'body');
        $property->setAccessible(true);
        $property->setValue($res, 'foo');
        $res->write('bar'); // <-- Should append to body

        $this->assertAttributeEquals('foobar', 'body', $res);
    }

    public function testLength()
    {
        $res = new \Slim\Http\Response('foo'); // <-- Sets body and length

        $this->assertEquals(3, $res->getLength());
    }

    public function testFinalize()
    {
        $res = new \Slim\Http\Response();
        $resFinal = $res->finalize();

        $this->assertTrue(is_array($resFinal));
        $this->assertEquals(3, count($resFinal));
        $this->assertEquals(200, $resFinal[0]);
        $this->assertInstanceOf('\Slim\Http\Headers', $resFinal[1]);
        $this->assertEquals('', $resFinal[2]);
    }

    public function testFinalizeWithEmptyBody()
    {
        $res = new \Slim\Http\Response('Foo', 304);
        $resFinal = $res->finalize();

        $this->assertEquals('', $resFinal[2]);
    }

    public function testRedirect()
    {
        $res = new \Slim\Http\Response();
        $res->redirect('/foo');

        $pStatus = new \ReflectionProperty($res, 'status');
        $pStatus->setAccessible(true);

        $this->assertEquals(302, $pStatus->getValue($res));
        $this->assertEquals('/foo', $res->headers['Location']);
    }

    public function testIsEmpty()
    {
        $r1 = new \Slim\Http\Response();
        $r2 = new \Slim\Http\Response();
        $r1->setStatus(404);
        $r2->setStatus(201);
        $this->assertFalse($r1->isEmpty());
        $this->assertTrue($r2->isEmpty());
    }

    public function testIsClientError()
    {
        $r1 = new \Slim\Http\Response();
        $r2 = new \Slim\Http\Response();
        $r1->setStatus(404);
        $r2->setStatus(500);
        $this->assertTrue($r1->isClientError());
        $this->assertFalse($r2->isClientError());
    }

    public function testIsForbidden()
    {
        $r1 = new \Slim\Http\Response();
        $r2 = new \Slim\Http\Response();
        $r1->setStatus(403);
        $r2->setStatus(500);
        $this->assertTrue($r1->isForbidden());
        $this->assertFalse($r2->isForbidden());
    }

    public function testIsInformational()
    {
        $r1 = new \Slim\Http\Response();
        $r2 = new \Slim\Http\Response();
        $r1->setStatus(100);
        $r2->setStatus(200);
        $this->assertTrue($r1->isInformational());
        $this->assertFalse($r2->isInformational());
    }

    public function testIsNotFound()
    {
        $r1 = new \Slim\Http\Response();
        $r2 = new \Slim\Http\Response();
        $r1->setStatus(404);
        $r2->setStatus(200);
        $this->assertTrue($r1->isNotFound());
        $this->assertFalse($r2->isNotFound());
    }

    public function testIsOk()
    {
        $r1 = new \Slim\Http\Response();
        $r2 = new \Slim\Http\Response();
        $r1->setStatus(200);
        $r2->setStatus(201);
        $this->assertTrue($r1->isOk());
        $this->assertFalse($r2->isOk());
    }

    public function testIsSuccessful()
    {
        $r1 = new \Slim\Http\Response();
        $r2 = new \Slim\Http\Response();
        $r3 = new \Slim\Http\Response();
        $r1->setStatus(200);
        $r2->setStatus(201);
        $r3->setStatus(302);
        $this->assertTrue($r1->isSuccessful());
        $this->assertTrue($r2->isSuccessful());
        $this->assertFalse($r3->isSuccessful());
    }

    public function testIsRedirect()
    {
        $r1 = new \Slim\Http\Response();
        $r2 = new \Slim\Http\Response();
        $r1->setStatus(307);
        $r2->setStatus(304);
        $this->assertTrue($r1->isRedirect());
        $this->assertFalse($r2->isRedirect());
    }

    public function testIsRedirection()
    {
        $r1 = new \Slim\Http\Response();
        $r2 = new \Slim\Http\Response();
        $r3 = new \Slim\Http\Response();
        $r1->setStatus(307);
        $r2->setStatus(304);
        $r3->setStatus(200);
        $this->assertTrue($r1->isRedirection());
        $this->assertTrue($r2->isRedirection());
        $this->assertFalse($r3->isRedirection());
    }

    public function testIsServerError()
    {
        $r1 = new \Slim\Http\Response();
        $r2 = new \Slim\Http\Response();
        $r1->setStatus(500);
        $r2->setStatus(400);
        $this->assertTrue($r1->isServerError());
        $this->assertFalse($r2->isServerError());
    }

    public function testMessageForCode()
    {
        $this->assertEquals('200 OK', \Slim\Http\Response::getMessageForCode(200));
    }

    public function testMessageForCodeWithInvalidCode()
    {
        $this->assertNull(\Slim\Http\Response::getMessageForCode(600));
    }
}
