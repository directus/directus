--TEST--
phpunit --verbose DependencyTestSuite ../_files/DependencyTestSuite.php
--FILE--
<?php
$_SERVER['argv'][1] = '--no-configuration';
$_SERVER['argv'][2] = '--verbose';
$_SERVER['argv'][3] = 'DependencyTestSuite';
$_SERVER['argv'][4] = __DIR__ . '/../_files/DependencyTestSuite.php';

require __DIR__ . '/../bootstrap.php';
PHPUnit_TextUI_Command::main();
--EXPECTF--
PHPUnit %s by Sebastian Bergmann and contributors.

Runtime:       %s

...FSSS                                                             7 / 7 (100%)

Time: %s, Memory: %s

There was 1 failure:

1) DependencyFailureTest::testOne

%s:%i

--

There were 3 skipped tests:

1) DependencyFailureTest::testTwo
This test depends on "DependencyFailureTest::testOne" to pass.

2) DependencyFailureTest::testThree
This test depends on "DependencyFailureTest::testTwo" to pass.

3) DependencyFailureTest::testFour
This test depends on "DependencyFailureTest::testOne" to pass.

FAILURES!
Tests: 7, Assertions: 0, Failures: 1, Skipped: 3.
