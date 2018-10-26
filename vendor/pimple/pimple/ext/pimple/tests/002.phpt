--TEST--
Test for constructor
--SKIPIF--
<?php if (!extension_loaded("pimple")) print "skip"; ?>
--FILE--
<?php 
$p = new Pimple\Container();
var_dump($p[42]);

$p = new Pimple\Container(array(42=>'foo'));
var_dump($p[42]);
?>
--EXPECT--
NULL
string(3) "foo"
