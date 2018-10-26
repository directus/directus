<?php
/*
 * This file is part of sebastian/diff.
 *
 * (c) Sebastian Bergmann <sebastian@phpunit.de>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace SebastianBergmann\Diff;

use PHPUnit\Framework\TestCase;

/**
 * @covers SebastianBergmann\Diff\Line
 */
class LineTest extends TestCase
{
    /**
     * @var Line
     */
    private $line;

    protected function setUp()
    {
        $this->line = new Line;
    }

    public function testCanBeCreatedWithoutArguments()
    {
        $this->assertInstanceOf('SebastianBergmann\Diff\Line', $this->line);
    }

    public function testTypeCanBeRetrieved()
    {
        $this->assertEquals(Line::UNCHANGED, $this->line->getType());
    }

    public function testContentCanBeRetrieved()
    {
        $this->assertEquals('', $this->line->getContent());
    }
}
