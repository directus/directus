<?php

use Directus\Database\Ddl\Column\Boolean;

class BooleanTest extends \PHPUnit_Framework_TestCase
{
    public function testData()
    {
        $column = new Boolean('foo', false, 2);
        $this->assertSame('foo', $column->getName());
        $this->assertFalse($column->isNullable());
        $this->assertSame(2, $column->getDefault());
    }
}