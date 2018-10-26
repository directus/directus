<?php

class CoveredClassWithAnonymousFunctionInStaticMethod
{
    public static function runAnonymous()
    {
        $filter = ['abc124', 'abc123', '123'];

        array_walk(
            $filter,
            function (&$val, $key) {
                $val = preg_replace('|[^0-9]|', '', $val);
            }
        );

        // Should be covered
        $extravar = true;
    }
}
