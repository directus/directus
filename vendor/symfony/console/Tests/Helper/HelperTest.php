<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\Component\Console\Tests\Helper;

use PHPUnit\Framework\TestCase;
use Symfony\Component\Console\Helper\Helper;

class HelperTest extends TestCase
{
    public function formatTimeProvider()
    {
        return array(
            array(0,      '< 1 sec'),
            array(1,      '1 sec'),
            array(2,      '2 secs'),
            array(59,     '59 secs'),
            array(60,     '1 min'),
            array(61,     '1 min'),
            array(119,    '1 min'),
            array(120,    '2 mins'),
            array(121,    '2 mins'),
            array(3599,   '59 mins'),
            array(3600,   '1 hr'),
            array(7199,   '1 hr'),
            array(7200,   '2 hrs'),
            array(7201,   '2 hrs'),
            array(86399,  '23 hrs'),
            array(86400,  '1 day'),
            array(86401,  '1 day'),
            array(172799, '1 day'),
            array(172800, '2 days'),
            array(172801, '2 days'),
        );
    }

    /**
     * @dataProvider formatTimeProvider
     *
     * @param int    $secs
     * @param string $expectedFormat
     */
    public function testFormatTime($secs, $expectedFormat)
    {
        $this->assertEquals($expectedFormat, Helper::formatTime($secs));
    }
}
