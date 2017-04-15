<?php

class TableTest extends PHPUnit_Framework_TestCase
{
    public function testTable()
    {
        $data = [
            'id' => 'users',
            'table_name' => 'users',
            'date_created' => '2016-09-13 11:57:31',
            'comment' => 'All my clients',
            'row_count' => 1337,
            'hidden' => 0,
            'single' => 0,
            'default_status' => 2,
            'user_create_column' => 'created_by',
            'user_update_column' => 'updated_by',
            'date_create_column' => 'created_at',
            'date_update_column' => 'updated_at',
            'footer' => null,
            'column_groupings' => null,
            'filter_column_blacklist' => null,
            'primary_column' => 'name'
        ];

        $table = new \Directus\Database\Object\Table($data);
        foreach($data as $attribute => $value) {
            $method = 'get' . \Directus\Util\StringUtils::underscoreToCamelCase($attribute, true);
            $result = call_user_func([$table, $method]);

            // these value must have been converted to boolean
            if (in_array($attribute, ['footer', 'hidden', 'single'])) {
                $value = (bool) $value;
            }

            $this->assertSame($result, $value);
        }

        $schema = 'marketing';
        $table->setSchema($schema);
        $this->assertSame($schema, $table->getSchema());

        $this->assertFalse($table->isHidden());
        $this->assertFalse($table->isSingle());


        $columns = [
            new \Directus\Database\Object\Column('id'),
            new \Directus\Database\Object\Column('name'),
            new \Directus\Database\Object\Column('email')
        ];

        $table->setColumns($columns);

        $this->assertCount(3, $table->getColumns());
        foreach($table->getColumns() as $column) {
            $this->assertInstanceOf('\Directus\Database\Object\Column', $column);
        }

        $this->assertTrue($table->hasColumn('email'));
        $this->assertFalse($table->hasColumn('password'));
        $this->assertFalse($table->hasStatusColumn());
    }

    /**
     * @expectedException \InvalidArgumentException
     */
    public function testInvalidColumnException()
    {
        $table = new \Directus\Database\Object\Table('users');

        $table->setColumns([false, null]);
    }

    /**
     * @expectedException \InvalidArgumentException
     */
    public function testTableNameException()
    {
        $table = new \Directus\Database\Object\Table(true);
    }

    /**
     * @expectedException \InvalidArgumentException
     */
    public function testSchemaException()
    {
        $table = new \Directus\Database\Object\Table('users');
        $table->setSchema(true);
    }
}
