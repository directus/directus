--TEST--
https://github.com/sebastianbergmann/phpunit/issues/1570
--FILE--
<?php
$_SERVER['argv'][1] = '--no-configuration';
$_SERVER['argv'][2] = '--disallow-test-output';
$_SERVER['argv'][3] = 'Issue1570Test';
$_SERVER['argv'][4] = __DIR__ . '/1570/Issue1570Test.php';

require __DIR__ . '/../../bootstrap.php';
PHPUnit_TextUI_Command::main();
--EXPECTF--
PHPUnit %s by Sebastian Bergmann and contributors.

R                                                                   1 / 1 (100%)*

Time: %s, Memory: %s

OK, but incomplete, skipped, or risky tests!
Tests: 1, Assertions: 0, Risky: 1.
