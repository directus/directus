<?php
class Foo
{
    public function doSomething(Bar $bar)
    {
        return $bar->doSomethingElse();
    }
}
