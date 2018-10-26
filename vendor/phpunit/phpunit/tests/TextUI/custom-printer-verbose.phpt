--TEST--
phpunit -c ../_files/configuration.custom-printer.xml --verbose IncompleteTest ../_files/IncompleteTest.php
--FILE--
<?php
$_SERVER['argv'][1] = '-c';
$_SERVER['argv'][2] = __DIR__ . '/../_files/configuration.custom-printer.xml';
$_SERVER['argv'][3] = '--verbose';
$_SERVER['argv'][4] = 'IncompleteTest';
$_SERVER['argv'][5] = __DIR__ . '/../_files/IncompleteTest.php';

require __DIR__ . '/../bootstrap.php';
PHPUnit_TextUI_Command::main();
--EXPECTF--
PHPUnit %s by Sebastian Bergmann and contributors.

Runtime:       %s
Configuration: %sconfiguration.custom-printer.xml

I                                                                   1 / 1 (100%)

Time: %s, Memory: %s

There was 1 incomplete test:

1) IncompleteTest::testIncomplete
Test incomplete

%s

OK, but incomplete, skipped, or risky tests!
Tests: 1, Assertions: 0, Incomplete: 1.
