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
use Monolog\Formatter\LineFormatter;
use Monolog\Handler\Slack\SlackRecord;

/**
 * @author Haralan Dobrev <hkdobrev@gmail.com>
 * @see    https://api.slack.com/incoming-webhooks
 * @coversDefaultClass Monolog\Handler\SlackWebhookHandler
 */
class SlackWebhookHandlerTest extends TestCase
{
    const WEBHOOK_URL = 'https://hooks.slack.com/services/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E';

    /**
     * @covers ::__construct
     * @covers ::getSlackRecord
     */
    public function testConstructorMinimal()
    {
        $handler = new SlackWebhookHandler(self::WEBHOOK_URL);
        $record = $this->getRecord();
        $slackRecord = $handler->getSlackRecord();
        $this->assertInstanceOf('Monolog\Handler\Slack\SlackRecord', $slackRecord);
        $this->assertEquals(array(
            'attachments' => array(
                array(
                    'fallback' => 'test',
                    'text' => 'test',
                    'color' => SlackRecord::COLOR_WARNING,
                    'fields' => array(
                        array(
                            'title' => 'Level',
                            'value' => 'WARNING',
                            'short' => false,
                        ),
                    ),
                    'title' => 'Message',
                    'mrkdwn_in' => array('fields'),
                    'ts' => $record['datetime']->getTimestamp(),
                ),
            ),
        ), $slackRecord->getSlackData($record));
    }

    /**
     * @covers ::__construct
     * @covers ::getSlackRecord
     */
    public function testConstructorFull()
    {
        $handler = new SlackWebhookHandler(
            self::WEBHOOK_URL,
            'test-channel',
            'test-username',
            false,
            ':ghost:',
            false,
            false,
            Logger::DEBUG,
            false
        );

        $slackRecord = $handler->getSlackRecord();
        $this->assertInstanceOf('Monolog\Handler\Slack\SlackRecord', $slackRecord);
        $this->assertEquals(array(
            'username' => 'test-username',
            'text' => 'test',
            'channel' => 'test-channel',
            'icon_emoji' => ':ghost:',
        ), $slackRecord->getSlackData($this->getRecord()));
    }

    /**
     * @covers ::getFormatter
     */
    public function testGetFormatter()
    {
        $handler = new SlackWebhookHandler(self::WEBHOOK_URL);
        $formatter = $handler->getFormatter();
        $this->assertInstanceOf('Monolog\Formatter\FormatterInterface', $formatter);
    }

    /**
     * @covers ::setFormatter
     */
    public function testSetFormatter()
    {
        $handler = new SlackWebhookHandler(self::WEBHOOK_URL);
        $formatter = new LineFormatter();
        $handler->setFormatter($formatter);
        $this->assertSame($formatter, $handler->getFormatter());
    }
}
