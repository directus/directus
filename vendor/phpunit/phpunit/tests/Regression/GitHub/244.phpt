--TEST--
GH-244: Expected Exception should support string codes
--FILE--
<?php
$_SERVER['argv'][1] = '--no-configuration';
$_SERVER['argv'][2] = '--process-isolation';
$_SERVER['argv'][3] = 'Issue244Test';
$_SERVER['argv'][4] = __DIR__ . '/244/Issue244Test.php';

require __DIR__ . '/../../bootstrap.php';
PHPUnit_TextUI_Command::main();
?>
--EXPECTF--
PHPUnit %s by Sebastian Bergmann and contributors.

.FFF                                                                4 / 4 (100%)

Time: %s, Memory: %s

There were 3 failures:

1) Issue244Test::testFails
Failed asserting that '123StringCode' is equal to expected exception code 'OtherString'.

2) Issue244Test::testFailsTooIfExpectationIsANumber
Failed asserting that '123StringCode' is equal to expected exception code 123.

3) Issue244Test::testFailsTooIfExceptionCodeIsANumber
Failed asserting that 123 is equal to expected exception code '123String'.

FAILURES!
Tests: 4, Assertions: 8, Failures: 3.
