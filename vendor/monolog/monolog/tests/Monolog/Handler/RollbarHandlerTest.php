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

use Exception;
use Monolog\TestCase;
use Monolog\Logger;
use PHPUnit_Framework_MockObject_MockObject as MockObject;

/**
 * @author Erik Johansson <erik.pm.johansson@gmail.com>
 * @see    https://rollbar.com/docs/notifier/rollbar-php/
 *
 * @coversDefaultClass Monolog\Handler\RollbarHandler
 */
class RollbarHandlerTest extends TestCase
{
    /**
     * @var MockObject
     */
    private $rollbarNotifier;

    /**
     * @var array
     */
    public $reportedExceptionArguments = null;

    protected function setUp()
    {
        parent::setUp();

        $this->setupRollbarNotifierMock();
    }

    /**
     * When reporting exceptions to Rollbar the
     * level has to be set in the payload data
     */
    public function testExceptionLogLevel()
    {
        $handler = $this->createHandler();

        $handler->handle($this->createExceptionRecord(Logger::DEBUG));

        $this->assertEquals('debug', $this->reportedExceptionArguments['payload']['level']);
    }

    private function setupRollbarNotifierMock()
    {
        $this->rollbarNotifier = $this->getMockBuilder('RollbarNotifier')
            ->setMethods(array('report_message', 'report_exception', 'flush'))
            ->getMock();

        $that = $this;

        $this->rollbarNotifier
            ->expects($this->any())
            ->method('report_exception')
            ->willReturnCallback(function ($exception, $context, $payload) use ($that) {
                $that->reportedExceptionArguments = compact('exception', 'context', 'payload');
            });
    }

    private function createHandler()
    {
        return new RollbarHandler($this->rollbarNotifier, Logger::DEBUG);
    }

    private function createExceptionRecord($level = Logger::DEBUG, $message = 'test', $exception = null)
    {
        return $this->getRecord($level, $message, array(
            'exception' => $exception ?: new Exception()
        ));
    }
}
