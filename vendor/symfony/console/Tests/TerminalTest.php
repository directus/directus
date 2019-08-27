<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\Component\Console\Tests;

use PHPUnit\Framework\TestCase;
use Symfony\Component\Console\Terminal;

class TerminalTest extends TestCase
{
    private $colSize;
    private $lineSize;

    protected function setUp(): void
    {
        $this->colSize = getenv('COLUMNS');
        $this->lineSize = getenv('LINES');
    }

    protected function tearDown(): void
    {
        putenv($this->colSize ? 'COLUMNS='.$this->colSize : 'COLUMNS');
        putenv($this->lineSize ? 'LINES' : 'LINES='.$this->lineSize);
    }

    public function test()
    {
        putenv('COLUMNS=100');
        putenv('LINES=50');
        $terminal = new Terminal();
        $this->assertSame(100, $terminal->getWidth());
        $this->assertSame(50, $terminal->getHeight());

        putenv('COLUMNS=120');
        putenv('LINES=60');
        $terminal = new Terminal();
        $this->assertSame(120, $terminal->getWidth());
        $this->assertSame(60, $terminal->getHeight());
    }

    public function test_zero_values()
    {
        putenv('COLUMNS=0');
        putenv('LINES=0');

        $terminal = new Terminal();

        $this->assertSame(0, $terminal->getWidth());
        $this->assertSame(0, $terminal->getHeight());
    }
}
