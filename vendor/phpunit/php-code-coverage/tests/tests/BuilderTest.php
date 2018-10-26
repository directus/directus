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
use SebastianBergmann\CodeCoverage\Node\Builder;

class BuilderTest extends TestCase
{
    protected $factory;

    protected function setUp()
    {
        $this->factory = new Builder;
    }

    public function testSomething()
    {
        $root = $this->getCoverageForBankAccount()->getReport();

        $expectedPath = rtrim(TEST_FILES_PATH, DIRECTORY_SEPARATOR);
        $this->assertEquals($expectedPath, $root->getName());
        $this->assertEquals($expectedPath, $root->getPath());
        $this->assertEquals(10, $root->getNumExecutableLines());
        $this->assertEquals(5, $root->getNumExecutedLines());
        $this->assertEquals(1, $root->getNumClasses());
        $this->assertEquals(0, $root->getNumTestedClasses());
        $this->assertEquals(4, $root->getNumMethods());
        $this->assertEquals(3, $root->getNumTestedMethods());
        $this->assertEquals('0.00%', $root->getTestedClassesPercent());
        $this->assertEquals('75.00%', $root->getTestedMethodsPercent());
        $this->assertEquals('50.00%', $root->getLineExecutedPercent());
        $this->assertEquals(0, $root->getNumFunctions());
        $this->assertEquals(0, $root->getNumTestedFunctions());
        $this->assertNull($root->getParent());
        $this->assertEquals([], $root->getDirectories());
        #$this->assertEquals(array(), $root->getFiles());
        #$this->assertEquals(array(), $root->getChildNodes());

        $this->assertEquals(
            [
                'BankAccount' => [
                    'methods' => [
                        'getBalance' => [
                            'signature'       => 'getBalance()',
                            'startLine'       => 6,
                            'endLine'         => 9,
                            'executableLines' => 1,
                            'executedLines'   => 1,
                            'ccn'             => 1,
                            'coverage'        => 100,
                            'crap'            => '1',
                            'link'            => 'BankAccount.php.html#6',
                            'methodName'      => 'getBalance',
                            'visibility'      => 'public',
                        ],
                        'setBalance' => [
                            'signature'       => 'setBalance($balance)',
                            'startLine'       => 11,
                            'endLine'         => 18,
                            'executableLines' => 5,
                            'executedLines'   => 0,
                            'ccn'             => 2,
                            'coverage'        => 0,
                            'crap'            => 6,
                            'link'            => 'BankAccount.php.html#11',
                            'methodName'      => 'setBalance',
                            'visibility'      => 'protected',
                        ],
                        'depositMoney' => [
                            'signature'       => 'depositMoney($balance)',
                            'startLine'       => 20,
                            'endLine'         => 25,
                            'executableLines' => 2,
                            'executedLines'   => 2,
                            'ccn'             => 1,
                            'coverage'        => 100,
                            'crap'            => '1',
                            'link'            => 'BankAccount.php.html#20',
                            'methodName'      => 'depositMoney',
                            'visibility'      => 'public',
                        ],
                        'withdrawMoney' => [
                            'signature'       => 'withdrawMoney($balance)',
                            'startLine'       => 27,
                            'endLine'         => 32,
                            'executableLines' => 2,
                            'executedLines'   => 2,
                            'ccn'             => 1,
                            'coverage'        => 100,
                            'crap'            => '1',
                            'link'            => 'BankAccount.php.html#27',
                            'methodName'      => 'withdrawMoney',
                            'visibility'      => 'public',
                        ],
                    ],
                    'startLine'       => 2,
                    'executableLines' => 10,
                    'executedLines'   => 5,
                    'ccn'             => 5,
                    'coverage'        => 50,
                    'crap'            => '8.12',
                    'package'         => [
                        'namespace'   => '',
                        'fullPackage' => '',
                        'category'    => '',
                        'package'     => '',
                        'subpackage'  => ''
                    ],
                    'link'      => 'BankAccount.php.html#2',
                    'className' => 'BankAccount'
                ]
            ],
            $root->getClasses()
        );

        $this->assertEquals([], $root->getFunctions());
    }

    public function testBuildDirectoryStructure()
    {
        $method = new \ReflectionMethod(
            Builder::class,
            'buildDirectoryStructure'
        );

        $method->setAccessible(true);

        $this->assertEquals(
            [
                'src' => [
                    'Money.php/f'    => [],
                    'MoneyBag.php/f' => []
                ]
            ],
            $method->invoke(
                $this->factory,
                ['src/Money.php' => [], 'src/MoneyBag.php' => []]
            )
        );
    }

    /**
     * @dataProvider reducePathsProvider
     */
    public function testReducePaths($reducedPaths, $commonPath, $paths)
    {
        $method = new \ReflectionMethod(
            Builder::class,
            'reducePaths'
        );

        $method->setAccessible(true);

        $_commonPath = $method->invokeArgs($this->factory, [&$paths]);

        $this->assertEquals($reducedPaths, $paths);
        $this->assertEquals($commonPath, $_commonPath);
    }

    public function reducePathsProvider()
    {
        return [
            [
                [
                    'Money.php'    => [],
                    'MoneyBag.php' => []
                ],
                '/home/sb/Money',
                [
                    '/home/sb/Money/Money.php'    => [],
                    '/home/sb/Money/MoneyBag.php' => []
                ]
            ],
            [
                [
                    'Money.php' => []
                ],
                '/home/sb/Money/',
                [
                    '/home/sb/Money/Money.php' => []
                ]
            ],
            [
                [],
                '.',
                []
            ],
            [
                [
                    'Money.php'          => [],
                    'MoneyBag.php'       => [],
                    'Cash.phar/Cash.php' => [],
                ],
                '/home/sb/Money',
                [
                    '/home/sb/Money/Money.php'                 => [],
                    '/home/sb/Money/MoneyBag.php'              => [],
                    'phar:///home/sb/Money/Cash.phar/Cash.php' => [],
                ],
            ],
        ];
    }
}
