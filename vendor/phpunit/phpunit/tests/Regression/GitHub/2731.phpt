--TEST--
GH-2731: Empty exception message cannot be expected
--FILE--
<?php
$_SERVER['argv'][1] = '--no-configuration';
$_SERVER['argv'][2] = 'Issue2731Test';
$_SERVER['argv'][3] = __DIR__ . '/2731/Issue2731Test.php';

require __DIR__ . '/../../bootstrap.php';

PHPUnit_TextUI_Command::main();
?>
--EXPECTF--
PHPUnit %s by Sebastian Bergmann and contributors.

F                                                                   1 / 1 (100%)

Time: %s, Memory: %s

There was 1 failure:

1) Issue2731Test::testOne
Failed asserting that exception message is empty but is 'message'.

FAILURES!
Tests: 1, Assertions: 2, Failures: 1.
