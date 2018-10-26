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

use Monolog\Logger;
use Monolog\TestCase;

class SwiftMailerHandlerTest extends TestCase
{
    /** @var \Swift_Mailer|\PHPUnit_Framework_MockObject_MockObject */
    private $mailer;

    public function setUp()
    {
        $this->mailer = $this
            ->getMockBuilder('Swift_Mailer')
            ->disableOriginalConstructor()
            ->getMock();
    }

    public function testMessageCreationIsLazyWhenUsingCallback()
    {
        $this->mailer->expects($this->never())
            ->method('send');

        $callback = function () {
            throw new \RuntimeException('Swift_Message creation callback should not have been called in this test');
        };
        $handler = new SwiftMailerHandler($this->mailer, $callback);

        $records = array(
            $this->getRecord(Logger::DEBUG),
            $this->getRecord(Logger::INFO),
        );
        $handler->handleBatch($records);
    }

    public function testMessageCanBeCustomizedGivenLoggedData()
    {
        // Wire Mailer to expect a specific Swift_Message with a customized Subject
        $expectedMessage = new \Swift_Message();
        $this->mailer->expects($this->once())
            ->method('send')
            ->with($this->callback(function ($value) use ($expectedMessage) {
                return $value instanceof \Swift_Message
                    && $value->getSubject() === 'Emergency'
                    && $value === $expectedMessage;
            }));

        // Callback dynamically changes subject based on number of logged records
        $callback = function ($content, array $records) use ($expectedMessage) {
            $subject = count($records) > 0 ? 'Emergency' : 'Normal';
            $expectedMessage->setSubject($subject);

            return $expectedMessage;
        };
        $handler = new SwiftMailerHandler($this->mailer, $callback);

        // Logging 1 record makes this an Emergency
        $records = array(
            $this->getRecord(Logger::EMERGENCY),
        );
        $handler->handleBatch($records);
    }

    public function testMessageSubjectFormatting()
    {
        // Wire Mailer to expect a specific Swift_Message with a customized Subject
        $messageTemplate = new \Swift_Message();
        $messageTemplate->setSubject('Alert: %level_name% %message%');
        $receivedMessage = null;

        $this->mailer->expects($this->once())
            ->method('send')
            ->with($this->callback(function ($value) use (&$receivedMessage) {
                $receivedMessage = $value;
                return true;
            }));

        $handler = new SwiftMailerHandler($this->mailer, $messageTemplate);

        $records = array(
            $this->getRecord(Logger::EMERGENCY),
        );
        $handler->handleBatch($records);

        $this->assertEquals('Alert: EMERGENCY test', $receivedMessage->getSubject());
    }

    public function testMessageHaveUniqueId()
    {
        $messageTemplate = new \Swift_Message();
        $handler = new SwiftMailerHandler($this->mailer, $messageTemplate);

        $method = new \ReflectionMethod('Monolog\Handler\SwiftMailerHandler', 'buildMessage');
        $method->setAccessible(true);
        $method->invokeArgs($handler, array($messageTemplate, array()));

        $builtMessage1 = $method->invoke($handler, $messageTemplate, array());
        $builtMessage2 = $method->invoke($handler, $messageTemplate, array());

        $this->assertFalse($builtMessage1->getId() === $builtMessage2->getId(), 'Two different messages have the same id');
    }
}
