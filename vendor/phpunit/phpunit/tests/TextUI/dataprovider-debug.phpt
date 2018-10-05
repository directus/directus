--TEST--
phpunit --debug DataProviderDebugTest ../_files/DataProviderDebugTest.php
--FILE--
<?php
$_SERVER['argv'][1] = '--no-configuration';
$_SERVER['argv'][2] = '--debug';
$_SERVER['argv'][3] = 'DataProviderDebugTest';
$_SERVER['argv'][4] = __DIR__ . '/../_files/DataProviderDebugTest.php';

require __DIR__ . '/../bootstrap.php';
PHPUnit_TextUI_Command::main();
--EXPECTF--
PHPUnit %s by Sebastian Bergmann and contributors.


Starting test 'DataProviderDebugTest::testProvider with data set #0 (null, true, 1, 1.0)'.
.
Starting test 'DataProviderDebugTest::testProvider with data set #1 (1.2, resource(%d) of type (stream), '1')'.
.
Starting test 'DataProviderDebugTest::testProvider with data set #2 (array(array(1, 2, 3), array(3, 4, 5)))'.
.
Starting test 'DataProviderDebugTest::testProvider with data set #3 ('this\nis\na\nvery\nvery\nvery\nvery...g\ntext')'.
.
Starting test 'DataProviderDebugTest::testProvider with data set #4 (stdClass Object (), stdClass Object (...), array(), SplObjectStorage Object (...), stdClass Object (...))'.
.
Starting test 'DataProviderDebugTest::testProvider with data set #5 (Binary String: 0x000102030405, Binary String: 0x0e0f101112131...c1d1e1f)'.
.
Starting test 'DataProviderDebugTest::testProvider with data set #6 (Binary String: 0x0009)'.
.                                                             7 / 7 (100%)

Time: %s, Memory: %s

OK (7 tests, 7 assertions)
