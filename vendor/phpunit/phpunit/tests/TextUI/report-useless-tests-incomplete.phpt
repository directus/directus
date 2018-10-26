--TEST--
phpunit --report-useless-tests IncompleteTest ../_files/IncompleteTest.php
--FILE--
<?php
$_SERVER['argv'][1] = '--no-configuration';
$_SERVER['argv'][2] = '--report-useless-tests';
$_SERVER['argv'][3] = 'IncompleteTest';
$_SERVER['argv'][4] = __DIR__ . '/../_files/IncompleteTest.php';

require __DIR__ . '/../bootstrap.php';
PHPUnit_TextUI_Command::main();
--EXPECTF--
PHPUnit %s by Sebastian Bergmann and contributors.

I                                                                   1 / 1 (100%)

Time: %s, Memory: %s

OK, but incomplete, skipped, or risky tests!
Tests: 1, Assertions: 0, Incomplete: 1.
