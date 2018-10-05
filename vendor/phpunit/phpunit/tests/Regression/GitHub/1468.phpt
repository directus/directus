--TEST--
https://github.com/sebastianbergmann/phpunit/issues/1468
--FILE--
<?php
$_SERVER['argv'][1] = '--no-configuration';
$_SERVER['argv'][2] = '--disallow-todo-tests';
$_SERVER['argv'][3] = 'Issue1468Test';
$_SERVER['argv'][4] = __DIR__ . '/1468/Issue1468Test.php';

require __DIR__ . '/../../bootstrap.php';
PHPUnit_TextUI_Command::main();
--EXPECTF--
PHPUnit %s by Sebastian Bergmann and contributors.

I                                                                   1 / 1 (100%)

Time: %s, Memory: %s

OK, but incomplete, skipped, or risky tests!
Tests: 1, Assertions: 0, Incomplete: 1.
