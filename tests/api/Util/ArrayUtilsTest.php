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
        $this->assertEquals(ArrayUtils::pick($items, 'name'), ['name' => 'Jim']);

        $this->assertEquals(count(ArrayUtils::filterByKey($items, ['name', 'age'])), 2);
        $this->assertEquals(count(ArrayUtils::filterByKey($items, ['name', 'age', 'city'])), 2);
        $this->assertEquals(ArrayUtils::filterByKey($items, 'name'), ['name' => 'Jim']);

        $this->assertEquals(count(ArrayUtils::filterByKey($items, ['name', 'age'], false)), 2);
        $this->assertEquals(count(ArrayUtils::filterByKey($items, ['name', 'age', 'city'], false)), 2);
        $this->assertEquals(ArrayUtils::filterByKey($items, 'name'), ['name' => 'Jim'], false);
    }

    public function testOmitItems()
    {
        $items = ['name' => 'Jim', 'age' => 79, 'sex' => 'M', 'country' => 'N/A'];
        $this->assertEquals(count(ArrayUtils::omit($items, ['country'])), 3);
        $this->assertEquals(count(ArrayUtils::omit($items, ['country', 'city'])), 3);
        $this->assertEquals(ArrayUtils::omit($items, 'name'), ['age' => 79, 'sex' => 'M', 'country' => 'N/A']);

        $this->assertEquals(count(ArrayUtils::filterByKey($items, ['country'], true)), 3);
        $this->assertEquals(count(ArrayUtils::filterByKey($items, ['name', 'age', 'city'], true)), 2);
        $this->assertEquals(ArrayUtils::filterByKey($items, 'name', true), ['age' => 79, 'sex' => 'M', 'country' => 'N/A']);
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
                ],
                'email' => []
            ]
        ];

        $result = ArrayUtils::dot($array);

        $this->assertInternalType('array', $result);
        $this->assertArrayHasKey('user.name', $result);
        $this->assertArrayHasKey('user.country.name', $result);
        $this->assertArrayHasKey('user.email', $result);
        $this->assertNotInternalType('array', $result['user.email']);

        $result = ArrayUtils::flatKey('_', $array);

        $this->assertInternalType('array', $result);
        $this->assertArrayHasKey('user_name', $result);
        $this->assertArrayHasKey('user_country_name', $result);
    }

    public function testMissing()
    {
        $array1 = ['one', 'two', 'three', 'five'];
        $array2 = ['one', 'four', 'five'];

        $result = ArrayUtils::missing($array1, $array2);
        $this->assertTrue(in_array('four', $result));

        $result = ArrayUtils::without($array1, $array2);
        $this->assertTrue(in_array('four', $result));

        $result = ArrayUtils::intersection($array1, $array2, true);
        $this->assertTrue(in_array('four', $result));
    }

    public function testIntersection()
    {
        $array1 = ['id', 'title', 'body', 'published_date'];
        $array2 = ['title', 'published_date'];

        $result = ArrayUtils::intersection($array1, $array2);
        $this->assertTrue(in_array('title', $result));
        $this->assertTrue(in_array('published_date', $result));
        $this->assertCount(2, $result);
    }

    public function defaults()
    {
        $array1 = [
            'user' => [
                'first_name' => 'John',
                'age' => 56,
                'country' => [
                    'name' => 'Trapponia'
                ]
            ],
            'total' => 1
        ];

        $array2 = [
            'user' => [
                'first_name' => 'John',
                'last_name' => 'Smith',
                'age' => 19,
            ],
            'new' => 1
        ];

        $array3 = [
            'user' => [
                'country' => [
                    'population' => 2,
                    'est' => 1735
                ]
            ],
            'new' => 1
        ];


        $array12 = ArrayUtils::defaults($array1, $array2);
        $this->assertSame('John', $array12['user']['first_name']);
        $this->assertSame('Smith', $array12['user']['last_name']);

        $array13 = ArrayUtils::defaults($array1, $array3);
        $this->assertSame('John', $array13['user']['first_name']);
        $this->assertSame(2, $array13['user']['country']['population']);
        $this->assertSame('Trapponia', $array13['user']['country']['name']);
        $this->assertSame(1, $array13['new']);
        $this->assertSame(1, $array13['total']);
    }
}
