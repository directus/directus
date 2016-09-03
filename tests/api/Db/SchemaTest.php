<?php

use Directus\Db\SchemaManager as Schema;

class SchemaTest extends PHPUnit_Framework_TestCase
{
    public function testCoreTablesPrefix()
    {
        $this->assertSame('directus_users', Schema::addCoreTablePrefix('users'));

        $tables = ['users', 'tables'];
        $prefixedTables = Schema::addCoreTablePrefix($tables);
        foreach ($tables as $table) {
            $this->assertTrue(in_array('directus_' . $table, $prefixedTables));
        }
    }

    public function testCoreTables()
    {
        $coreTables = Schema::addCoreTablePrefix([
            'activity',
            'bookmarks',
            'columns',
            'files',
            'groups',
            'messages',
            'messages_recipients',
            'preferences',
            'privileges',
            'schema_migrations',
            'settings',
            'tables',
            'ui',
            'users'
        ]);

        foreach ($coreTables as $coreTable) {
            $this->assertTrue(in_array($coreTable, Schema::getDirectusTables()));
        }
    }

    public function testPickTableName()
    {
        $pickCoreTables = [
            'users',
            'tables'
        ];

        $notExistingTable = [
            'accounts',
            'databases'
        ];

        $filteredTables = Schema::getDirectusTables(array_merge($pickCoreTables, $notExistingTable));

        foreach ($pickCoreTables as $pickCoreTable) {
            $result = in_array(Schema::addCoreTablePrefix($pickCoreTable), $filteredTables);
            if (!in_array($pickCoreTable, $notExistingTable)) {
                $this->assertFalse($result);
            } else {
                $this->assertTrue($result);
            }
        }
    }

    public function testSupportedDatabase()
    {
        $this->checkArrayKeys(Schema::getSupportedDatabases());
    }

    public function testSchemaTemplates()
    {
        $this->checkArrayKeys(Schema::getTemplates());
    }

    public function testDirectusTables()
    {
        $this->assertTrue(Schema::isDirectusTable('directus_files'));
        $this->assertFalse(Schema::isDirectusTable('directus_storage'));
    }

    private function checkArrayKeys(array $array)
    {
        foreach ($array as $item) {
            $this->assertInternalType('array', $item);
            $this->assertArrayHasKey('name', $item);
            $this->assertArrayHasKey('id', $item);
        }
    }
}
