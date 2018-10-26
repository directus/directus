--TEST--
Test simple class inheritance
--SKIPIF--
<?php if (!extension_loaded("pimple")) print "skip"; ?>
--FILE--
<?php 
class MyPimple extends Pimple\Container
{
	public $someAttr = 'fooAttr';

    public function offsetget($o)
    {
        var_dump("hit");
        return parent::offsetget($o);
    }
}

$p = new MyPimple;
$p[42] = 'foo';
echo $p[42];
echo "\n";
echo $p->someAttr;
?>
--EXPECT--
string(3) "hit"
foo
fooAttr