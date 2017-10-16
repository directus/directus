<?php

use Directus\Util\ArrayUtils;

class ArrayUtilsTest extends PHPUnit_Framework_TestCase
{
    public function testSets()
    {
        $array = [];

        ArrayUtils::set($array, 'name', 'john');
        $this->assertSame('john', $array['name']);

        ArrayUtils::set($array, 'country.name', 'Unknown');
        $this->assertSame('Unknown', $array['country']['name']);
    }

    public function testGetItem()
    {
        $item = ['name' => 'Jim', 'country' => ['name' => 'Germany', 'population' => '9']];
        $this->assertEquals(ArrayUtils::get($item, 'name'), 'Jim');
        $this->assertEquals(ArrayUtils::get($item, 'age', 18), 18);
        $this->assertSame('Germany', ArrayUtils::get($item, 'country.name'));
        $this->assertSame('German', ArrayUtils::get($item, 'country.language', 'German'));
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

    public function testContainsSomeItems()
    {
        $items = ['name' => 'Jim', 'age' => 79, 'sex' => 'M', 'country' => 'N/A'];
        $this->assertTrue(ArrayUtils::containsSome($items, ['name', 'age', 'something']));
        $this->assertTrue(ArrayUtils::containsSome($items, ['name']));
        $this->assertTrue(ArrayUtils::containsSome($items, ['name', 'age']));
        $this->assertFalse(ArrayUtils::containsSome($items, ['someone']));
        $this->assertFalse(ArrayUtils::containsSome($items, ['someone', 'noone']));
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
        $this->assertArrayHasKey('user.country', $result);
        $this->assertArrayHasKey('user.country.name', $result);
        $this->assertArrayHasKey('user.email', $result);
        $this->assertInternalType('array', $result['user.email']);

        $result = ArrayUtils::flatKey('_', $array);

        $this->assertInternalType('array', $result);
        $this->assertArrayHasKey('user_name', $result);
        $this->assertArrayHasKey('user_country_name', $result);
    }

    public function testDotKeys()
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

        $this->assertTrue(ArrayUtils::has($array, 'user.email'));
        $this->assertFalse(ArrayUtils::has($array, 'user.country.language'));
        $this->assertSame('yes', ArrayUtils::get($array, 'user.country.name'));
        $this->assertSame('John', ArrayUtils::get($array, 'user.name'));
        $this->assertNull(ArrayUtils::get($array, 'user.language'));
        $this->assertSame('English', ArrayUtils::get($array, 'user.language', 'English'));
    }

    public function testFindFlatKeys()
    {
        $array = [
            'user' => [
                'name' => 'John',
                'country' => [
                    'name' => 'yes'
                ],
                'email' => [],
                'account' => [
                    'balance' => null
                ]
            ]
        ];

        $this->assertEmpty(ArrayUtils::findDot($array, 'user.first_name'));

        $this->assertInternalType('array', ArrayUtils::findDot($array, 'user.name'));
        $this->assertInternalType('array', ArrayUtils::findDot($array, 'user.country'));
        $this->assertInternalType('array', ArrayUtils::findDot($array, 'user.country.name'));
        $this->assertInternalType('array', ArrayUtils::findDot($array, 'user.email'));
        $this->assertInternalType('array', ArrayUtils::findDot($array, 'user.account.balance'));

        $this->assertInternalType('array', ArrayUtils::findFlatKey('_', $array, 'user_name'));
        $this->assertEmpty(ArrayUtils::findFlatKey('_', $array, 'user_dob'));
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

    public function testDefaults()
    {
        $array1 = [
            'database' => [
                'hostname' => 'localhost',
                'username' => 'root',
                'driver' => 'mysql'
            ],
            'status_name' => 'active',
        ];

        $array2 = [
            'database' => [
                'hostname' => 'localhost',
                'username' => 'root',
                'password' => 'root',
                'database' => 'directus'
            ]
        ];

        $newArray = ArrayUtils::defaults($array1, $array2);
        $this->assertTrue(ArrayUtils::has($newArray, 'database.database'));
        $this->assertSame('mysql', ArrayUtils::get($newArray, 'database.driver'));

        $newNewArray = ArrayUtils::defaults($newArray, [
            'database' => [
                'hostname' => '127.0.0.1'
            ]
        ]);
        $this->assertSame('127.0.0.1', ArrayUtils::get($newNewArray, 'database.hostname'));
    }

    public function testRemove()
    {
        $array = [
            'name' => 'John',
            'age' => 11,
            'password' => 'secret',
            'salary' => '160',
            'gender' => 'm',
            'married' => true
        ];

        $this->assertTrue(ArrayUtils::has($array, 'married'));
        ArrayUtils::remove($array, 'married');
        $this->assertFalse(ArrayUtils::has($array, 'married'));

        $this->assertTrue(ArrayUtils::contains($array, ['salary', 'gender', 'password']));
        ArrayUtils::remove($array, ['salary', 'gender', 'password']);
        $this->assertFalse(ArrayUtils::contains($array, ['salary', 'gender', 'password']));
    }

    public function testAliasKeys()
    {
        $data = ['table' => 'users', 'column' => 'email', 'type' => 'varchar', 'ui' => 'text_input'];
        $expectedData = ['table_name' => 'users', 'column_name' => 'email', 'data_type' => 'varchar', 'ui' => 'text_input'];

        $newData = ArrayUtils::aliasKeys($data, [
            'table_name' => 'table',
            'column_name' => 'column',
            'data_type' => 'type'
        ]);

        $this->assertEquals($expectedData, $newData);
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

    public function testRename()
    {
        $array = [
            'name' => 'John Doe',
            'age' => 20
        ];

        ArrayUtils::rename($array, 'name', 'full_name');

        $this->assertSame('John Doe', $array['full_name']);
        $this->assertFalse(isset($array['name']));

        ArrayUtils::rename($array, 'age', 'full_name');

        $this->assertSame(20, $array['full_name']);
        $this->assertFalse(isset($array['age']));
    }
}
