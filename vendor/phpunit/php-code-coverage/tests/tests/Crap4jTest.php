<?php
/*
 * This file is part of the php-code-coverage package.
 *
 * (c) Sebastian Bergmann <sebastian@phpunit.de>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace SebastianBergmann\CodeCoverage\Report;

use SebastianBergmann\CodeCoverage\TestCase;

/**
 * @covers SebastianBergmann\CodeCoverage\Report\Crap4j
 */
class Crap4jTest extends TestCase
{
    public function testForBankAccountTest()
    {
        $crap4j = new Crap4j;

        $this->assertStringMatchesFormatFile(
            TEST_FILES_PATH . 'BankAccount-crap4j.xml',
            $crap4j->process($this->getCoverageForBankAccount(), null, 'BankAccount')
        );
    }

    public function testForFileWithIgnoredLines()
    {
        $crap4j = new Crap4j;

        $this->assertStringMatchesFormatFile(
            TEST_FILES_PATH . 'ignored-lines-crap4j.xml',
            $crap4j->process($this->getCoverageForFileWithIgnoredLines(), null, 'CoverageForFileWithIgnoredLines')
        );
    }

    public function testForClassWithAnonymousFunction()
    {
        $crap4j = new Crap4j;

        $this->assertStringMatchesFormatFile(
            TEST_FILES_PATH . 'class-with-anonymous-function-crap4j.xml',
            $crap4j->process($this->getCoverageForClassWithAnonymousFunction(), null, 'CoverageForClassWithAnonymousFunction')
        );
    }
}
