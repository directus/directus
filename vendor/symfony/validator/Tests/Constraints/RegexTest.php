<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\Component\Validator\Tests\Constraints;

use PHPUnit\Framework\TestCase;
use Symfony\Component\Validator\Constraints\Regex;

/**
 * @author Bernhard Schussek <bschussek@gmail.com>
 */
class RegexTest extends TestCase
{
    public function testConstraintGetDefaultOption()
    {
        $constraint = new Regex('/^[0-9]+$/');

        $this->assertSame('/^[0-9]+$/', $constraint->pattern);
    }

    public function provideHtmlPatterns()
    {
        return array(
            // HTML5 wraps the pattern in ^(?:pattern)$
            array('/^[0-9]+$/', '[0-9]+'),
            array('/[0-9]+$/', '.*[0-9]+'),
            array('/^[0-9]+/', '[0-9]+.*'),
            array('/[0-9]+/', '.*[0-9]+.*'),
            // We need a smart way to allow matching of patterns that contain
            // ^ and $ at various sub-clauses of an or-clause
            // .*(pattern).* seems to work correctly
            array('/[0-9]$|[a-z]+/', '.*([0-9]$|[a-z]+).*'),
            array('/[0-9]$|^[a-z]+/', '.*([0-9]$|^[a-z]+).*'),
            array('/^[0-9]|[a-z]+$/', '.*(^[0-9]|[a-z]+$).*'),
            // Unescape escaped delimiters
            array('/^[0-9]+\/$/', '[0-9]+/'),
            array('#^[0-9]+\#$#', '[0-9]+#'),
            // Cannot be converted
            array('/^[0-9]+$/i', null),

            // Inverse matches are simple, just wrap in
            // ((?!pattern).)*
            array('/^[0-9]+$/', '((?!^[0-9]+$).)*', false),
            array('/[0-9]+$/', '((?![0-9]+$).)*', false),
            array('/^[0-9]+/', '((?!^[0-9]+).)*', false),
            array('/[0-9]+/', '((?![0-9]+).)*', false),
            array('/[0-9]$|[a-z]+/', '((?![0-9]$|[a-z]+).)*', false),
            array('/[0-9]$|^[a-z]+/', '((?![0-9]$|^[a-z]+).)*', false),
            array('/^[0-9]|[a-z]+$/', '((?!^[0-9]|[a-z]+$).)*', false),
            array('/^[0-9]+\/$/', '((?!^[0-9]+/$).)*', false),
            array('#^[0-9]+\#$#', '((?!^[0-9]+#$).)*', false),
            array('/^[0-9]+$/i', null, false),
        );
    }

    /**
     * @dataProvider provideHtmlPatterns
     */
    public function testGetHtmlPattern($pattern, $htmlPattern, $match = true)
    {
        $constraint = new Regex(array(
            'pattern' => $pattern,
            'match' => $match,
        ));

        $this->assertSame($pattern, $constraint->pattern);
        $this->assertSame($htmlPattern, $constraint->getHtmlPattern());
    }

    public function testGetCustomHtmlPattern()
    {
        $constraint = new Regex(array(
            'pattern' => '((?![0-9]$|[a-z]+).)*',
            'htmlPattern' => 'foobar',
        ));

        $this->assertSame('((?![0-9]$|[a-z]+).)*', $constraint->pattern);
        $this->assertSame('foobar', $constraint->getHtmlPattern());
    }
}
