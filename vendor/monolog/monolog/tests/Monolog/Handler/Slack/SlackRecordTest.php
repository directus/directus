<?php

/*
 * This file is part of the Monolog package.
 *
 * (c) Jordi Boggiano <j.boggiano@seld.be>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Monolog\Handler\Slack;

use Monolog\Logger;
use Monolog\TestCase;

/**
 * @coversDefaultClass Monolog\Handler\Slack\SlackRecord
 */
class SlackRecordTest extends TestCase
{
    private $jsonPrettyPrintFlag;

    protected function setUp()
    {
        $this->jsonPrettyPrintFlag = defined('JSON_PRETTY_PRINT') ? JSON_PRETTY_PRINT : 128;
    }

    public function dataGetAttachmentColor()
    {
        return array(
            array(Logger::DEBUG, SlackRecord::COLOR_DEFAULT),
            array(Logger::INFO, SlackRecord::COLOR_GOOD),
            array(Logger::NOTICE, SlackRecord::COLOR_GOOD),
            array(Logger::WARNING, SlackRecord::COLOR_WARNING),
            array(Logger::ERROR, SlackRecord::COLOR_DANGER),
            array(Logger::CRITICAL, SlackRecord::COLOR_DANGER),
            array(Logger::ALERT, SlackRecord::COLOR_DANGER),
            array(Logger::EMERGENCY, SlackRecord::COLOR_DANGER),
        );
    }

    /**
     * @dataProvider dataGetAttachmentColor
     * @param  int $logLevel
     * @param  string $expectedColour RGB hex color or name of Slack color
     * @covers ::getAttachmentColor
     */
    public function testGetAttachmentColor($logLevel, $expectedColour)
    {
        $slackRecord = new SlackRecord();
        $this->assertSame(
            $expectedColour,
            $slackRecord->getAttachmentColor($logLevel)
        );
    }

    public function testAddsChannel()
    {
        $channel = '#test';
        $record = new SlackRecord($channel);
        $data = $record->getSlackData($this->getRecord());

        $this->assertArrayHasKey('channel', $data);
        $this->assertSame($channel, $data['channel']);
    }

    public function testNoUsernameByDefault()
    {
        $record = new SlackRecord();
        $data = $record->getSlackData($this->getRecord());

        $this->assertArrayNotHasKey('username', $data);
    }

    /**
     * @return array
     */
    public function dataStringify()
    {
        $jsonPrettyPrintFlag = defined('JSON_PRETTY_PRINT') ? JSON_PRETTY_PRINT : 128;

        $multipleDimensions = array(array(1, 2));
        $numericKeys = array('library' => 'monolog');
        $singleDimension = array(1, 'Hello', 'Jordi');

        return array(
            array(array(), '[]'),
            array($multipleDimensions, json_encode($multipleDimensions, $jsonPrettyPrintFlag)),
            array($numericKeys, json_encode($numericKeys, $jsonPrettyPrintFlag)),
            array($singleDimension, json_encode($singleDimension))
        );
    }

    /**
     * @dataProvider dataStringify
     */
    public function testStringify($fields, $expectedResult)
    {
        $slackRecord = new SlackRecord(
            '#test',
            'test',
            true,
            null,
            true,
            true
        );

        $this->assertSame($expectedResult, $slackRecord->stringify($fields));
    }

    public function testAddsCustomUsername()
    {
        $username = 'Monolog bot';
        $record = new SlackRecord(null, $username);
        $data = $record->getSlackData($this->getRecord());

        $this->assertArrayHasKey('username', $data);
        $this->assertSame($username, $data['username']);
    }

    public function testNoIcon()
    {
        $record = new SlackRecord();
        $data = $record->getSlackData($this->getRecord());

        $this->assertArrayNotHasKey('icon_emoji', $data);
    }

    public function testAddsIcon()
    {
        $record = $this->getRecord();
        $slackRecord = new SlackRecord(null, null, false, 'ghost');
        $data = $slackRecord->getSlackData($record);

        $slackRecord2 = new SlackRecord(null, null, false, 'http://github.com/Seldaek/monolog');
        $data2 = $slackRecord2->getSlackData($record);

        $this->assertArrayHasKey('icon_emoji', $data);
        $this->assertSame(':ghost:', $data['icon_emoji']);
        $this->assertArrayHasKey('icon_url', $data2);
        $this->assertSame('http://github.com/Seldaek/monolog', $data2['icon_url']);
    }

    public function testAttachmentsNotPresentIfNoAttachment()
    {
        $record = new SlackRecord(null, null, false);
        $data = $record->getSlackData($this->getRecord());

        $this->assertArrayNotHasKey('attachments', $data);
    }

    public function testAddsOneAttachment()
    {
        $record = new SlackRecord();
        $data = $record->getSlackData($this->getRecord());

        $this->assertArrayHasKey('attachments', $data);
        $this->assertArrayHasKey(0, $data['attachments']);
        $this->assertInternalType('array', $data['attachments'][0]);
    }

    public function testTextEqualsMessageIfNoAttachment()
    {
        $message = 'Test message';
        $record = new SlackRecord(null, null, false);
        $data = $record->getSlackData($this->getRecord(Logger::WARNING, $message));

        $this->assertArrayHasKey('text', $data);
        $this->assertSame($message, $data['text']);
    }

    public function testTextEqualsFormatterOutput()
    {
        $formatter = $this->getMock('Monolog\\Formatter\\FormatterInterface');
        $formatter
            ->expects($this->any())
            ->method('format')
            ->will($this->returnCallback(function ($record) { return $record['message'] . 'test'; }));

        $formatter2 = $this->getMock('Monolog\\Formatter\\FormatterInterface');
        $formatter2
            ->expects($this->any())
            ->method('format')
            ->will($this->returnCallback(function ($record) { return $record['message'] . 'test1'; }));

        $message = 'Test message';
        $record = new SlackRecord(null, null, false, null, false, false, array(), $formatter);
        $data = $record->getSlackData($this->getRecord(Logger::WARNING, $message));

        $this->assertArrayHasKey('text', $data);
        $this->assertSame($message . 'test', $data['text']);

        $record->setFormatter($formatter2);
        $data = $record->getSlackData($this->getRecord(Logger::WARNING, $message));

        $this->assertArrayHasKey('text', $data);
        $this->assertSame($message . 'test1', $data['text']);
    }

    public function testAddsFallbackAndTextToAttachment()
    {
        $message = 'Test message';
        $record = new SlackRecord(null);
        $data = $record->getSlackData($this->getRecord(Logger::WARNING, $message));

        $this->assertSame($message, $data['attachments'][0]['text']);
        $this->assertSame($message, $data['attachments'][0]['fallback']);
    }

    public function testMapsLevelToColorAttachmentColor()
    {
        $record = new SlackRecord(null);
        $errorLoggerRecord = $this->getRecord(Logger::ERROR);
        $emergencyLoggerRecord = $this->getRecord(Logger::EMERGENCY);
        $warningLoggerRecord = $this->getRecord(Logger::WARNING);
        $infoLoggerRecord = $this->getRecord(Logger::INFO);
        $debugLoggerRecord = $this->getRecord(Logger::DEBUG);

        $data = $record->getSlackData($errorLoggerRecord);
        $this->assertSame(SlackRecord::COLOR_DANGER, $data['attachments'][0]['color']);

        $data = $record->getSlackData($emergencyLoggerRecord);
        $this->assertSame(SlackRecord::COLOR_DANGER, $data['attachments'][0]['color']);

        $data = $record->getSlackData($warningLoggerRecord);
        $this->assertSame(SlackRecord::COLOR_WARNING, $data['attachments'][0]['color']);

        $data = $record->getSlackData($infoLoggerRecord);
        $this->assertSame(SlackRecord::COLOR_GOOD, $data['attachments'][0]['color']);

        $data = $record->getSlackData($debugLoggerRecord);
        $this->assertSame(SlackRecord::COLOR_DEFAULT, $data['attachments'][0]['color']);
    }

    public function testAddsShortAttachmentWithoutContextAndExtra()
    {
        $level = Logger::ERROR;
        $levelName = Logger::getLevelName($level);
        $record = new SlackRecord(null, null, true, null, true);
        $data = $record->getSlackData($this->getRecord($level, 'test', array('test' => 1)));

        $attachment = $data['attachments'][0];
        $this->assertArrayHasKey('title', $attachment);
        $this->assertArrayHasKey('fields', $attachment);
        $this->assertSame($levelName, $attachment['title']);
        $this->assertSame(array(), $attachment['fields']);
    }

    public function testAddsShortAttachmentWithContextAndExtra()
    {
        $level = Logger::ERROR;
        $levelName = Logger::getLevelName($level);
        $context = array('test' => 1);
        $extra = array('tags' => array('web'));
        $record = new SlackRecord(null, null, true, null, true, true);
        $loggerRecord = $this->getRecord($level, 'test', $context);
        $loggerRecord['extra'] = $extra;
        $data = $record->getSlackData($loggerRecord);

        $attachment = $data['attachments'][0];
        $this->assertArrayHasKey('title', $attachment);
        $this->assertArrayHasKey('fields', $attachment);
        $this->assertCount(2, $attachment['fields']);
        $this->assertSame($levelName, $attachment['title']);
        $this->assertSame(
            array(
                array(
                    'title' => 'Extra',
                    'value' => sprintf('```%s```', json_encode($extra, $this->jsonPrettyPrintFlag)),
                    'short' => false
                ),
                array(
                    'title' => 'Context',
                    'value' => sprintf('```%s```', json_encode($context, $this->jsonPrettyPrintFlag)),
                    'short' => false
                )
            ),
            $attachment['fields']
        );
    }

    public function testAddsLongAttachmentWithoutContextAndExtra()
    {
        $level = Logger::ERROR;
        $levelName = Logger::getLevelName($level);
        $record = new SlackRecord(null, null, true, null);
        $data = $record->getSlackData($this->getRecord($level, 'test', array('test' => 1)));

        $attachment = $data['attachments'][0];
        $this->assertArrayHasKey('title', $attachment);
        $this->assertArrayHasKey('fields', $attachment);
        $this->assertCount(1, $attachment['fields']);
        $this->assertSame('Message', $attachment['title']);
        $this->assertSame(
            array(array(
                'title' => 'Level',
                'value' => $levelName,
                'short' => false
            )),
            $attachment['fields']
        );
    }

    public function testAddsLongAttachmentWithContextAndExtra()
    {
        $level = Logger::ERROR;
        $levelName = Logger::getLevelName($level);
        $context = array('test' => 1);
        $extra = array('tags' => array('web'));
        $record = new SlackRecord(null, null, true, null, false, true);
        $loggerRecord = $this->getRecord($level, 'test', $context);
        $loggerRecord['extra'] = $extra;
        $data = $record->getSlackData($loggerRecord);

        $expectedFields = array(
            array(
                'title' => 'Level',
                'value' => $levelName,
                'short' => false,
            ),
            array(
                'title' => 'tags',
                'value' => sprintf('```%s```', json_encode($extra['tags'])),
                'short' => false
            ),
            array(
                'title' => 'test',
                'value' => $context['test'],
                'short' => false
            )
        );

        $attachment = $data['attachments'][0];
        $this->assertArrayHasKey('title', $attachment);
        $this->assertArrayHasKey('fields', $attachment);
        $this->assertCount(3, $attachment['fields']);
        $this->assertSame('Message', $attachment['title']);
        $this->assertSame(
            $expectedFields,
            $attachment['fields']
        );
    }

    public function testAddsTimestampToAttachment()
    {
        $record = $this->getRecord();
        $slackRecord = new SlackRecord();
        $data = $slackRecord->getSlackData($this->getRecord());

        $attachment = $data['attachments'][0];
        $this->assertArrayHasKey('ts', $attachment);
        $this->assertSame($record['datetime']->getTimestamp(), $attachment['ts']);
    }

    public function testExcludeExtraAndContextFields()
    {
        $record = $this->getRecord(
            Logger::WARNING,
            'test',
            array('info' => array('library' => 'monolog', 'author' => 'Jordi'))
        );
        $record['extra'] = array('tags' => array('web', 'cli'));

        $slackRecord = new SlackRecord(null, null, true, null, false, true, array('context.info.library', 'extra.tags.1'));
        $data = $slackRecord->getSlackData($record);
        $attachment = $data['attachments'][0];

        $expected = array(
            array(
                'title' => 'info',
                'value' => sprintf('```%s```', json_encode(array('author' => 'Jordi'), $this->jsonPrettyPrintFlag)),
                'short' => false
            ),
            array(
                'title' => 'tags',
                'value' => sprintf('```%s```', json_encode(array('web'))),
                'short' => false
            ),
        );

        foreach ($expected as $field) {
            $this->assertNotFalse(array_search($field, $attachment['fields']));
            break;
        }
    }
}
