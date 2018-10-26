--TEST--
Test extend() with exception in service factory
--SKIPIF--
<?php if (!extension_loaded("pimple")) print "skip"; ?>
--FILE--
<?php

$p = new Pimple\Container();
$p[12] = function ($v) { throw new BadMethodCallException; };

$c = $p->extend(12, function ($w) { return 'foobar'; });

try {
	$p[12];
	echo "Exception expected";
} catch (BadMethodCallException $e) { }
--EXPECTF--
