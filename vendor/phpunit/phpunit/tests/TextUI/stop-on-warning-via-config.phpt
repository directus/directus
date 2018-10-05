--TEST--
phpunit -c ../_files/configuration_stop_on_warning.xml --stop-on-warning StopOnWarningTestSuite ./tests/_files/StopOnWarningTestSuite.php
--FILE--
<?php
$_SERVER['argv'][1] = '-c';
$_SERVER['argv'][2] = __DIR__ . '/../_files/configuration_stop_on_warning.xml';
$_SERVER['argv'][3] = '--stop-on-warning';
$_SERVER['argv'][4] = 'StopOnWarningTestSuite';
$_SERVER['argv'][5] = __DIR__ . '/../_files/StopOnWarningTestSuite.php';

require __DIR__ . '/../bootstrap.php';
PHPUnit_TextUI_Command::main();
--EXPECTF--
PHPUnit %s by Sebastian Bergmann and contributors.

W

Time: %s, Memory: %s

There was 1 warning:

1) Warning
No tests found in class "NoTestCases".

WARNINGS!
Tests: 1, Assertions: 0, Warnings: 1.