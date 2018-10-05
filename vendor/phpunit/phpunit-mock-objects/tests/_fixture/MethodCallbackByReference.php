<?php
class MethodCallbackByReference
{
    public function bar(&$a, &$b, $c)
    {
        Legacy::bar($a, $b, $c);
    }

    public function callback(&$a, &$b, $c)
    {
        $b = 1;
    }
}
