--TEST--
Test raw()
--SKIPIF--
<?php if (!extension_loaded("pimple")) print "skip"; ?>
--FILE--
<?php

$p = new Pimple\Container();
$f = function () { var_dump('called-2'); return 'ret-2'; };

$p['foo'] = $f;
$p[42]    = $f;

var_dump($p['foo']);
var_dump($p->raw('foo'));
var_dump($p[42]);

unset($p['foo']);

try {
	$p->raw('foo');
	echo "expected exception";
} catch (InvalidArgumentException $e) { }
--EXPECTF--
string(8) "called-2"
string(5) "ret-2"
object(Closure)#%i (0) {
}
string(8) "called-2"
string(5) "ret-2"