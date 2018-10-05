<?php
/*
 * This file is part of the Environment package.
 *
 * (c) Sebastian Bergmann <sebastian@phpunit.de>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace SebastianBergmann\Environment;

use PHPUnit_Framework_TestCase;

class ConsoleTest extends PHPUnit_Framework_TestCase
{
    /**
     * @var \SebastianBergmann\Environment\Console
     */
    private $console;

    protected function setUp()
    {
        $this->console = new Console;
    }

    /**
     * @covers \SebastianBergmann\Environment\Console::isInteractive
     */
    public function testCanDetectIfStdoutIsInteractiveByDefault()
    {
        $this->assertInternalType('boolean', $this->console->isInteractive());
    }

    /**
     * @covers \SebastianBergmann\Environment\Console::isInteractive
     */
    public function testCanDetectIfFileDescriptorIsInteractive()
    {
        $this->assertInternalType('boolean', $this->console->isInteractive(STDOUT));
    }

    /**
     * @covers \SebastianBergmann\Environment\Console::hasColorSupport
     *
     * @uses   \SebastianBergmann\Environment\Console::isInteractive
     */
    public function testCanDetectColorSupport()
    {
        $this->assertInternalType('boolean', $this->console->hasColorSupport());
    }

    /**
     * @covers \SebastianBergmann\Environment\Console::getNumberOfColumns
     *
     * @uses   \SebastianBergmann\Environment\Console::isInteractive
     */
    public function testCanDetectNumberOfColumns()
    {
        $this->assertInternalType('integer', $this->console->getNumberOfColumns());
    }
}
