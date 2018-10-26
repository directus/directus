<?php

/** Docblock */
interface Foo
{
    public function bar();
}

class Foo
{
    public function bar()
    {
    }
}

function baz()
{
    // a one-line comment
    print '*'; // a one-line comment

    /* a one-line comment */
    print '*'; /* a one-line comment */

    /* a one-line comment
     */
    print '*'; /* a one-line comment
    */

    print '*'; // @codeCoverageIgnore

    print '*'; // @codeCoverageIgnoreStart
    print '*';
    print '*'; // @codeCoverageIgnoreEnd

    print '*';
}
