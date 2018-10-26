--TEST--
Test for read_dim/write_dim handlers
--SKIPIF--
<?php if (!extension_loaded("pimple")) print "skip"; ?>
--FILE--
<?php 
$p = new Pimple\Container();
$p[42] = 'foo';
$p['foo'] = 42;

echo $p[42];
echo "\n";
echo $p['foo'];
echo "\n";
try {
	var_dump($p['nonexistant']);
	echo "Exception excpected";
} catch (InvalidArgumentException $e) { }
?>
--EXPECTF--
foo
42