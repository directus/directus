--TEST--
GH-2811: expectExceptionMessage() does not work without expectException()
--FILE--
<?php
$_SERVER['argv'][1] = '--no-configuration';
$_SERVER['argv'][2] = 'Issue2811Test';
$_SERVER['argv'][3] = __DIR__ . '/2811/Issue2811Test.php';

require __DIR__ . '/../../bootstrap.php';

PHPUnit_TextUI_Command::main();
?>
--EXPECTF--
PHPUnit %s by Sebastian Bergmann and contributors.

.                                                                   1 / 1 (100%)

Time: %s, Memory: %s

OK (1 test, 2 assertions)
