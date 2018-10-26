<?php
/**
 * Some comment
 */
class Foo{function foo(){}

    /**
     * @param Baz $baz
     */
    public function bar(Baz $baz)
    {
    }

    /**
     * @param Foobar $foobar
     */
    static public function foobar(Foobar $foobar)
    {
    }

    public function barfoo(Barfoo $barfoo)
    {
    }

    /**
     * This docblock does not belong to the baz function
     */

    public function baz()
    {
    }

    public function blaz($x, $y)
    {
    }
}
