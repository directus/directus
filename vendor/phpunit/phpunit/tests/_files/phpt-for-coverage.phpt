--TEST--
PHPT for testing coverage
--FILE--
<?php
require __DIR__ . '/../bootstrap.php';
$coveredClass = new CoveredClass();
$coveredClass->publicMethod();
--EXPECT--
