--TEST--
#2137: Error message for invalid dataprovider
--FILE--
<?php
$_SERVER['argv'][1] = '--no-configuration';
$_SERVER['argv'][2] = 'Issue2137Test';
$_SERVER['argv'][3] = __DIR__ . '/2137/Issue2137Test.php';
$_SERVER['argv'][4] = '--filter';
$_SERVER['argv'][5] = 'BrandService';

require __DIR__ . '/../../bootstrap.php';
PHPUnit_TextUI_Command::main();
?>
--EXPECTF--
PHPUnit %s by Sebastian Bergmann and contributors.

W                                                                   1 / 1 (100%)

Time: %s, Memory: %s

There was 1 warning:

1) Warning
The data provider specified for Issue2137Test::testBrandService is invalid.
Data set #0 is invalid.

WARNINGS!
Tests: 1, Assertions: 0, Warnings: 1.
