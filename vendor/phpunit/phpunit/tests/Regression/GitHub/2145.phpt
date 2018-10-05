--TEST--
--stop-on-failure fails to stop on PHP 7
--FILE--
<?php

$_SERVER['argv'][1] = '--no-configuration';
$_SERVER['argv'][2] = 'Issue2145Test';
$_SERVER['argv'][3] = '--stop-on-error';
$_SERVER['argv'][4] = __DIR__ . '/2145/Issue2145Test.php';

require __DIR__ . '/../../bootstrap.php';
PHPUnit_TextUI_Command::main();
?>
--EXPECTF--
PHPUnit %s by Sebastian Bergmann and contributors.

E

Time: %s, Memory: %s

There was 1 error:

1) Issue2145Test
%A
ERRORS!
Tests: 2, Assertions: 0, Errors: 1.
