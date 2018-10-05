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

class DeduplicationHandlerTest extends TestCase
{
    /**
     * @covers Monolog\Handler\DeduplicationHandler::flush
     */
    public function testFlushPassthruIfAllRecordsUnderTrigger()
    {
        $test = new TestHandler();
        @unlink(sys_get_temp_dir().'/monolog_dedup.log');
        $handler = new DeduplicationHandler($test, sys_get_temp_dir().'/monolog_dedup.log', 0);

        $handler->handle($this->getRecord(Logger::DEBUG));
        $handler->handle($this->getRecord(Logger::INFO));

        $handler->flush();

        $this->assertTrue($test->hasInfoRecords());
        $this->assertTrue($test->hasDebugRecords());
        $this->assertFalse($test->hasWarningRecords());
    }

    /**
     * @covers Monolog\Handler\DeduplicationHandler::flush
     * @covers Monolog\Handler\DeduplicationHandler::appendRecord
     */
    public function testFlushPassthruIfEmptyLog()
    {
        $test = new TestHandler();
        @unlink(sys_get_temp_dir().'/monolog_dedup.log');
        $handler = new DeduplicationHandler($test, sys_get_temp_dir().'/monolog_dedup.log', 0);

        $handler->handle($this->getRecord(Logger::ERROR, 'Foo:bar'));
        $handler->handle($this->getRecord(Logger::CRITICAL, "Foo\nbar"));

        $handler->flush();

        $this->assertTrue($test->hasErrorRecords());
        $this->assertTrue($test->hasCriticalRecords());
        $this->assertFalse($test->hasWarningRecords());
    }

    /**
     * @covers Monolog\Handler\DeduplicationHandler::flush
     * @covers Monolog\Handler\DeduplicationHandler::appendRecord
     * @covers Monolog\Handler\DeduplicationHandler::isDuplicate
     * @depends testFlushPassthruIfEmptyLog
     */
    public function testFlushSkipsIfLogExists()
    {
        $test = new TestHandler();
        $handler = new DeduplicationHandler($test, sys_get_temp_dir().'/monolog_dedup.log', 0);

        $handler->handle($this->getRecord(Logger::ERROR, 'Foo:bar'));
        $handler->handle($this->getRecord(Logger::CRITICAL, "Foo\nbar"));

        $handler->flush();

        $this->assertFalse($test->hasErrorRecords());
        $this->assertFalse($test->hasCriticalRecords());
        $this->assertFalse($test->hasWarningRecords());
    }

    /**
     * @covers Monolog\Handler\DeduplicationHandler::flush
     * @covers Monolog\Handler\DeduplicationHandler::appendRecord
     * @covers Monolog\Handler\DeduplicationHandler::isDuplicate
     * @depends testFlushPassthruIfEmptyLog
     */
    public function testFlushPassthruIfLogTooOld()
    {
        $test = new TestHandler();
        $handler = new DeduplicationHandler($test, sys_get_temp_dir().'/monolog_dedup.log', 0);

        $record = $this->getRecord(Logger::ERROR);
        $record['datetime']->modify('+62seconds');
        $handler->handle($record);
        $record = $this->getRecord(Logger::CRITICAL);
        $record['datetime']->modify('+62seconds');
        $handler->handle($record);

        $handler->flush();

        $this->assertTrue($test->hasErrorRecords());
        $this->assertTrue($test->hasCriticalRecords());
        $this->assertFalse($test->hasWarningRecords());
    }

    /**
     * @covers Monolog\Handler\DeduplicationHandler::flush
     * @covers Monolog\Handler\DeduplicationHandler::appendRecord
     * @covers Monolog\Handler\DeduplicationHandler::isDuplicate
     * @covers Monolog\Handler\DeduplicationHandler::collectLogs
     */
    public function testGcOldLogs()
    {
        $test = new TestHandler();
        @unlink(sys_get_temp_dir().'/monolog_dedup.log');
        $handler = new DeduplicationHandler($test, sys_get_temp_dir().'/monolog_dedup.log', 0);

        // handle two records from yesterday, and one recent
        $record = $this->getRecord(Logger::ERROR);
        $record['datetime']->modify('-1day -10seconds');
        $handler->handle($record);
        $record2 = $this->getRecord(Logger::CRITICAL);
        $record2['datetime']->modify('-1day -10seconds');
        $handler->handle($record2);
        $record3 = $this->getRecord(Logger::CRITICAL);
        $record3['datetime']->modify('-30seconds');
        $handler->handle($record3);

        // log is written as none of them are duplicate
        $handler->flush();
        $this->assertSame(
            $record['datetime']->getTimestamp() . ":ERROR:test\n" .
            $record2['datetime']->getTimestamp() . ":CRITICAL:test\n" .
            $record3['datetime']->getTimestamp() . ":CRITICAL:test\n",
            file_get_contents(sys_get_temp_dir() . '/monolog_dedup.log')
        );
        $this->assertTrue($test->hasErrorRecords());
        $this->assertTrue($test->hasCriticalRecords());
        $this->assertFalse($test->hasWarningRecords());

        // clear test handler
        $test->clear();
        $this->assertFalse($test->hasErrorRecords());
        $this->assertFalse($test->hasCriticalRecords());

        // log new records, duplicate log gets GC'd at the end of this flush call
        $handler->handle($record = $this->getRecord(Logger::ERROR));
        $handler->handle($record2 = $this->getRecord(Logger::CRITICAL));
        $handler->flush();

        // log should now contain the new errors and the previous one that was recent enough
        $this->assertSame(
            $record3['datetime']->getTimestamp() . ":CRITICAL:test\n" .
            $record['datetime']->getTimestamp() . ":ERROR:test\n" .
            $record2['datetime']->getTimestamp() . ":CRITICAL:test\n",
            file_get_contents(sys_get_temp_dir() . '/monolog_dedup.log')
        );
        $this->assertTrue($test->hasErrorRecords());
        $this->assertTrue($test->hasCriticalRecords());
        $this->assertFalse($test->hasWarningRecords());
    }

    public static function tearDownAfterClass()
    {
        @unlink(sys_get_temp_dir().'/monolog_dedup.log');
    }
}
