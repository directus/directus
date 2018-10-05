--TEST--
Test frozen services
--SKIPIF--
<?php if (!extension_loaded("pimple")) print "skip"; ?>
--FILE--
<?php 
$p = new Pimple\Container();
$p[42] = 'foo';
$p[42] = 'bar';

$p['foo'] = function () { };
$p['foo'] = function () { };

$a = $p['foo'];

try {
	$p['foo'] = function () { };
	echo "Exception excpected";
} catch (RuntimeException $e) { }

$p[42] = function() { };
$a = $p[42];

try {
	$p[42] = function () { };
	echo "Exception excpected";
} catch (RuntimeException $e) { }
?>
--EXPECTF--
