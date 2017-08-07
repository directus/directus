<?php

use Directus\Database\SchemaManager as Schema;

class SchemaTest extends PHPUnit_Framework_TestCase
{
    /**
     * @var Schema
     */
    protected $schema;

    protected $mockAdapter;

    public function setUp()
    {
        $this->mockAdapter = get_mock_mysql_schema($this);
        $this->schema = new Schema($this->mockAdapter);
    }

    public function testAdapter()
    {
        $this->assertInstanceOf('\Directus\Database\Schemas\Sources\SchemaInterface', $this->schema->getSchema());
    }

    public function testCoreTablesPrefix()
    {
        $schema = $this->schema;
        $this->assertSame('directus_users', $schema->addCoreTablePrefix('users'));

        $tables = ['users', 'tables'];
        $prefixedTables = $schema->addCoreTablePrefix($tables);
        foreach ($tables as $table) {
            $this->assertTrue(in_array('directus_' . $table, $prefixedTables));
        }

        $coreTables = $schema->getCoreTables();
        foreach($coreTables as $table) {
            $this->assertTrue(\Directus\Util\StringUtils::startsWith($table, 'directus_'));
        }
    }

    public function testCoreTables()
    {
        $schema = $this->schema;

        $coreTables = $schema->addCoreTablePrefix([
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
            'users'
        ]);

        foreach ($coreTables as $coreTable) {
            $this->assertTrue(in_array($coreTable, $this->schema->getDirectusTables()));
        }
    }

    public function testPickTableName()
    {
        $schema = $this->schema;

        $pickCoreTables = [
            'users',
            'tables'
        ];

        $notExistingTable = [
            'accounts',
            'databases'
        ];

        $tables = array_merge($pickCoreTables, $notExistingTable);
        $filteredTables = $schema->getDirectusTables($tables);

        foreach ($tables as $table) {
            $result = in_array($schema->addCoreTablePrefix($table), $filteredTables);
            if (in_array($table, $notExistingTable)) {
                $this->assertFalse($result);
            } else {
                $this->assertTrue($result);
            }
        }
    }

    public function testGetPrimaryKey()
    {
        $adapter = get_mock_mysql_schema($this, ['getPrimaryKey']);
        $schema = new Schema($adapter);

        $adapter->expects($this->once())
            ->method('getPrimaryKey')
            ->with($this->equalTo('users'))
            ->will($this->returnValue('id'));

        $this->assertSame('id', $schema->getPrimaryKey('users'));
    }

    public function testTableExists()
    {
        $adapter = get_mock_mysql_schema($this, ['tableExists', 'someTableExists']);
        $schema = new Schema($adapter);

        $adapter->expects($this->at(0))
                ->method('tableExists')
                ->with($this->equalTo('users'))
                ->will($this->returnValue(true));

        $adapter->expects($this->at(1))
            ->method('tableExists')
            ->with($this->equalTo('sales'))
            ->will($this->returnValue(false));

        $this->assertTrue($schema->tableExists('users'));
        $this->assertFalse($schema->tableExists('sales'));

        $adapter->expects($this->at(0))
            ->method('someTableExists')
            ->with($this->equalTo(['users', 'files', 'sales']))
            ->will($this->returnValue(true));

        $adapter->expects($this->at(1))
            ->method('someTableExists')
            ->with($this->equalTo(['sales', 'providers', 'customers']))
            ->will($this->returnValue(false));

        $this->assertTrue($schema->someTableExists(['users', 'files', 'sales']));
        $this->assertFalse($schema->someTableExists(['sales', 'providers', 'customers']));
    }

    public function testGetTables()
    {
        $adapter = get_mock_mysql_schema($this, ['getTables']);
        $adapter->expects($this->once())
                ->method('getTables')
                ->will($this->returnValue([]));

        $schema = new Schema($adapter);

        $filter = ['blacklist' => 'files'];

        $adapter->expects($this->once())
            ->method('getTables')
            ->with($this->equalTo($filter));

        $schema->getTables($filter);
    }

    public function testGetTablesName()
    {
        $adapter = get_mock_mysql_schema($this, ['getTablesName']);
        $schema = new Schema($adapter);
        $data = [
            ['table_name' => 'users'],
            ['table_name' => 'files']
        ];

        $adapter->expects($this->once())
                ->method('getTablesName')
                ->will($this->returnValue($data));

        $result = $schema->getTablesName();
        $this->assertInternalType('array', $result);
        $this->assertCount(2, $result);
    }

    public function testGetColumns()
    {
        $adapter = get_mysql_schema($this);
        $schema = new Schema($adapter);

        $this->assertInternalType('array', $schema->getColumns('files'));
        $this->assertInternalType('array', $schema->getAllColumns());
    }

    public function testSupportedDatabase()
    {
        $this->checkArrayKeys($this->schema->getSupportedDatabases());
    }

    public function testSchemaTemplates()
    {
        $this->checkArrayKeys($this->schema->getTemplates());
    }

    public function testDirectusTables()
    {
        $this->assertTrue($this->schema->isDirectusTable('directus_files'));
        $this->assertFalse($this->schema->isDirectusTable('directus_storage'));
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
