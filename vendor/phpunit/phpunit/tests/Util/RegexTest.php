<?php
/*
 * This file is part of PHPUnit.
 *
 * (c) Sebastian Bergmann <sebastian@phpunit.de>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

class Util_RegexTest extends PHPUnit_Framework_TestCase
{
    public function validRegexpProvider()
    {
        return [
          ['#valid regexp#', 'valid regexp', 1],
          [';val.*xp;', 'valid regexp', 1],
          ['/val.*xp/i', 'VALID REGEXP', 1],
          ['/a val.*p/','valid regexp', 0],
        ];
    }

    public function invalidRegexpProvider()
    {
        return [
          ['valid regexp', 'valid regexp'],
          [';val.*xp', 'valid regexp'],
          ['val.*xp/i', 'VALID REGEXP'],
        ];
    }

    /**
     * @dataProvider validRegexpProvider
     */
    public function testValidRegex($pattern, $subject, $return)
    {
        $this->assertEquals($return, PHPUnit_Util_Regex::pregMatchSafe($pattern, $subject));
    }

    /**
     * @dataProvider invalidRegexpProvider
     */
    public function testInvalidRegex($pattern, $subject)
    {
        $this->assertFalse(PHPUnit_Util_Regex::pregMatchSafe($pattern, $subject));
    }
}
