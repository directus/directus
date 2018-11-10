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
 * @covers Monolog\Handler\TestHandler
 */
class TestHandlerTest extends TestCase
{
    /**
     * @dataProvider methodProvider
     */
    public function testHandler($method, $level)
    {
        $handler = new TestHandler;
        $record = $this->getRecord($level, 'test'.$method);
        $this->assertFalse($handler->hasRecords($level));
        $this->assertFalse($handler->hasRecord($record, $level));
        $this->assertFalse($handler->{'has'.$method}($record), 'has'.$method);
        $this->assertFalse($handler->{'has'.$method.'ThatContains'}('test'), 'has'.$method.'ThatContains');
        $this->assertFalse($handler->{'has'.$method.'ThatPasses'}(function ($rec) {
            return true;
        }), 'has'.$method.'ThatPasses');
        $this->assertFalse($handler->{'has'.$method.'ThatMatches'}('/test\w+/'));
        $this->assertFalse($handler->{'has'.$method.'Records'}(), 'has'.$method.'Records');
        $handler->handle($record);

        $this->assertFalse($handler->{'has'.$method}('bar'), 'has'.$method);
        $this->assertTrue($handler->hasRecords($level));
        $this->assertTrue($handler->hasRecord($record, $level));
        $this->assertTrue($handler->{'has'.$method}($record), 'has'.$method);
        $this->assertTrue($handler->{'has'.$method}('test'.$method), 'has'.$method);
        $this->assertTrue($handler->{'has'.$method.'ThatContains'}('test'), 'has'.$method.'ThatContains');
        $this->assertTrue($handler->{'has'.$method.'ThatPasses'}(function ($rec) {
            return true;
        }), 'has'.$method.'ThatPasses');
        $this->assertTrue($handler->{'has'.$method.'ThatMatches'}('/test\w+/'));
        $this->assertTrue($handler->{'has'.$method.'Records'}(), 'has'.$method.'Records');

        $records = $handler->getRecords();
        unset($records[0]['formatted']);
        $this->assertEquals(array($record), $records);
    }

    public function testHandlerAssertEmptyContext() {
        $handler = new TestHandler;
        $record  = $this->getRecord(Logger::WARNING, 'test', array());
        $this->assertFalse($handler->hasWarning(array(
            'message' => 'test',
            'context' => array(),
        )));

        $handler->handle($record);

        $this->assertTrue($handler->hasWarning(array(
            'message' => 'test',
            'context' => array(),
        )));
        $this->assertFalse($handler->hasWarning(array(
            'message' => 'test',
            'context' => array(
                'foo' => 'bar'
            ),
        )));
    }

    public function testHandlerAssertNonEmptyContext() {
        $handler = new TestHandler;
        $record  = $this->getRecord(Logger::WARNING, 'test', array('foo' => 'bar'));
        $this->assertFalse($handler->hasWarning(array(
            'message' => 'test',
            'context' => array(
                'foo' => 'bar'
            ),
        )));

        $handler->handle($record);

        $this->assertTrue($handler->hasWarning(array(
            'message' => 'test',
            'context' => array(
                'foo' => 'bar'
            ),
        )));
        $this->assertFalse($handler->hasWarning(array(
            'message' => 'test',
            'context' => array(),
        )));
    }

    public function methodProvider()
    {
        return array(
            array('Emergency', Logger::EMERGENCY),
            array('Alert'    , Logger::ALERT),
            array('Critical' , Logger::CRITICAL),
            array('Error'    , Logger::ERROR),
            array('Warning'  , Logger::WARNING),
            array('Info'     , Logger::INFO),
            array('Notice'   , Logger::NOTICE),
            array('Debug'    , Logger::DEBUG),
        );
    }
}
