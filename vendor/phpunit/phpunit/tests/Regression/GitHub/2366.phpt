--TEST--
#2366: Using a test double from a data provider only works once
--FILE--
<?php
$_SERVER['argv'][1] = '--no-configuration';
$_SERVER['argv'][2] = 'Issue2366Test';
$_SERVER['argv'][3] = __DIR__ . '/2366/Issue2366Test.php';

require __DIR__ . '/../../bootstrap.php';
PHPUnit_TextUI_Command::main();
?>
--EXPECTF--
PHPUnit %s by Sebastian Bergmann and contributors.

..                                                                  2 / 2 (100%)

Time: %s, Memory: %s

OK (2 tests, 2 assertions)
