<?php

use Directus\Db\Schema;

class SchemaTest extends PHPUnit_Framework_TestCase
{
    public function testSupportedDatabase()
    {
        $this->checkArrayKeys(Schema::getSupportedDatabases());
    }

    public function testSchemaTemplates()
    {
        $this->checkArrayKeys(Schema::getTemplates());
    }

    private function checkArrayKeys(array $array)
    {
        foreach($array as $item) {
            $this->assertInternalType('array', $item);
            $this->assertArrayHasKey('name', $item);
            $this->assertArrayHasKey('id', $item);
        }
    }
}
