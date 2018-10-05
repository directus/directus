--TEST--
phpunit DataProviderTestDoxTest ../_files/DataProviderTestDoxTest.php
--FILE--
<?php
$_SERVER['argv'][1] = '--no-configuration';
$_SERVER['argv'][2] = '--testdox';
$_SERVER['argv'][3] = 'DataProviderTestDoxTest';
$_SERVER['argv'][4] = __DIR__ . '/../_files/DataProviderTestDoxTest.php';

require __DIR__ . '/../bootstrap.php';
PHPUnit_TextUI_Command::main();
--EXPECTF--
PHPUnit %s by Sebastian Bergmann and contributors.

DataProviderTestDox
 [x] Does something with one
 [x] Does something with two
 [x] Does something else with one
 [x] Does something else with two
