--TEST--
Test has/unset dim handlers
--SKIPIF--
<?php if (!extension_loaded("pimple")) print "skip"; ?>
--FILE--
<?php 
$p = new Pimple\Container();
$p[] = 42;
var_dump($p[0]);
unset($p[0]);
var_dump($p[0]);
$p['foo'] = 'bar';
var_dump(isset($p['foo']));
unset($p['foo']);
try {
	var_dump($p['foo']);
	echo "Excpected exception";
} catch (InvalidArgumentException $e) { }
var_dump(isset($p['bar']));
$p['bar'] = NULL;
var_dump(isset($p['bar']));
var_dump(empty($p['bar']));
?>
--EXPECT--
int(42)
NULL
bool(true)
bool(false)
bool(true)
bool(true)