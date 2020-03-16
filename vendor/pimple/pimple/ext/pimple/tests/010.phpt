--TEST--
Test service is called as callback for every callback type
--SKIPIF--
<?php if (!extension_loaded("pimple")) print "skip"; ?>
--FILE--
<?php
function callme()
{
    return 'called';
}

$a = function() { return 'called'; };

class Foo
{
    public static function bar()
    {
        return 'called';
    }
}
 
$p = new Pimple\Container();
$p['foo'] = 'callme';
echo $p['foo'] . "\n";

$p['bar'] = $a;
echo $p['bar'] . "\n";

$p['baz'] = "Foo::bar";
echo $p['baz'] . "\n";

$p['foobar'] = array('Foo', 'bar');
var_dump($p['foobar']);

?>
--EXPECTF--
callme
called
Foo::bar
array(2) {
  [0]=>
  string(3) "Foo"
  [1]=>
  string(3) "bar"
}