<?php

use Directus\Util\ArrayUtils;

class ArrayUtilsTest extends PHPUnit_Framework_TestCase
{
    public function testGetItem()
    {
        $item = ['name' => 'Jim'];
        $this->assertEquals(ArrayUtils::get($item, 'name'), 'Jim');
        $this->assertEquals(ArrayUtils::get($item, 'age', 18), 18);
    }

    public function testPickItems()
    {
        $items = ['name' => 'Jim', 'age' => 79, 'sex' => 'M', 'country' => 'N/A'];
        $this->assertEquals(count(ArrayUtils::pick($items, ['name', 'age'])), 2);
        $this->assertEquals(count(ArrayUtils::pick($items, ['name', 'age', 'city'])), 2);
    }

    public function testContainsItems()
    {
        $items = ['name' => 'Jim', 'age' => 79, 'sex' => 'M', 'country' => 'N/A'];
        $this->assertTrue(ArrayUtils::contains($items, ['name', 'age']));
        $this->assertFalse(ArrayUtils::contains($items, ['name', 'age', 'city']));
        $this->assertTrue(ArrayUtils::contains($items, 'name', 'age'));
    }

    public function testFlatKeys()
    {
        $array = [
            'user' => [
                'name' => 'John',
                'country' => [
                    'name' => 'yes'
                ]
            ]
        ];

        $result = ArrayUtils::dot($array);

        $this->assertInternalType('array', $result);
        $this->assertArrayHasKey('user.name', $result);
        $this->assertArrayHasKey('user.country.name', $result);

        $result = ArrayUtils::flatKey('_', $array);

        $this->assertInternalType('array', $result);
        $this->assertArrayHasKey('user_name', $result);
        $this->assertArrayHasKey('user_country_name', $result);
    }
}
