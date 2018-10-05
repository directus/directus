--TEST--
phpunit --report-useless-tests NothingTest ../_files/NothingTest.php
--FILE--
<?php
$_SERVER['argv'][1] = '--no-configuration';
$_SERVER['argv'][2] = '--report-useless-tests';
$_SERVER['argv'][3] = '--verbose';
$_SERVER['argv'][4] = 'NothingTest';
$_SERVER['argv'][5] = __DIR__ . '/../_files/NothingTest.php';

require __DIR__ . '/../bootstrap.php';
PHPUnit_TextUI_Command::main();
--EXPECTF--
PHPUnit %s by Sebastian Bergmann and contributors.

Runtime:       %s

R                                                                   1 / 1 (100%)

Time: %s, Memory: %s

There was 1 risky test:

1) NothingTest::testNothing
This test did not perform any assertions

OK, but incomplete, skipped, or risky tests!
Tests: 1, Assertions: 0, Risky: 1.
