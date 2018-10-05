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

use SebastianBergmann\CodeCoverage\Driver\Xdebug;

/**
 * Abstract base class for test case classes.
 *
 * @since Class available since Release 1.0.0
 */
abstract class TestCase extends \PHPUnit_Framework_TestCase
{
    protected static $TEST_TMP_PATH;

    public static function setUpBeforeClass()
    {
        self::$TEST_TMP_PATH = TEST_FILES_PATH . 'tmp';
    }

    protected function getXdebugDataForBankAccount()
    {
        return [
            [
                TEST_FILES_PATH . 'BankAccount.php' => [
                    8  => 1,
                    9  => -2,
                    13 => -1,
                    14 => -1,
                    15 => -1,
                    16 => -1,
                    18 => -1,
                    22 => -1,
                    24 => -1,
                    25 => -2,
                    29 => -1,
                    31 => -1,
                    32 => -2
                ]
            ],
            [
                TEST_FILES_PATH . 'BankAccount.php' => [
                    8  => 1,
                    13 => 1,
                    16 => 1,
                    29 => 1,
                ]
            ],
            [
                TEST_FILES_PATH . 'BankAccount.php' => [
                    8  => 1,
                    13 => 1,
                    16 => 1,
                    22 => 1,
                ]
            ],
            [
                TEST_FILES_PATH . 'BankAccount.php' => [
                    8  => 1,
                    13 => 1,
                    14 => 1,
                    15 => 1,
                    18 => 1,
                    22 => 1,
                    24 => 1,
                    29 => 1,
                    31 => 1,
                ]
            ]
        ];
    }

    protected function getCoverageForBankAccount()
    {
        $data = $this->getXdebugDataForBankAccount();
        require_once TEST_FILES_PATH . '/BankAccountTest.php';

        $stub = $this->createMock(Xdebug::class);

        $stub->expects($this->any())
            ->method('stop')
            ->will($this->onConsecutiveCalls(
                $data[0],
                $data[1],
                $data[2],
                $data[3]
            ));

        $filter = new Filter;
        $filter->addFileToWhitelist(TEST_FILES_PATH . 'BankAccount.php');

        $coverage = new CodeCoverage($stub, $filter);

        $coverage->start(
            new \BankAccountTest('testBalanceIsInitiallyZero'),
            true
        );

        $coverage->stop(
            true,
            [TEST_FILES_PATH . 'BankAccount.php' => range(6, 9)]
        );

        $coverage->start(
            new \BankAccountTest('testBalanceCannotBecomeNegative')
        );

        $coverage->stop(
            true,
            [TEST_FILES_PATH . 'BankAccount.php' => range(27, 32)]
        );

        $coverage->start(
            new \BankAccountTest('testBalanceCannotBecomeNegative2')
        );

        $coverage->stop(
            true,
            [TEST_FILES_PATH . 'BankAccount.php' => range(20, 25)]
        );

        $coverage->start(
            new \BankAccountTest('testDepositWithdrawMoney')
        );

        $coverage->stop(
            true,
            [
                TEST_FILES_PATH . 'BankAccount.php' => array_merge(
                    range(6, 9),
                    range(20, 25),
                    range(27, 32)
                )
            ]
        );

        return $coverage;
    }

    protected function getCoverageForBankAccountForFirstTwoTests()
    {
        $data = $this->getXdebugDataForBankAccount();

        $stub = $this->createMock(Xdebug::class);

        $stub->expects($this->any())
            ->method('stop')
            ->will($this->onConsecutiveCalls(
                $data[0],
                $data[1]
            ));

        $filter = new Filter;
        $filter->addFileToWhitelist(TEST_FILES_PATH . 'BankAccount.php');

        $coverage = new CodeCoverage($stub, $filter);

        $coverage->start(
            new \BankAccountTest('testBalanceIsInitiallyZero'),
            true
        );

        $coverage->stop(
            true,
            [TEST_FILES_PATH . 'BankAccount.php' => range(6, 9)]
        );

        $coverage->start(
            new \BankAccountTest('testBalanceCannotBecomeNegative')
        );

        $coverage->stop(
            true,
            [TEST_FILES_PATH . 'BankAccount.php' => range(27, 32)]
        );

        return $coverage;
    }

    protected function getCoverageForBankAccountForLastTwoTests()
    {
        $data = $this->getXdebugDataForBankAccount();

        $stub = $this->createMock(Xdebug::class);

        $stub->expects($this->any())
            ->method('stop')
            ->will($this->onConsecutiveCalls(
                $data[2],
                $data[3]
            ));

        $filter = new Filter;
        $filter->addFileToWhitelist(TEST_FILES_PATH . 'BankAccount.php');

        $coverage = new CodeCoverage($stub, $filter);

        $coverage->start(
            new \BankAccountTest('testBalanceCannotBecomeNegative2')
        );

        $coverage->stop(
            true,
            [TEST_FILES_PATH . 'BankAccount.php' => range(20, 25)]
        );

        $coverage->start(
            new \BankAccountTest('testDepositWithdrawMoney')
        );

        $coverage->stop(
            true,
            [
                TEST_FILES_PATH . 'BankAccount.php' => array_merge(
                    range(6, 9),
                    range(20, 25),
                    range(27, 32)
                )
            ]
        );

        return $coverage;
    }

    protected function getExpectedDataArrayForBankAccount()
    {
        return [
            TEST_FILES_PATH . 'BankAccount.php' => [
                8 => [
                    0 => 'BankAccountTest::testBalanceIsInitiallyZero',
                    1 => 'BankAccountTest::testDepositWithdrawMoney'
                ],
                9  => null,
                13 => [],
                14 => [],
                15 => [],
                16 => [],
                18 => [],
                22 => [
                    0 => 'BankAccountTest::testBalanceCannotBecomeNegative2',
                    1 => 'BankAccountTest::testDepositWithdrawMoney'
                ],
                24 => [
                    0 => 'BankAccountTest::testDepositWithdrawMoney',
                ],
                25 => null,
                29 => [
                    0 => 'BankAccountTest::testBalanceCannotBecomeNegative',
                    1 => 'BankAccountTest::testDepositWithdrawMoney'
                ],
                31 => [
                    0 => 'BankAccountTest::testDepositWithdrawMoney'
                ],
                32 => null
            ]
        ];
    }

    protected function getCoverageForFileWithIgnoredLines()
    {
        $filter = new Filter;
        $filter->addFileToWhitelist(TEST_FILES_PATH . 'source_with_ignore.php');

        $coverage = new CodeCoverage(
            $this->setUpXdebugStubForFileWithIgnoredLines(),
            $filter
        );

        $coverage->start('FileWithIgnoredLines', true);
        $coverage->stop();

        return $coverage;
    }

    protected function setUpXdebugStubForFileWithIgnoredLines()
    {
        $stub = $this->createMock(Xdebug::class);

        $stub->expects($this->any())
            ->method('stop')
            ->will($this->returnValue(
                [
                    TEST_FILES_PATH . 'source_with_ignore.php' => [
                        2 => 1,
                        4 => -1,
                        6 => -1,
                        7 => 1
                    ]
                ]
            ));

        return $stub;
    }

    protected function getCoverageForClassWithAnonymousFunction()
    {
        $filter = new Filter;
        $filter->addFileToWhitelist(TEST_FILES_PATH . 'source_with_class_and_anonymous_function.php');

        $coverage = new CodeCoverage(
            $this->setUpXdebugStubForClassWithAnonymousFunction(),
            $filter
        );

        $coverage->start('ClassWithAnonymousFunction', true);
        $coverage->stop();

        return $coverage;
    }

    protected function setUpXdebugStubForClassWithAnonymousFunction()
    {
        $stub = $this->createMock(Xdebug::class);

        $stub->expects($this->any())
            ->method('stop')
            ->will($this->returnValue(
                [
                    TEST_FILES_PATH . 'source_with_class_and_anonymous_function.php' => [
                        7  => 1,
                        9  => 1,
                        10 => -1,
                        11 => 1,
                        12 => 1,
                        13 => 1,
                        14 => 1,
                        17 => 1,
                        18 => 1
                    ]
                ]
            ));

        return $stub;
    }
}
