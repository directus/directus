--TEST--
GH-765: Fatal error triggered in PHPUnit when exception is thrown in data provider of a test with a dependency
--FILE--
<?php

$_SERVER['argv'][1] = '--no-configuration';
$_SERVER['argv'][2] = 'Issue765Test';
$_SERVER['argv'][3] = __DIR__ . '/765/Issue765Test.php';

require __DIR__ . '/../../bootstrap.php';
PHPUnit_TextUI_Command::main();
?>
--EXPECTF--
PHPUnit %s by Sebastian Bergmann and contributors.

.W                                                                  2 / 2 (100%)

Time: %s, Memory: %s

There was 1 warning:

1) Warning
The data provider specified for Issue765Test::testDependent is invalid.

WARNINGS!
Tests: 2, Assertions: 1, Warnings: 1.
