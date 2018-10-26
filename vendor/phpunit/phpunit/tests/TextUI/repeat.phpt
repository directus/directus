--TEST--
phpunit --repeat 3 BankAccountTest ../_files/BankAccountTest.php
--FILE--
<?php
$_SERVER['argv'][1] = '--no-configuration';
$_SERVER['argv'][2] = '--repeat';
$_SERVER['argv'][3] = '3';
$_SERVER['argv'][4] = 'BankAccountTest';
$_SERVER['argv'][5] = __DIR__ . '/../_files/BankAccountTest.php';

require __DIR__ . '/../bootstrap.php';
PHPUnit_TextUI_Command::main();
--EXPECTF--
PHPUnit %s by Sebastian Bergmann and contributors.

.........                                                           9 / 9 (100%)

Time: %s, Memory: %s

OK (9 tests, 9 assertions)
