--TEST--
phpunit --exclude-group=foo ../_files/DataProviderIssue2922
--FILE--
<?php
$_SERVER['argv'][1] = '--no-configuration';
$_SERVER['argv'][2] = '--exclude-group=foo';
$_SERVER['argv'][3] = __DIR__ . '/../_files/DataProviderIssue2922';

require __DIR__ . '/../bootstrap.php';
PHPUnit_TextUI_Command::main();
--EXPECTF--
PHPUnit %s by Sebastian Bergmann and contributors.

.                                                                   1 / 1 (100%)

Time: %s, Memory: %s

OK (1 test, 1 assertion)
