--TEST--
Test extend()
--SKIPIF--
<?php if (!extension_loaded("pimple")) print "skip"; ?>
--FILE--
<?php
/*
 This is part of Pimple::extend() code :

          $extended = function ($c) use ($callable, $factory) {
             return $callable($factory($c), $c);
          };
*/

$p = new Pimple\Container();
$p[12] = function ($v) { var_dump($v); return 'foo';}; /* $factory in code above */

$c = $p->extend(12, function ($w) { var_dump($w); return 'bar'; }); /* $callable in code above */

var_dump($c('param'));
--EXPECTF--
string(5) "param"
string(3) "foo"
string(3) "bar"