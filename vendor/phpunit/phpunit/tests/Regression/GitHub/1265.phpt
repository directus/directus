--TEST--
GH-1265: Could not use "PHPUnit_Runner_StandardTestSuiteLoader" as loader
--FILE--
<?php

$_SERVER['argv'][1] = '--configuration';
$_SERVER['argv'][2] = __DIR__ . '/1265/phpunit1265.xml';
$_SERVER['argv'][3] = 'Issue1265Test';
$_SERVER['argv'][4] = __DIR__ . '/1265/Issue1265Test.php';

require __DIR__ . '/../../bootstrap.php';
PHPUnit_TextUI_Command::main();
?>
--EXPECTF--
PHPUnit %s by Sebastian Bergmann and contributors.

.                                                                   1 / 1 (100%)

Time: %s, Memory: %s

OK (1 test, 1 assertion)
