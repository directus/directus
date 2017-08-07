<?php

class ColumnTest extends PHPUnit_Framework_TestCase
{
    protected $columnData;

    public function setUp()
    {
        $this->columnData = [
            'id' => 'related_projects',
            'column_name' => 'related_projects',
            'data_type' => 'ALIAS',
            'ui' => 'many_to_many',
            'hidden_input' => 0,
            'required' => 0,
            'relationship' => [
                'type' => 'MANYTOMANY',
                'related_table' => 'projects',
                'junction_table' => 'projects_related',
                'junction_key_left' => 'project_id',
                'junction_key_right' => 'related_id'
            ],
            'sort' => 999,
            'comment' => 'Projects related to this project',
        ];
    }

    public function testColumn()
    {
        $columnData = $this->columnData;

        $column = new \Directus\Database\Object\Column($columnData);

        foreach(\Directus\Util\ArrayUtils::omit($columnData, 'relationship') as $attribute => $value) {
            $method = \Directus\Util\StringUtils::underscoreToCamelCase($attribute, true);
            $result = call_user_func([$column, 'get' . $method]);

            // these value must have been converted to boolean
            if (in_array($attribute, ['required', 'hidden_input'])) {
                $value = (bool) $value;
                $result = call_user_func([$column, 'is' . $method]);
            }

            $this->assertSame($result, $value);
        }

        $relationship = $column->getRelationship();
        $this->assertInstanceOf('\Directus\Database\Object\ColumnRelationship', $relationship);
        foreach($columnData['relationship'] as $attribute => $value) {
            $method = 'get' . \Directus\Util\StringUtils::underscoreToCamelCase($attribute, true);
            $result = call_user_func([$relationship, $method]);
            $this->assertSame($result, $value);
        }

        // default value
        $column->setDefaultValue(1);
        $this->assertSame(1, $column->getDefaultValue());

        // is nullable?
        $column->setNullable(1);
        $this->assertTrue($column->getNullable());
        $this->assertTrue($column->isNullable());

        // numeric attributes
        $column->setPrecision(10);
        $column->setScale(2);
        $this->assertSame(10, $column->getPrecision());
        $this->assertSame(2, $column->getScale());

        // using string numbers
        $column->setPrecision('10');
        $column->setScale('2');
        $this->assertSame(10, $column->getPrecision());
        $this->assertSame(2, $column->getScale());

        // using characters
        $column->setPrecision('a');
        $column->setScale('b');
        $this->assertSame(0, $column->getPrecision());
        $this->assertSame(0, $column->getScale());

        // char length
        $column->setLength(255);
        $this->assertSame(255, $column->getLength());
        $column->setLength('255');
        $this->assertSame(255, $column->getLength());
        $column->setLength('abc');
        $this->assertSame(0, $column->getLength());

        // sorting
        $column->setSort('999');
        $this->assertSame(999, $column->getSort());
        $column->setSort('abc');
        $this->assertSame(0, $column->getSort());
    }

    public function testArrayAccess()
    {
        $column = new \Directus\Database\Object\Column($this->columnData);

        $this->assertTrue(isset($column['name']));
        $this->assertSame($column['name'], 'related_projects');

        $column['name'] = 'projects';
        $this->assertSame('projects', $column['name']);

        unset($column['name']);
        $this->assertNull($column['name']);
    }

    /**
     * @expectedException \Exception
     */
    public function testExceptionArrayAccess()
    {
        $column = new \Directus\Database\Object\Column($this->columnData);

        $readable = $column['readableProperty'];
    }

    public function testPropertyToArray()
    {
        $column = new \Directus\Database\Object\Column($this->columnData);

        $properties = $column->propertyArray();

        $this->assertTrue(isset($properties['name']));
        $this->assertSame($properties['name'], 'related_projects');
        $this->assertFalse(isset($properties['readableProperty']));
    }
}
