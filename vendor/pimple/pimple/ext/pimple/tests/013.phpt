--TEST--
Test keys()
--SKIPIF--
<?php if (!extension_loaded("pimple")) print "skip"; ?>
--FILE--
<?php

$p = new Pimple\Container();

var_dump($p->keys());

$p['foo'] = 'bar';
$p[] = 'foo';

var_dump($p->keys());

unset($p['foo']);

var_dump($p->keys());
?>
--EXPECTF--
array(0) {
}
array(2) {
  [0]=>
  string(3) "foo"
  [1]=>
  int(0)
}
array(1) {
  [0]=>
  int(0)
}