--TEST--
phpunit --testdox-text php://stdout --testdox-exclude-group one TestDoxGroupTest ../_files/TestDoxGroupTest.php
--FILE--
<?php
$_SERVER['argv'][1] = '--no-configuration';
$_SERVER['argv'][2] = '--testdox-text';
$_SERVER['argv'][3] = 'php://stdout';
$_SERVER['argv'][4] = '--testdox-exclude-group';
$_SERVER['argv'][5] = 'one';
$_SERVER['argv'][6] = 'TestDoxGroupTest';
$_SERVER['argv'][7] = __DIR__ . '/../_files/TestDoxGroupTest.php';

require __DIR__ . '/../bootstrap.php';
PHPUnit_TextUI_Command::main();
--EXPECTF--
PHPUnit %s by Sebastian Bergmann and contributors.

.DoxGroup
.                                                                  2 / 2 (100%) [x] Two



Time: %s, Memory: %s

OK (2 tests, 0 assertions)
