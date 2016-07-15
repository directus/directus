<?php

use Directus\Util\SchemaUtils;

class SchemaUtilsTest extends PHPUnit_Framework_TestCase
{
    public function testColumnName()
    {
        $this->assertEquals('column_name_here', SchemaUtils::cleanColumnName('column name here'));
        $this->assertEquals('column_name_here', SchemaUtils::cleanColumnName('column name$here'));
        $this->assertEquals('column_name_here', SchemaUtils::cleanColumnName('column  name  $here'));
        $this->assertEquals('column_', SchemaUtils::cleanColumnName('column '));
        $this->assertEquals('column_3', SchemaUtils::cleanColumnName('column 3'));
        $this->assertEquals('column', SchemaUtils::cleanColumnName('3column'));
    }

    public function testTableName()
    {
        $this->assertEquals('column_name_here', SchemaUtils::cleanTableName('column name here'));
        $this->assertEquals('column_name_here', SchemaUtils::cleanTableName('column name$here'));
        $this->assertEquals('column_name_here', SchemaUtils::cleanTableName('column  name  $here'));
        $this->assertEquals('column_', SchemaUtils::cleanTableName('column '));
        $this->assertEquals('column_3', SchemaUtils::cleanTableName('column 3'));
    }

    public function testIdentifierName()
    {
        $this->assertEquals('column_name_here', SchemaUtils::cleanIdentifier('column name here'));
        $this->assertEquals('column_name_here', SchemaUtils::cleanIdentifier('column name$here'));
        $this->assertEquals('column_name_here', SchemaUtils::cleanIdentifier('column  name  $here'));
        $this->assertEquals('column_', SchemaUtils::cleanIdentifier('column '));
        $this->assertEquals('column_3', SchemaUtils::cleanIdentifier('column 3'));
    }
}
