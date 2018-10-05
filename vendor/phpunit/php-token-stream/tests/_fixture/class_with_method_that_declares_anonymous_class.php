<?php
interface foo {
}

class class_with_method_that_declares_anonymous_class
{
    public function method()
    {
        $o = new class { public function foo() {} };
        $o = new class{public function foo(){}};
        $o = new class extends stdClass {};
        $o = new class extends stdClass {};
        $o = new class implements foo {};
    }
}
