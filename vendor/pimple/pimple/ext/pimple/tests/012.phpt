--TEST--
Test service factory
--SKIPIF--
<?php if (!extension_loaded("pimple")) print "skip"; ?>
--FILE--
<?php

$p = new Pimple\Container();

$p->factory($f = function() { var_dump('called-1'); return 'ret-1';});

$p[] = $f;

$p[] = function () { var_dump('called-2'); return 'ret-2'; };

var_dump($p[0]);
var_dump($p[0]);
var_dump($p[1]);
var_dump($p[1]);
?>
--EXPECTF--
string(8) "called-1"
string(5) "ret-1"
string(8) "called-1"
string(5) "ret-1"
string(8) "called-2"
string(5) "ret-2"
string(5) "ret-2"