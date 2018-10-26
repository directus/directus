--TEST--
GH-873: PHPUnit suppresses exceptions thrown outside of test case function
--SKIPIF--
<?php
if (PHP_MAJOR_VERSION > 5) {
    print 'skip: PHP 5 is required';
}
?>
--FILE--
<?php
$_SERVER['argv'][1] = '--no-configuration';
$_SERVER['argv'][2] = 'Issue873Test';
$_SERVER['argv'][3] = __DIR__ . '/873/Issue873Test.php';

require __DIR__ . '/../../bootstrap.php';
PHPUnit_TextUI_Command::main();
?>
--EXPECTF--

Fatal error: Uncaught exception 'Exception' with message 'PHPUnit suppresses exceptions thrown outside of test case function' in %s:%i
Stack trace:
%a
