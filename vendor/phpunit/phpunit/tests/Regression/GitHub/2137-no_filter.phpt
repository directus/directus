--TEST--
#2137: Error message for invalid dataprovider
--FILE--
<?php
$_SERVER['argv'][1] = '--no-configuration';
$_SERVER['argv'][2] = 'Issue2137Test';
$_SERVER['argv'][3] = __DIR__ . '/2137/Issue2137Test.php';

require __DIR__ . '/../../bootstrap.php';
PHPUnit_TextUI_Command::main();
?>
--EXPECTF--
PHPUnit %s by Sebastian Bergmann and contributors.

WW                                                                  2 / 2 (100%)

Time: %s, Memory: %s

There were 2 warnings:

1) Warning
The data provider specified for Issue2137Test::testBrandService is invalid.
Data set #0 is invalid.

2) Warning
The data provider specified for Issue2137Test::testSomethingElseInvalid is invalid.
Data set #0 is invalid.

WARNINGS!
Tests: 2, Assertions: 0, Warnings: 2.
