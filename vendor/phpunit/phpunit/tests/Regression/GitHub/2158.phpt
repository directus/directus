--TEST--
#2158: Failure to run tests in separate processes if a file included into main process contains constant definition
--FILE--
<?php
$_SERVER['argv'][1] = '--no-configuration';
$_SERVER['argv'][2] = 'Issue2158Test';
$_SERVER['argv'][3] = __DIR__ . '/2158/Issue2158Test.php';

require __DIR__ . '/../../bootstrap.php';
PHPUnit_TextUI_Command::main();
?>
--EXPECTF--
PHPUnit %s by Sebastian Bergmann and contributors.

..                                                                  2 / 2 (100%)

Time: %s, Memory: %s

OK (2 tests, 2 assertions)
