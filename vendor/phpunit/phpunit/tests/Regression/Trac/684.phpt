--TEST--
#684: Unable to find test class when no test methods exists
--FILE--
<?php
$_SERVER['argv'][1] = '--no-configuration';
$_SERVER['argv'][2] = 'Issue684Test';
$_SERVER['argv'][3] = __DIR__ . '/684/Issue684Test.php';

require __DIR__ . '/../../bootstrap.php';
PHPUnit_TextUI_Command::main();
?>
--EXPECTF--
PHPUnit %s by Sebastian Bergmann and contributors.

W                                                                   1 / 1 (100%)

Time: %s, Memory: %s

There was 1 warning:

1) Warning
No tests found in class "Foo_Bar_Issue684Test".

WARNINGS!
Tests: 1, Assertions: 0, Warnings: 1.
