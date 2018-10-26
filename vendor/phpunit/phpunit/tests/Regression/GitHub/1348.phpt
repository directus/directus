--TEST--
https://github.com/sebastianbergmann/phpunit/issues/1348
--SKIPIF--
<?php
if (defined('HHVM_VERSION')) {
    print 'skip: PHP runtime required';
}
?>
--FILE--
<?php
$_SERVER['argv'][1] = '--no-configuration';
$_SERVER['argv'][]  = '--report-useless-tests';
$_SERVER['argv'][]  = '--process-isolation';
$_SERVER['argv'][]  = 'Issue1348Test';
$_SERVER['argv'][]  = __DIR__ . '/1348/Issue1348Test.php';

require __DIR__ . '/../../bootstrap.php';
PHPUnit_TextUI_Command::main();
--EXPECTF--
PHPUnit %s by Sebastian Bergmann and contributors.

.
STDOUT does not break test result
E                                                                  2 / 2 (100%)

Time: %s, Memory: %s

There was 1 error:

1) Issue1348Test::testSTDERR
PHPUnit_Framework_Exception: STDERR works as usual.

ERRORS!
Tests: 2, Assertions: 1, Errors: 1.
