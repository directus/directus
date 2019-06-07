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
use Symfony\Bridge\PhpUnit\ClassExistsMock;
use Symfony\Component\Console\Helper\Dumper;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\VarDumper\Dumper\CliDumper;

class DumperNativeFallbackTest extends TestCase
{
    public static function setUpBeforeClass()
    {
        ClassExistsMock::register(Dumper::class);
        ClassExistsMock::withMockedClasses([
            CliDumper::class => false,
        ]);
    }

    public static function tearDownAfterClass()
    {
        ClassExistsMock::withMockedClasses([]);
    }

    /**
     * @dataProvider provideVariables
     */
    public function testInvoke($variable, $primitiveString)
    {
        $dumper = new Dumper($this->getMockBuilder(OutputInterface::class)->getMock());

        $this->assertSame($primitiveString, $dumper($variable));
    }

    public function provideVariables()
    {
        return [
            [null, 'null'],
            [true, 'true'],
            [false, 'false'],
            [1, '1'],
            [-1.5, '-1.5'],
            ['string', '"string"'],
            [[1, '2'], "Array\n(\n    [0] => 1\n    [1] => 2\n)"],
            [new \stdClass(), "stdClass Object\n(\n)"],
        ];
    }
}
