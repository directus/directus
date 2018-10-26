<?php
/*
 * This file is part of the GlobalState package.
 *
 * (c) Sebastian Bergmann <sebastian@phpunit.de>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace SebastianBergmann\GlobalState;

use ArrayObject;
use PHPUnit_Framework_TestCase;
use SebastianBergmann\GlobalState\TestFixture\SnapshotClass;

/**
 */
class SnapshotTest extends PHPUnit_Framework_TestCase
{
    public function testStaticAttributes()
    {
        $blacklist = $this->getBlacklist();
        $blacklist->method('isStaticAttributeBlacklisted')->willReturnCallback(function ($class) {
            return $class !== 'SebastianBergmann\GlobalState\TestFixture\SnapshotClass';
        });

        SnapshotClass::init();

        $snapshot = new Snapshot($blacklist, false, true, false, false, false, false, false, false, false);
        $expected = array('SebastianBergmann\GlobalState\TestFixture\SnapshotClass' => array(
            'string' => 'snapshot',
            'arrayObject' => new ArrayObject(array(1, 2, 3)),
            'stdClass' => new \stdClass(),
        ));

        $this->assertEquals($expected, $snapshot->staticAttributes());
    }

    public function testConstants()
    {
        $snapshot = new Snapshot($this->getBlacklist(), false, false, true, false, false, false, false, false, false);
        $this->assertArrayHasKey('GLOBALSTATE_TESTSUITE', $snapshot->constants());
    }

    public function testFunctions()
    {
        require_once __DIR__.'/_fixture/SnapshotFunctions.php';

        $snapshot = new Snapshot($this->getBlacklist(), false, false, false, true, false, false, false, false, false);
        $functions = $snapshot->functions();

        $this->assertThat(
            $functions,
            $this->logicalOr(
                // Zend
                $this->contains('sebastianbergmann\globalstate\testfixture\snapshotfunction'),
                // HHVM
                $this->contains('SebastianBergmann\GlobalState\TestFixture\snapshotFunction')
            )
        );

        $this->assertNotContains('assert', $functions);
    }

    public function testClasses()
    {
        $snapshot = new Snapshot($this->getBlacklist(), false, false, false, false, true, false, false, false, false);
        $classes = $snapshot->classes();

        $this->assertContains('PHPUnit_Framework_TestCase', $classes);
        $this->assertNotContains('Exception', $classes);
    }

    public function testInterfaces()
    {
        $snapshot = new Snapshot($this->getBlacklist(), false, false, false, false, false, true, false, false, false);
        $interfaces = $snapshot->interfaces();

        $this->assertContains('PHPUnit_Framework_Test', $interfaces);
        $this->assertNotContains('Countable', $interfaces);
    }

    /**
     * @requires PHP 5.4
     */
    public function testTraits()
    {
        spl_autoload_call('SebastianBergmann\GlobalState\TestFixture\SnapshotTrait');

        $snapshot = new Snapshot($this->getBlacklist(), false, false, false, false, false, false, true, false, false);
        $this->assertContains('SebastianBergmann\GlobalState\TestFixture\SnapshotTrait', $snapshot->traits());
    }

    public function testIniSettings()
    {
        $snapshot = new Snapshot($this->getBlacklist(), false, false, false, false, false, false, false, true, false);
        $iniSettings = $snapshot->iniSettings();

        $this->assertArrayHasKey('date.timezone', $iniSettings);
        $this->assertEquals('Etc/UTC', $iniSettings['date.timezone']);
    }

    public function testIncludedFiles()
    {
        $snapshot = new Snapshot($this->getBlacklist(), false, false, false, false, false, false, false, false, true);
        $this->assertContains(__FILE__, $snapshot->includedFiles());
    }

    /**
     * @return \SebastianBergmann\GlobalState\Blacklist
     */
    private function getBlacklist()
    {
        return $this->getMockBuilder('SebastianBergmann\GlobalState\Blacklist')
                    ->disableOriginalConstructor()
                    ->getMock();
    }
}
