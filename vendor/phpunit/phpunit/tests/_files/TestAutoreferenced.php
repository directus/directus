<?php
use PHPUnit\Framework\TestCase;

class TestAutoreferenced extends TestCase
{
    public $myTestData = null;

    public function testJsonEncodeException($data)
    {
        $this->myTestData = $data;
    }
}
