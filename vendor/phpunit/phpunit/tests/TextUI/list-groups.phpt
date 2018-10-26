--TEST--
phpunit --list-groups BankAccountTest ../_files/BankAccountTest.php
--FILE--
<?php
$_SERVER['argv'][1] = '--no-configuration';
$_SERVER['argv'][2] = '--list-groups';
$_SERVER['argv'][3] = 'BankAccountTest';
$_SERVER['argv'][4] = __DIR__ . '/../_files/BankAccountTest.php';

require __DIR__ . '/../bootstrap.php';
PHPUnit_TextUI_Command::main();
--EXPECTF--
PHPUnit %s by Sebastian Bergmann and contributors.

Available test group(s):
 - balanceCannotBecomeNegative
 - balanceIsInitiallyZero
 - specification
