--TEST--
https://github.com/sebastianbergmann/phpunit/issues/1351
--SKIPIF--
<?php
if (!extension_loaded('pdo') || !in_array('sqlite', PDO::getAvailableDrivers())) {
    print 'skip: PDO_SQLITE is required';
}
?>
--FILE--
<?php
$_SERVER['argv'][1] = '--no-configuration';
$_SERVER['argv'][2] = '--process-isolation';
$_SERVER['argv'][3] = 'Issue1351Test';
$_SERVER['argv'][4] = __DIR__ . '/1351/Issue1351Test.php';

require __DIR__ . '/../../bootstrap.php';
PHPUnit_TextUI_Command::main();
--EXPECTF--
PHPUnit %s by Sebastian Bergmann and contributors.

F.E.E                                                               5 / 5 (100%)

Time: %s, Memory: %s

There were 2 errors:

1) Issue1351Test::testExceptionPre
RuntimeException: Expected rethrown exception.
%A
Caused by
LogicException: Expected exception.
%A

2) Issue1351Test::testPhpCoreLanguageException
PDOException: SQLSTATE[HY000]: General error: 1 no such table: php_wtf
%A

--

There was 1 failure:

1) Issue1351Test::testFailurePre
Expected failure.
%A
ERRORS!
Tests: 5, Assertions: 5, Errors: 2, Failures: 1.
