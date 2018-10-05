--TEST--
GH-2758: TestCase::addToAssertionCount() no longer has effect when called from TestListener::endTest()
--FILE--
<?php
$_SERVER['argv'][1] = '--configuration';
$_SERVER['argv'][2] = __DIR__ . '/2758/phpunit.xml';
$_SERVER['argv'][3] = 'Issue2758Test';
$_SERVER['argv'][4] = __DIR__ . '/2758/Issue2758Test.php';

require __DIR__ . '/../../bootstrap.php';
require __DIR__ . '/2758/Issue2758TestListener.php';

PHPUnit_TextUI_Command::main();
?>
--EXPECTF--
PHPUnit %s by Sebastian Bergmann and contributors.

.                                                                   1 / 1 (100%)

Time: %s, Memory: %s

OK (1 test, 1 assertion)
