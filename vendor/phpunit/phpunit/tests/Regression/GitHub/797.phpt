--TEST--
GH-797: Disabled $preserveGlobalState does not load bootstrap.php.
--FILE--
<?php

$_SERVER['argv'][1] = '--no-configuration';
$_SERVER['argv'][]  = '--process-isolation';
$_SERVER['argv'][]  = '--bootstrap';
$_SERVER['argv'][]  = __DIR__ . '/797/bootstrap797.php';
$_SERVER['argv'][]  = __DIR__ . '/797/Issue797Test.php';

require __DIR__ . '/../../bootstrap.php';
PHPUnit_TextUI_Command::main();
?>
--EXPECTF--
PHPUnit %s by Sebastian Bergmann and contributors.

.                                                                   1 / 1 (100%)

Time: %s, Memory: %s

OK (1 test, 1 assertion)
