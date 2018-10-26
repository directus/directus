--TEST--
Test register() returns static and is a fluent interface
--SKIPIF--
<?php if (!extension_loaded("pimple")) print "skip"; ?>
--FILE--
<?php

class Foo implements Pimple\ServiceProviderInterface
{
    public function register(Pimple\Container $p)
    {
    }
}

$p = new Pimple\Container();
var_dump($p === $p->register(new Foo));
--EXPECTF--
bool(true)
