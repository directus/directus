<?php

/*
 * This file is part of the Monolog package.
 *
 * (c) Jordi Boggiano <j.boggiano@seld.be>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Monolog\Formatter;

use Monolog\Logger;
use Monolog\TestCase;

class JsonFormatterTest extends TestCase
{
    /**
     * @covers Monolog\Formatter\JsonFormatter::__construct
     * @covers Monolog\Formatter\JsonFormatter::getBatchMode
     * @covers Monolog\Formatter\JsonFormatter::isAppendingNewlines
     */
    public function testConstruct()
    {
        $formatter = new JsonFormatter();
        $this->assertEquals(JsonFormatter::BATCH_MODE_JSON, $formatter->getBatchMode());
        $this->assertEquals(true, $formatter->isAppendingNewlines());
        $formatter = new JsonFormatter(JsonFormatter::BATCH_MODE_NEWLINES, false);
        $this->assertEquals(JsonFormatter::BATCH_MODE_NEWLINES, $formatter->getBatchMode());
        $this->assertEquals(false, $formatter->isAppendingNewlines());
    }

    /**
     * @covers Monolog\Formatter\JsonFormatter::format
     */
    public function testFormat()
    {
        $formatter = new JsonFormatter();
        $record = $this->getRecord();
        $this->assertEquals(json_encode($record)."\n", $formatter->format($record));

        $formatter = new JsonFormatter(JsonFormatter::BATCH_MODE_JSON, false);
        $record = $this->getRecord();
        $this->assertEquals(json_encode($record), $formatter->format($record));
    }

    /**
     * @covers Monolog\Formatter\JsonFormatter::formatBatch
     * @covers Monolog\Formatter\JsonFormatter::formatBatchJson
     */
    public function testFormatBatch()
    {
        $formatter = new JsonFormatter();
        $records = array(
            $this->getRecord(Logger::WARNING),
            $this->getRecord(Logger::DEBUG),
        );
        $this->assertEquals(json_encode($records), $formatter->formatBatch($records));
    }

    /**
     * @covers Monolog\Formatter\JsonFormatter::formatBatch
     * @covers Monolog\Formatter\JsonFormatter::formatBatchNewlines
     */
    public function testFormatBatchNewlines()
    {
        $formatter = new JsonFormatter(JsonFormatter::BATCH_MODE_NEWLINES);
        $records = $expected = array(
            $this->getRecord(Logger::WARNING),
            $this->getRecord(Logger::DEBUG),
        );
        array_walk($expected, function (&$value, $key) {
            $value = json_encode($value);
        });
        $this->assertEquals(implode("\n", $expected), $formatter->formatBatch($records));
    }

    public function testDefFormatWithException()
    {
        $formatter = new JsonFormatter();
        $exception = new \RuntimeException('Foo');
        $formattedException = $this->formatException($exception);

        $message = $this->formatRecordWithExceptionInContext($formatter, $exception);

        $this->assertContextContainsFormattedException($formattedException, $message);
    }

    public function testDefFormatWithPreviousException()
    {
        $formatter = new JsonFormatter();
        $exception = new \RuntimeException('Foo', 0, new \LogicException('Wut?'));
        $formattedPrevException = $this->formatException($exception->getPrevious());
        $formattedException = $this->formatException($exception, $formattedPrevException);

        $message = $this->formatRecordWithExceptionInContext($formatter, $exception);

        $this->assertContextContainsFormattedException($formattedException, $message);
    }

    public function testDefFormatWithThrowable()
    {
        if (!class_exists('Error') || !is_subclass_of('Error', 'Throwable')) {
            $this->markTestSkipped('Requires PHP >=7');
        }

        $formatter = new JsonFormatter();
        $throwable = new \Error('Foo');
        $formattedThrowable = $this->formatException($throwable);

        $message = $this->formatRecordWithExceptionInContext($formatter, $throwable);

        $this->assertContextContainsFormattedException($formattedThrowable, $message);
    }

    /**
     * @param string $expected
     * @param string $actual
     *
     * @internal param string $exception
     */
    private function assertContextContainsFormattedException($expected, $actual)
    {
        $this->assertEquals(
            '{"level_name":"CRITICAL","channel":"core","context":{"exception":'.$expected.'},"datetime":null,"extra":[],"message":"foobar"}'."\n",
            $actual
        );
    }

    /**
     * @param JsonFormatter $formatter
     * @param \Exception|\Throwable $exception
     *
     * @return string
     */
    private function formatRecordWithExceptionInContext(JsonFormatter $formatter, $exception)
    {
        $message = $formatter->format(array(
            'level_name' => 'CRITICAL',
            'channel' => 'core',
            'context' => array('exception' => $exception),
            'datetime' => null,
            'extra' => array(),
            'message' => 'foobar',
        ));
        return $message;
    }

    /**
     * @param \Exception|\Throwable $exception
     *
     * @return string
     */
    private function formatExceptionFilePathWithLine($exception)
    {
        $options = 0;
        if (version_compare(PHP_VERSION, '5.4.0', '>=')) {
            $options = JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE;
        }
        $path = substr(json_encode($exception->getFile(), $options), 1, -1);
        return $path . ':' . $exception->getLine();
    }

    /**
     * @param \Exception|\Throwable $exception
     *
     * @param null|string $previous
     *
     * @return string
     */
    private function formatException($exception, $previous = null)
    {
        $formattedException =
            '{"class":"' . get_class($exception) .
            '","message":"' . $exception->getMessage() .
            '","code":' . $exception->getCode() .
            ',"file":"' . $this->formatExceptionFilePathWithLine($exception) .
            ($previous ? '","previous":' . $previous : '"') .
            '}';
        return $formattedException;
    }

    public function testNormalizeHandleLargeArraysWithExactly1000Items()
    {
        $formatter = new NormalizerFormatter();
        $largeArray = range(1, 1000);

        $res = $formatter->format(array(
            'level_name' => 'CRITICAL',
            'channel' => 'test',
            'message' => 'bar',
            'context' => array($largeArray),
            'datetime' => new \DateTime,
            'extra' => array(),
        ));

        $this->assertCount(1000, $res['context'][0]);
        $this->assertArrayNotHasKey('...', $res['context'][0]);
    }

    public function testNormalizeHandleLargeArrays()
    {
        $formatter = new NormalizerFormatter();
        $largeArray = range(1, 2000);

        $res = $formatter->format(array(
            'level_name' => 'CRITICAL',
            'channel' => 'test',
            'message' => 'bar',
            'context' => array($largeArray),
            'datetime' => new \DateTime,
            'extra' => array(),
        ));

        $this->assertCount(1001, $res['context'][0]);
        $this->assertEquals('Over 1000 items (2000 total), aborting normalization', $res['context'][0]['...']);
    }
}
