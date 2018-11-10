<?php

/*
 * This file is part of the Monolog package.
 *
 * (c) Jordi Boggiano <j.boggiano@seld.be>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Monolog\Handler;

use Monolog\TestCase;
use Monolog\Logger;

/**
 * @covers Monolog\Handler\ChromePHPHandler
 */
class ChromePHPHandlerTest extends TestCase
{
    protected function setUp()
    {
        TestChromePHPHandler::resetStatic();
        $_SERVER['HTTP_USER_AGENT'] = 'Monolog Test; Chrome/1.0';
    }

    /**
     * @dataProvider agentsProvider
     */
    public function testHeaders($agent)
    {
        $_SERVER['HTTP_USER_AGENT'] = $agent;

        $handler = new TestChromePHPHandler();
        $handler->setFormatter($this->getIdentityFormatter());
        $handler->handle($this->getRecord(Logger::DEBUG));
        $handler->handle($this->getRecord(Logger::WARNING));

        $expected = array(
            'X-ChromeLogger-Data'   => base64_encode(utf8_encode(json_encode(array(
                'version' => ChromePHPHandler::VERSION,
                'columns' => array('label', 'log', 'backtrace', 'type'),
                'rows' => array(
                    'test',
                    'test',
                ),
                'request_uri' => '',
            )))),
        );

        $this->assertEquals($expected, $handler->getHeaders());
    }

    public static function agentsProvider()
    {
        return array(
            array('Monolog Test; Chrome/1.0'),
            array('Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:52.0) Gecko/20100101 Firefox/52.0'),
            array('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Ubuntu Chromium/56.0.2924.76 Chrome/56.0.2924.76 Safari/537.36'),
            array('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome Safari/537.36'),
        );
    }

    public function testHeadersOverflow()
    {
        $handler = new TestChromePHPHandler();
        $handler->handle($this->getRecord(Logger::DEBUG));
        $handler->handle($this->getRecord(Logger::WARNING, str_repeat('a', 150 * 1024)));

        // overflow chrome headers limit
        $handler->handle($this->getRecord(Logger::WARNING, str_repeat('a', 100 * 1024)));

        $expected = array(
            'X-ChromeLogger-Data'   => base64_encode(utf8_encode(json_encode(array(
                'version' => ChromePHPHandler::VERSION,
                'columns' => array('label', 'log', 'backtrace', 'type'),
                'rows' => array(
                    array(
                        'test',
                        'test',
                        'unknown',
                        'log',
                    ),
                    array(
                        'test',
                        str_repeat('a', 150 * 1024),
                        'unknown',
                        'warn',
                    ),
                    array(
                        'monolog',
                        'Incomplete logs, chrome header size limit reached',
                        'unknown',
                        'warn',
                    ),
                ),
                'request_uri' => '',
            )))),
        );

        $this->assertEquals($expected, $handler->getHeaders());
    }

    public function testConcurrentHandlers()
    {
        $handler = new TestChromePHPHandler();
        $handler->setFormatter($this->getIdentityFormatter());
        $handler->handle($this->getRecord(Logger::DEBUG));
        $handler->handle($this->getRecord(Logger::WARNING));

        $handler2 = new TestChromePHPHandler();
        $handler2->setFormatter($this->getIdentityFormatter());
        $handler2->handle($this->getRecord(Logger::DEBUG));
        $handler2->handle($this->getRecord(Logger::WARNING));

        $expected = array(
            'X-ChromeLogger-Data'   => base64_encode(utf8_encode(json_encode(array(
                'version' => ChromePHPHandler::VERSION,
                'columns' => array('label', 'log', 'backtrace', 'type'),
                'rows' => array(
                    'test',
                    'test',
                    'test',
                    'test',
                ),
                'request_uri' => '',
            )))),
        );

        $this->assertEquals($expected, $handler2->getHeaders());
    }
}

class TestChromePHPHandler extends ChromePHPHandler
{
    protected $headers = array();

    public static function resetStatic()
    {
        self::$initialized = false;
        self::$overflowed = false;
        self::$sendHeaders = true;
        self::$json['rows'] = array();
    }

    protected function sendHeader($header, $content)
    {
        $this->headers[$header] = $content;
    }

    public function getHeaders()
    {
        return $this->headers;
    }
}
