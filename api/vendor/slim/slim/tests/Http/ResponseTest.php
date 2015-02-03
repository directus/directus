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

class ResponseTest extends PHPUnit_Framework_TestCase
{
    /**
     * Test constructor without args
     */
    public function testConstructorWithoutArgs()
    {
        $r = new \Slim\Http\Response();
        $this->assertEquals('', $r->body());
        $this->assertEquals(200, $r->status());
        $this->assertEquals(0, $r->length());
        $this->assertEquals('text/html', $r['Content-Type']);
    }

    /**
     * Test constructor with args
     */
    public function testConstructorWithArgs()
    {
        $r = new \Slim\Http\Response('Page Not Found', 404, array('Content-Type' => 'application/json', 'X-Created-By' => 'Slim'));
        $this->assertEquals('Page Not Found', $r->body());
        $this->assertEquals(404, $r->status());
        $this->assertEquals(14, $r->length());
        $this->assertEquals('application/json', $r['Content-Type']);
        $this->assertEquals('Slim', $r['X-Created-By']);
    }

    /**
     * Test get status
     */
    public function testGetStatus()
    {
        $r = new \Slim\Http\Response();
        $this->assertEquals(200, $r->status());
    }

    /**
     * Test set status
     */
    public function testSetStatus()
    {
        $r = new \Slim\Http\Response();
        $r->status(500);
        $this->assertEquals(500, $r->status());
    }

    /**
     * Test get headers
     */
    public function testGetHeaders()
    {
        $r = new \Slim\Http\Response();
        $headers = $r->headers();
        $this->assertEquals(1, count($headers));
        $this->assertEquals('text/html', $headers['Content-Type']);
    }

    /**
     * Test get and set header (without Array Access)
     */
    public function testGetAndSetHeader()
    {
        $r = new \Slim\Http\Response();
        $r->header('X-Foo', 'Bar');
        $this->assertEquals('Bar', $r->header('X-Foo'));
    }

    /**
     * Test get body
     */
    public function testGetBody()
    {
        $r = new \Slim\Http\Response('Foo');
        $this->assertEquals('Foo', $r->body());
    }

    /**
     * Test set body
     */
    public function testSetBody()
    {
        $r = new \Slim\Http\Response();
        $r->body('Foo');
        $this->assertEquals('Foo', $r->body());
    }

    /**
     * Test get length
     */
    public function testGetLength()
    {
        $r = new \Slim\Http\Response('Foo');
        $this->assertEquals(3, $r->length());
    }

    /**
     * Test set length
     */
    public function testSetLength()
    {
        $r = new \Slim\Http\Response();
        $r->length(3);
        $this->assertEquals(3, $r->length());
    }

    /**
     * Test write for appending
     */
    public function testWriteAppend()
    {
        $r = new \Slim\Http\Response('Foo');
        $r->write('Bar');
        $this->assertEquals('FooBar', $r->body());
    }

    /**
     * Test write for replacing
     */
    public function testWriteReplace()
    {
        $r = new \Slim\Http\Response('Foo');
        $r->write('Bar', true);
        $this->assertEquals('Bar', $r->body());
    }

    /**
     * Test finalize
     */
    public function testFinalize()
    {
        $r = new \Slim\Http\Response();
        $r->status(404);
        $r['Content-Type'] = 'application/json';
        $r->write('Foo');
        $result = $r->finalize();
        $this->assertEquals(3, count($result));
        $this->assertEquals(404, $result[0]);
        $this->assertFalse(is_null($result[1]['Content-Type']));
    }

    /**
     * Test finalize
     */
    public function testFinalizeWithoutBody()
    {
        $r = new \Slim\Http\Response();
        $r->status(204);
        $r['Content-Type'] = 'application/json';
        $r->write('Foo');
        $result = $r->finalize();
        $this->assertEquals(3, count($result));
        $this->assertEquals('', $result[2]);
    }

    /**
     * Test set cookie with only name and value
     */
    public function testSetCookieWithNameAndValue()
    {
        $r = new \Slim\Http\Response();
        $r->setCookie('foo', 'bar');
        $this->assertEquals('foo=bar', $r['Set-Cookie']);
    }

    /**
     * Test set multiple cookies with only name and value
     */
    public function testSetMultipleCookiesWithNameAndValue()
    {
        $r = new \Slim\Http\Response();
        $r->setCookie('foo', 'bar');
        $r->setCookie('abc', '123');
        $this->assertEquals("foo=bar\nabc=123", $r['Set-Cookie']);
    }

    /**
     * Test set cookie only name and value and expires (as int)
     */
    public function testSetMultipleCookiesWithNameAndValueAndExpiresAsInt()
    {
        $now = time();
        $r = new \Slim\Http\Response();
        $r->setCookie('foo', array(
            'value' => 'bar',
            'expires' => $now
        ));
        $this->assertEquals("foo=bar; expires=" . gmdate('D, d-M-Y H:i:s e', $now), $r['Set-Cookie']);
    }

    /**
     * Test set cookie with only name and value and expires (as string)
     */
    public function testSetMultipleCookiesWithNameAndValueAndExpiresAsString()
    {
        $expires = 'next Tuesday';
        $r = new \Slim\Http\Response();
        $r->setCookie('foo', array(
            'value' => 'bar',
            'expires' => $expires
        ));
        $this->assertEquals("foo=bar; expires=" . gmdate('D, d-M-Y H:i:s e', strtotime($expires)), $r['Set-Cookie']);
    }

    /**
     * Test set cookie with name, value, domain
     */
    public function testSetCookieWithNameAndValueAndDomain()
    {
        $r = new \Slim\Http\Response();
        $r->setCookie('foo', array(
            'value' => 'bar',
            'domain' => '.slimframework.com'
        ));
        $this->assertEquals('foo=bar; domain=.slimframework.com', $r['Set-Cookie']);
    }

    /**
     * Test set cookie with name, value, domain, path
     */
    public function testSetCookieWithNameAndValueAndDomainAndPath()
    {
        $r = new \Slim\Http\Response();
        $r->setCookie('foo', array(
            'value' => 'bar',
            'domain' => '.slimframework.com',
            'path' => '/foo'
        ));
        $this->assertEquals($r['Set-Cookie'], 'foo=bar; domain=.slimframework.com; path=/foo');
    }

    /**
     * Test set cookie with only name and value and secure flag
     */
    public function testSetCookieWithNameAndValueAndSecureFlag()
    {
        $r = new \Slim\Http\Response();
        $r->setCookie('foo', array(
            'value' => 'bar',
            'secure' => true
        ));
        $this->assertEquals('foo=bar; secure', $r['Set-Cookie']);
    }

    /**
     * Test set cookie with only name and value and secure flag (as non-truthy)
     */
    public function testSetCookieWithNameAndValueAndSecureFlagAsNonTruthy()
    {
        $r = new \Slim\Http\Response();
        $r->setCookie('foo', array(
            'value' => 'bar',
            'secure' => 0
        ));
        $this->assertEquals('foo=bar', $r['Set-Cookie']);
    }

    /**
     * Test set cookie with only name and value and httponly flag
     */
    public function testSetCookieWithNameAndValueAndHttpOnlyFlag()
    {
        $r = new \Slim\Http\Response();
        $r->setCookie('foo', array(
            'value' => 'bar',
            'httponly' => true
        ));
        $this->assertEquals('foo=bar; HttpOnly', $r['Set-Cookie']);
    }

    /**
     * Test set cookie with only name and value and httponly flag (as non-truthy)
     */
    public function testSetCookieWithNameAndValueAndHttpOnlyFlagAsNonTruthy()
    {
        $r = new \Slim\Http\Response();
        $r->setCookie('foo', array(
            'value' => 'bar',
            'httponly' => 0
        ));
        $this->assertEquals('foo=bar', $r['Set-Cookie']);
    }

    /*
     * Test delete cookie by name
     */
    public function testDeleteCookieByName()
    {
        $r = new \Slim\Http\Response();
        $r->setCookie('foo', 'bar');
        $r->setCookie('abc', '123');
        $r->deleteCookie('foo');
        $this->assertEquals(1, preg_match("@abc=123\nfoo=; expires=@", $r['Set-Cookie']));
    }

    /*
     * Test delete cookie by name and domain
     */
    public function testDeleteCookieByNameAndDomain1()
    {
        $r = new \Slim\Http\Response();
        $r->setCookie('foo', 'bar'); //Note: This does not have domain associated with it
        $r->setCookie('abc', '123');
        $r->deleteCookie('foo', array('domain' => '.slimframework.com')); //This SHOULD NOT remove the `foo` cookie
        $this->assertEquals(1, preg_match("@foo=bar\nabc=123\nfoo=; domain=.slimframework.com; expires=@", $r['Set-Cookie']));
    }

    /*
     * Test delete cookie by name and domain
     */
    public function testDeleteCookieByNameAndDomain2()
    {
        $r = new \Slim\Http\Response();
        $r->setCookie('foo', array(
            'value' => 'bar',
            'domain' => '.slimframework.com' //Note: This does have domain associated with it
        ));
        $r->setCookie('abc', '123');
        $r->deleteCookie('foo', array('domain' => '.slimframework.com')); //This SHOULD remove the `foo` cookie
        $this->assertEquals(1, preg_match("@abc=123\nfoo=; domain=.slimframework.com; expires=@", $r['Set-Cookie']));
    }

    /**
     * Test delete cookie by name and custom props
     */
    public function testDeleteCookieByNameAndCustomProps()
    {
        $r = new \Slim\Http\Response();
        $r->setCookie('foo', 'bar');
        $r->setCookie('abc', '123');
        $r->deleteCookie('foo', array(
            'secure' => true,
            'httponly' => true
        ));
        $this->assertEquals(1, preg_match("@abc=123\nfoo=; expires=.*; secure; HttpOnly@", $r['Set-Cookie']));
    }

    /**
     * Test redirect
     */
    public function testRedirect()
    {
        $r = new \Slim\Http\Response();
        $r->redirect('/foo');
        $this->assertEquals(302, $r->status());
        $this->assertEquals('/foo', $r['Location']);
    }

    /**
     * Test redirect with custom status
     */
    public function testRedirectWithCustomStatus()
    {
        $r = new \Slim\Http\Response();
        $r->redirect('/foo', 307);
        $this->assertEquals(307, $r->status());
        $this->assertEquals('/foo', $r['Location']);
    }

    /**
     * Test isEmpty
     */
    public function testIsEmpty()
    {
        $r1 = new \Slim\Http\Response();
        $r2 = new \Slim\Http\Response();
        $r1->status(404);
        $r2->status(201);
        $this->assertFalse($r1->isEmpty());
        $this->assertTrue($r2->isEmpty());
    }

    /**
     * Test isClientError
     */
    public function testIsClientError()
    {
        $r1 = new \Slim\Http\Response();
        $r2 = new \Slim\Http\Response();
        $r1->status(404);
        $r2->status(500);
        $this->assertTrue($r1->isClientError());
        $this->assertFalse($r2->isClientError());
    }

    /**
     * Test isForbidden
     */
    public function testIsForbidden()
    {
        $r1 = new \Slim\Http\Response();
        $r2 = new \Slim\Http\Response();
        $r1->status(403);
        $r2->status(500);
        $this->assertTrue($r1->isForbidden());
        $this->assertFalse($r2->isForbidden());
    }

    /**
     * Test isInformational
     */
    public function testIsInformational()
    {
        $r1 = new \Slim\Http\Response();
        $r2 = new \Slim\Http\Response();
        $r1->status(100);
        $r2->status(200);
        $this->assertTrue($r1->isInformational());
        $this->assertFalse($r2->isInformational());
    }

    /**
     * Test isInformational
     */
    public function testIsNotFound()
    {
        $r1 = new \Slim\Http\Response();
        $r2 = new \Slim\Http\Response();
        $r1->status(404);
        $r2->status(200);
        $this->assertTrue($r1->isNotFound());
        $this->assertFalse($r2->isNotFound());
    }

    /**
     * Test isOk
     */
    public function testIsOk()
    {
        $r1 = new \Slim\Http\Response();
        $r2 = new \Slim\Http\Response();
        $r1->status(200);
        $r2->status(201);
        $this->assertTrue($r1->isOk());
        $this->assertFalse($r2->isOk());
    }

    /**
     * Test isSuccessful
     */
    public function testIsSuccessful()
    {
        $r1 = new \Slim\Http\Response();
        $r2 = new \Slim\Http\Response();
        $r3 = new \Slim\Http\Response();
        $r1->status(200);
        $r2->status(201);
        $r3->status(302);
        $this->assertTrue($r1->isSuccessful());
        $this->assertTrue($r2->isSuccessful());
        $this->assertFalse($r3->isSuccessful());
    }

    /**
     * Test isRedirect
     */
    public function testIsRedirect()
    {
        $r1 = new \Slim\Http\Response();
        $r2 = new \Slim\Http\Response();
        $r1->status(307);
        $r2->status(304);
        $this->assertTrue($r1->isRedirect());
        $this->assertFalse($r2->isRedirect());
    }

    /**
     * Test isRedirection
     */
    public function testIsRedirection()
    {
        $r1 = new \Slim\Http\Response();
        $r2 = new \Slim\Http\Response();
        $r3 = new \Slim\Http\Response();
        $r1->status(307);
        $r2->status(304);
        $r3->status(200);
        $this->assertTrue($r1->isRedirection());
        $this->assertTrue($r2->isRedirection());
        $this->assertFalse($r3->isRedirection());
    }

    /**
     * Test isServerError
     */
    public function testIsServerError()
    {
        $r1 = new \Slim\Http\Response();
        $r2 = new \Slim\Http\Response();
        $r1->status(500);
        $r2->status(400);
        $this->assertTrue($r1->isServerError());
        $this->assertFalse($r2->isServerError());
    }

    /**
     * Test offset exists and offset get
     */
    public function testOffsetExistsAndGet()
    {
        $r = new \Slim\Http\Response();
        $this->assertFalse(empty($r['Content-Type']));
        $this->assertNull($r['foo']);
    }

    /**
     * Test iteration
     */
    public function testIteration()
    {
        $h = new \Slim\Http\Response();
        $output = '';
        foreach ($h as $key => $value) {
            $output .= $key . $value;
        }
        $this->assertEquals('Content-Typetext/html', $output);
    }

    /**
     * Test countable
     */
    public function testCountable()
    {
        $r1 = new \Slim\Http\Response();
        $this->assertEquals(1, count($r1)); //Content-Type
    }

    /**
     * Test message for code when message exists
     */
    public function testMessageForCode()
    {
        $this->assertEquals('200 OK', \Slim\Http\Response::getMessageForCode(200));
    }

    /**
     * Test message for code when message exists
     */
    public function testMessageForCodeWithInvalidCode()
    {
        $this->assertNull(\Slim\Http\Response::getMessageForCode(600));
    }
}
