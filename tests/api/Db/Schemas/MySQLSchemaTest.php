<?php

class MySQLSchemaTest extends PHPUnit_Framework_TestCase
{
    public function testGetTables()
    {
        $schema = $this->getSchema();

        $result = $schema->getTables();
        $this->assertInstanceOf('Zend\Db\Adapter\Driver\ResultInterface', $result);

        // With Filter
        $result = $schema->getTables(['sales']);
        $this->assertInstanceOf('Zend\Db\Adapter\Driver\ResultInterface', $result);

        $result = $schema->getTablesName();
        $this->assertInstanceOf('Zend\Db\Adapter\Driver\ResultInterface', $result);
    }

    public function testGetTable()
    {
        $schema = $this->getSchema();

        $result = $schema->getTable('users');
        $this->assertInstanceOf('Zend\Db\Adapter\Driver\ResultInterface', $result);
    }

    public function testHasTable()
    {
        // Table exists
        $schema = $this->getSchema(['result_count' => 1]);
        $this->assertTrue($schema->hasTable('users'));

        // Table not exists
        $schema = $this->getSchema(['result_count' => 0]);
        $this->assertFalse($schema->hasTable('sales'));
    }

    public function testTableExists()
    {
        $mockSchema = $this->getMockSchema(['hasTable']);

        $mockSchema->expects($this->at(0))
            ->method('hasTable')
            ->with($this->equalTo('sales'))
            ->will($this->returnValue(false));

        $mockSchema->expects($this->at(1))
            ->method('hasTable')
            ->with($this->equalTo('users'))
            ->will($this->returnValue(true));

        $this->assertFalse($mockSchema->tableExists('sales'));
        $this->assertTrue($mockSchema->tableExists('users'));
    }

    public function testSomeTableExists()
    {
        $schema = $this->getSchema();

        $this->assertInternalType('bool', $schema->someTableExists(['users', 'sales']));
    }

    public function testGetColumns()
    {
        $schema = $this->getSchema();

        $result = $schema->getColumns('users');
        $this->assertInstanceOf('Zend\Db\Adapter\Driver\ResultInterface', $result);

        $result = $schema->getColumns('users', ['column_name' => 1, 'blacklist' => ['password']]);
        $this->assertInstanceOf('Zend\Db\Adapter\Driver\ResultInterface', $result);

        $result = $schema->getColumns('users', false);
        $this->assertInstanceOf('Zend\Db\Adapter\Driver\ResultInterface', $result);
    }

    public function testGetAllColumns()
    {
        $schema = $this->getSchema();

        $result = $schema->getAllColumns();
        $this->assertInstanceOf('Zend\Db\Adapter\Driver\ResultInterface', $result);
    }

    public function testParseRecord()
    {
        $schema = $this->getSchema();

        $data = ['points' => '1'];
        $columns = [
            ['id' => 'points', 'name' => 'points', 'type' => 'int']
        ];

        foreach($columns as $key => $column) {
            $columns[$key] = new \Directus\Database\Object\Column($column);
        }

        $result = $schema->parseRecordValuesByType($data, $columns);
        $this->assertSame(['points' => 1], $result);
    }

    public function testGetPrimaryKey()
    {
        $data = [
            'column_name' => 'id'
        ];

        $schema = $this->getSchema(['result_data' => $data]);

        $this->assertSame('id', $schema->getPrimaryKey('users'));
    }

    public function testParseValues()
    {
        $mockSchema = $this->getMockSchema(['castValue']);

        $mockSchema->expects($this->once())
                ->method('castValue')
                ->with($this->equalTo('2016'), $this->equalTo('int'), $this->equalTo(false))
                ->will($this->returnValue(2016));


        $this->assertSame(2016, $mockSchema->parseType('2016', 'int', false));
    }

    public function testCastValues()
    {
        $schema = $this->getSchema();

        // Without data type
        $this->assertSame('2016', $schema->castValue('2016'));
        $this->assertSame('2016', $schema->castValue('2016', null));

        // Numbers
        $this->assertInternalType('integer', $schema->castValue('2016', 'year'));
        $this->assertInternalType('integer', $schema->castValue('9223372036854775807', 'bigint'));
        $this->assertInternalType('integer', $schema->castValue('1', 'smallint'));
        $this->assertInternalType('integer', $schema->castValue('1', 'mediumint'));
        $this->assertInternalType('integer', $schema->castValue('1', 'int'));
        $this->assertInternalType('integer', $schema->castValue('1', 'long'));
        $this->assertInternalType('integer', $schema->castValue('1', 'tinyint'));
        $this->assertInternalType('float', $schema->castValue('1.12345678', 'float'));

        // Date
        $this->assertInternalType('string', $schema->castValue('2016-04-16', 'date'));
        $this->assertNull($schema->castValue('', 'date'));
        $this->assertNull($schema->castValue(NULL, 'date'));
        $this->assertNull($schema->castValue('not-a-date', 'date'));
        $this->assertNull($schema->castValue('0000-00-00', 'date'));
        $this->assertNull($schema->castValue('0000-00-00 00:00:00', 'date'));

        // Time
        $this->assertInternalType('string', $schema->castValue('12:22', 'time'));
        $this->assertInternalType('string', $schema->castValue('12:22:00', 'time'));
        $this->assertInternalType('string', $schema->castValue('00:00:00', 'time'));
        $this->assertNull($schema->castValue('', 'time'));
        $this->assertNull($schema->castValue(NULL, 'time'));
        // Note: this should fail
        // $this->assertNull($schema->castValue('not-a-time', 'time'));

        // DateTime
        $this->assertInternalType('string', $schema->castValue('2016-04-16 05:30:00', 'datetime'));
        $this->assertNull($schema->castValue('', 'datetime'));
        $this->assertNull($schema->castValue(NULL, 'datetime'));
        $this->assertNull($schema->castValue('not-a-date', 'datetime'));
        $this->assertNull($schema->castValue('0000-00-00 00:00:00', 'datetime'));
        $this->assertNull($schema->castValue('0000-00-00', 'datetime'));

        // String
        $this->assertInternalType('string', $schema->castValue('some text', 'char'));
        $this->assertInternalType('string', $schema->castValue('some text', 'varchar'));
        $this->assertInternalType('string', $schema->castValue('some text', 'text'));
        $this->assertInternalType('string', $schema->castValue('some text', 'tinytext'));
        $this->assertInternalType('string', $schema->castValue('some text', 'mediumtext'));
        $this->assertInternalType('string', $schema->castValue('some text', 'longtext'));
        $this->assertInternalType('string', $schema->castValue('some text', 'var_string'));

        // Blob
        $this->assertInternalType('string', $schema->castValue('someblob', 'blob'));
        $this->assertInternalType('string', $schema->castValue('someblob', 'mediumblob'));
    }

    protected function getSchema($attributes = [])
    {
        return get_mysql_schema($this, $attributes);
    }

    protected function getMockSchema(array $methods = [])
    {
        return get_mock_mysql_schema($this, $methods);
    }
}
