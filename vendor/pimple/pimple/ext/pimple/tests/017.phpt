--TEST--
Test extend() with exception in service extension
--SKIPIF--
<?php if (!extension_loaded("pimple")) print "skip"; ?>
--FILE--
<?php

$p = new Pimple\Container();
$p[12] = function ($v) { return 'foo';};

$c = $p->extend(12, function ($w) { throw new BadMethodCallException; });

try {
	$p[12];
	echo "Exception expected";
} catch (BadMethodCallException $e) { }
--EXPECTF--
