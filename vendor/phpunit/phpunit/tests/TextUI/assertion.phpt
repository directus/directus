--TEST--
phpunit AssertionExampleTest ../_files/AssertionExampleTest.php
--SKIPIF--
<?php
if (PHP_MAJOR_VERSION < 7) {
    print 'skip: PHP 7 is required' . PHP_EOL;
}

if (ini_get('zend.assertions') != 1) {
    print 'skip: zend.assertions=1 is required' . PHP_EOL;
}

if (ini_get('assert.exception') != 1) {
    print 'skip: assert.exception=1 is required' . PHP_EOL;
}
--FILE--
<?php
$_SERVER['argv'][1] = '--no-configuration';
$_SERVER['argv'][2] = 'AssertionExampleTest';
$_SERVER['argv'][3] = __DIR__ . '/../_files/AssertionExampleTest.php';

require __DIR__ . '/../bootstrap.php';
PHPUnit_TextUI_Command::main();
?>
--EXPECTF--
PHPUnit %s by Sebastian Bergmann and contributors.

F                                                                   1 / 1 (100%)

Time: %s, Memory: %s

There was 1 failure:

1) AssertionExampleTest::testOne
assert(false) in %sAssertionExample.php:%d

FAILURES!
Tests: 1, Assertions: 1, Failures: 1.
