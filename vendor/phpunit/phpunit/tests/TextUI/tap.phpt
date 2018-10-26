--TEST--
phpunit --tap BankAccountTest ../_files/BankAccountTest.php
--FILE--
<?php
$_SERVER['argv'][1] = '--no-configuration';
$_SERVER['argv'][2] = '--tap';
$_SERVER['argv'][3] = 'BankAccountTest';
$_SERVER['argv'][4] = __DIR__ . '/../_files/BankAccountTest.php';

require __DIR__ . '/../bootstrap.php';
PHPUnit_TextUI_Command::main();
--EXPECTF--
TAP version 13
ok 1 - BankAccountTest::testBalanceIsInitiallyZero
ok 2 - BankAccountTest::testBalanceCannotBecomeNegative
ok 3 - BankAccountTest::testBalanceCannotBecomeNegative2
1..3
