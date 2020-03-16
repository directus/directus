--TEST--
Test empty dimensions
--SKIPIF--
<?php if (!extension_loaded("pimple")) print "skip"; ?>
--FILE--
<?php 
$p = new Pimple\Container();
$p[] = 42;
var_dump($p[0]);
$p[41] = 'foo';
$p[] = 'bar';
var_dump($p[42]);
?>
--EXPECT--
int(42)
string(3) "bar"