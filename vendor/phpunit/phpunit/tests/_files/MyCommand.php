<?php

class MyCommand extends PHPUnit_TextUI_Command
{
    public function __construct()
    {
        $this->longOptions['my-option='] = 'myHandler';
        $this->longOptions['my-other-option'] = null;
    }

    public function myHandler($value)
    {
        echo __METHOD__ . " $value\n";
    }
}
