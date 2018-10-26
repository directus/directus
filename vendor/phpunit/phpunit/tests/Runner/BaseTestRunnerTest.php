<?php
/*
 * This file is part of PHPUnit.
 *
 * (c) Sebastian Bergmann <sebastian@phpunit.de>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

class Runner_BaseTestRunnerTest extends PHPUnit_Framework_TestCase
{
    public function testInvokeNonStaticSuite()
    {
        $runner = new MockRunner;
        $runner->getTest('NonStatic');
    }
}
