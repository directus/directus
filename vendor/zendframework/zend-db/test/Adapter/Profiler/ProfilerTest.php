<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace ZendTest\Db\Adapter\Profiler;

use PHPUnit\Framework\TestCase;
use Zend\Db\Adapter\Profiler\Profiler;
use Zend\Db\Adapter\StatementContainer;

class ProfilerTest extends TestCase
{
    /**
     * @var Profiler
     */
    protected $profiler;

    /**
     * Sets up the fixture, for example, opens a network connection.
     * This method is called before a test is executed.
     */
    protected function setUp()
    {
        $this->profiler = new Profiler;
    }

    /**
     * @covers \Zend\Db\Adapter\Profiler\Profiler::profilerStart
     */
    public function testProfilerStart()
    {
        $ret = $this->profiler->profilerStart('SELECT * FROM FOO');
        self::assertSame($this->profiler, $ret);
        $ret = $this->profiler->profilerStart(new StatementContainer());
        self::assertSame($this->profiler, $ret);

        $this->expectException('Zend\Db\Adapter\Exception\InvalidArgumentException');
        $this->expectExceptionMessage('profilerStart takes either a StatementContainer or a string');
        $this->profiler->profilerStart(5);
    }

    /**
     * @covers \Zend\Db\Adapter\Profiler\Profiler::profilerFinish
     */
    public function testProfilerFinish()
    {
        $this->profiler->profilerStart('SELECT * FROM FOO');
        $ret = $this->profiler->profilerFinish();
        self::assertSame($this->profiler, $ret);

        $profiler = new Profiler;
        $this->expectException('Zend\Db\Adapter\Exception\RuntimeException');
        $this->expectExceptionMessage('A profile must be started before profilerFinish can be called');
        $profiler->profilerFinish();
    }

    /**
     * @covers \Zend\Db\Adapter\Profiler\Profiler::getLastProfile
     */
    public function testGetLastProfile()
    {
        $this->profiler->profilerStart('SELECT * FROM FOO');
        $this->profiler->profilerFinish();
        $profile = $this->profiler->getLastProfile();
        self::assertEquals('SELECT * FROM FOO', $profile['sql']);
        self::assertNull($profile['parameters']);
        self::assertInternalType('float', $profile['start']);
        self::assertInternalType('float', $profile['end']);
        self::assertInternalType('float', $profile['elapse']);
    }

    /**
     * @covers \Zend\Db\Adapter\Profiler\Profiler::getProfiles
     */
    public function testGetProfiles()
    {
        $this->profiler->profilerStart('SELECT * FROM FOO1');
        $this->profiler->profilerFinish();
        $this->profiler->profilerStart('SELECT * FROM FOO2');
        $this->profiler->profilerFinish();

        self::assertCount(2, $this->profiler->getProfiles());
    }
}
