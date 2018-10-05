--TEST--
phpunit --verbose ClonedDependencyTest ../_files/ClonedDependencyTest.php
--FILE--
<?php
$_SERVER['argv'][1] = '--no-configuration';
$_SERVER['argv'][2] = '--verbose';
$_SERVER['argv'][3] = 'ClonedDependencyTest';
$_SERVER['argv'][4] = __DIR__ . '/../_files/ClonedDependencyTest.php';

require __DIR__ . '/../bootstrap.php';
PHPUnit_TextUI_Command::main();
--EXPECTF--
PHPUnit %s by Sebastian Bergmann and contributors.

Runtime:       %s

....                                                                4 / 4 (100%)

Time: %s, Memory: %s

OK (4 tests, 3 assertions)

