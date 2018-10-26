--TEST--
phpunit ExceptionStackTest ../_files/ExceptionStackTest.php
--FILE--
<?php
$_SERVER['argv'][1] = '--no-configuration';
$_SERVER['argv'][2] = 'ExceptionStackTest';
$_SERVER['argv'][3] = __DIR__ . '/../_files/ExceptionStackTest.php';

require __DIR__ . '/../bootstrap.php';
PHPUnit_TextUI_Command::main();
--EXPECTF--
PHPUnit %s by Sebastian Bergmann and contributors.

EE                                                                  2 / 2 (100%)

Time: %s, Memory: %s

There were 2 errors:

1) ExceptionStackTest::testPrintingChildException
PHPUnit_Framework_Exception: Child exception
message
Failed asserting that two arrays are equal.
--- Expected
+++ Actual
@@ @@
 Array (
-    0 => 1
+    0 => 2
 )


%s:%i

Caused by
message
Failed asserting that two arrays are equal.
--- Expected
+++ Actual
@@ @@
 Array (
-    0 => 1
+    0 => 2
 )

%s:%i

2) ExceptionStackTest::testNestedExceptions
Exception: One

%s:%i

Caused by
InvalidArgumentException: Two

%s:%i

Caused by
Exception: Three

%s:%i

ERRORS!
Tests: 2, Assertions: 1, Errors: 2.
