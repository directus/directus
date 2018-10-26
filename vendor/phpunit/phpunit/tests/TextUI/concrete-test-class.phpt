--TEST--
phpunit ConcreteTest ../_files/ConcreteTest.php
--FILE--
<?php
$_SERVER['argv'][1] = '--no-configuration';
$_SERVER['argv'][2] = 'ConcreteTest';
$_SERVER['argv'][3] = __DIR__ . '/../_files/ConcreteTest.php';

require __DIR__ . '/../bootstrap.php';
PHPUnit_TextUI_Command::main();
--EXPECTF--
PHPUnit %s by Sebastian Bergmann and contributors.

..                                                                  2 / 2 (100%)

Time: %s, Memory: %s

OK (2 tests, 0 assertions)
