--TEST--
PHPT runner supports XFAIL section
--FILE--
<?php
$_SERVER['argv'][1] = '--no-configuration';
$_SERVER['argv'][2] = __DIR__ . '/../_files/phpt-xfail.phpt';

require __DIR__ . '/../bootstrap.php';
PHPUnit_TextUI_Command::main();
--EXPECTF--
PHPUnit %s by Sebastian Bergmann and contributors.

I                                                                   1 / 1 (100%)

Time: %s, Memory: %s

OK, but incomplete, skipped, or risky tests!
Tests: 1, Assertions: 1, Incomplete: 1.