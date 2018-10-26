<?php
class MethodCallback
{
    public static function staticCallback()
    {
        $args = func_get_args();

        if ($args == ['foo', 'bar']) {
            return 'pass';
        }
    }

    public function nonStaticCallback()
    {
        $args = func_get_args();

        if ($args == ['foo', 'bar']) {
            return 'pass';
        }
    }
}
