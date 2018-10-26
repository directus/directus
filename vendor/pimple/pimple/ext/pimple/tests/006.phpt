--TEST--
Test complex class inheritance
--SKIPIF--
<?php if (!extension_loaded("pimple")) print "skip"; ?>
--FILE--
<?php 
class MyPimple extends Pimple\Container
{
    public function offsetget($o)
    {
        var_dump("hit offsetget in " . __CLASS__);
        return parent::offsetget($o);
    }
}

class TestPimple extends MyPimple
{
    public function __construct($values)
    {
        array_shift($values);
        parent::__construct($values);
    }
    
    public function offsetget($o)
    {
        var_dump('hit offsetget in ' . __CLASS__);
        return parent::offsetget($o);
    }
    
    public function offsetset($o, $v)
    {
        var_dump('hit offsetset');
        return parent::offsetset($o, $v);
    }
}

$defaultValues = array('foo' => 'bar', 88 => 'baz');

$p = new TestPimple($defaultValues);
$p[42] = 'foo';
var_dump($p[42]);
var_dump($p[0]);
?>
--EXPECT--
string(13) "hit offsetset"
string(27) "hit offsetget in TestPimple"
string(25) "hit offsetget in MyPimple"
string(3) "foo"
string(27) "hit offsetget in TestPimple"
string(25) "hit offsetget in MyPimple"
string(3) "baz"