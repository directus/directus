--TEST--
phpunit --filter doesNotExist BankAccountTest ../_files/BankAccountTest.php
--FILE--
<?php
$_SERVER['argv'][1] = '--no-configuration';
$_SERVER['argv'][2] = '--filter';
$_SERVER['argv'][3] = 'doesNotExist';
$_SERVER['argv'][4] = 'BankAccountTest';
$_SERVER['argv'][5] = __DIR__ . '/../_files/BankAccountTest.php';

require __DIR__ . '/../bootstrap.php';
PHPUnit_TextUI_Command::main();
--EXPECTF--
PHPUnit %s by Sebastian Bergmann and contributors.



Time: %s, Memory: %s

No tests executed!
