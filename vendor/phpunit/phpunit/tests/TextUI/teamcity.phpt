--TEST--
phpunit --teamcity BankAccountTest ../_files/BankAccountTest.php
--FILE--
<?php
$_SERVER['argv'][1] = '--no-configuration';
$_SERVER['argv'][2] = '--teamcity';
$_SERVER['argv'][3] = 'BankAccountTest';
$_SERVER['argv'][4] = __DIR__ . '/../_files/BankAccountTest.php';

require __DIR__ . '/../bootstrap.php';
PHPUnit_TextUI_Command::main();
--EXPECTF--
PHPUnit %s by Sebastian Bergmann and contributors.


##teamcity[testCount count='3' flowId='%d']

##teamcity[testSuiteStarted name='BankAccountTest' locationHint='php_qn://%s/tests/_files/BankAccountTest.php::\BankAccountTest' flowId='%d']

##teamcity[testStarted name='testBalanceIsInitiallyZero' locationHint='php_qn://%s/tests/_files/BankAccountTest.php::\BankAccountTest::testBalanceIsInitiallyZero' flowId='%d']

##teamcity[testFinished name='testBalanceIsInitiallyZero' duration='%s' flowId='%d']

##teamcity[testStarted name='testBalanceCannotBecomeNegative' locationHint='php_qn://%s/tests/_files/BankAccountTest.php::\BankAccountTest::testBalanceCannotBecomeNegative' flowId='%d']

##teamcity[testFinished name='testBalanceCannotBecomeNegative' duration='%s' flowId='%d']

##teamcity[testStarted name='testBalanceCannotBecomeNegative2' locationHint='php_qn://%s/tests/_files/BankAccountTest.php::\BankAccountTest::testBalanceCannotBecomeNegative2' flowId='%d']

##teamcity[testFinished name='testBalanceCannotBecomeNegative2' duration='%s' flowId='%d']

##teamcity[testSuiteFinished name='BankAccountTest' flowId='%d']


Time: %s, Memory: %s

OK (3 tests, 3 assertions)
