<?php
/*
 * This file is part of the php-code-coverage package.
 *
 * (c) Sebastian Bergmann <sebastian@phpunit.de>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace SebastianBergmann\CodeCoverage;

/**
 * @covers SebastianBergmann\CodeCoverage\Util
 */
class UtilTest extends \PHPUnit_Framework_TestCase
{
    public function testPercent()
    {
        $this->assertEquals(100, Util::percent(100, 0));
        $this->assertEquals(100, Util::percent(100, 100));
        $this->assertEquals(
            '100.00%',
            Util::percent(100, 100, true)
        );
    }
}
