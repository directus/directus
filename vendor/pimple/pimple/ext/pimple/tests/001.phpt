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

$p[54.2] = 'foo2';
echo $p[54];
echo "\n";
$p[242.99] = 'foo99';
echo $p[242];

echo "\n";

$p[5] = 'bar';
$p[5] = 'baz';
echo $p[5];

echo "\n";

$p['str'] = 'str';
$p['str'] = 'strstr';
echo $p['str'];
?>

--EXPECTF--
foo
42
foo2
foo99
baz
strstr