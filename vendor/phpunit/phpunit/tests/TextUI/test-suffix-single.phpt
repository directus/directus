--TEST--
phpunit --test-suffix .test.php ../_files/
--FILE--
<?php
$_SERVER['argv'][1] = '--no-configuration';
$_SERVER['argv'][2] = '--test-suffix';
$_SERVER['argv'][3] = '.test.php';
$_SERVER['argv'][4] = __DIR__ . '/../_files/';

require __DIR__ . '/../bootstrap.php';
PHPUnit_TextUI_Command::main();
--EXPECTF--
PHPUnit %s by Sebastian Bergmann and contributors.

...                                                                 3 / 3 (100%)

Time: %s, Memory: %s

OK (3 tests, 3 assertions)
