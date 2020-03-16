--TEST--
Test service is called as callback, and only once
--SKIPIF--
<?php if (!extension_loaded("pimple")) print "skip"; ?>
--FILE--
<?php 
$p = new Pimple\Container();
$p['foo'] = function($arg) use ($p) { var_dump($p === $arg); };
$a = $p['foo'];
$b = $p['foo']; /* should return not calling the callback */
?>
--EXPECTF--
bool(true)