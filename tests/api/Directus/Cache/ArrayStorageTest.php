<?php

use Directus\Cache\ArrayStorage;

class ArrayStorageTest extends PHPUnit_Framework_TestCase
{
    public function testStorage()
    {
        $storage = new ArrayStorage();

        $storage->put('name', 'John', 0);
        $this->assertSame('John', $storage->read('name'));

        $storage->delete('name');
        $this->assertNull($storage->read('name'));

        $storage->put('name', 'Samuel', 0);
        $this->assertSame('Samuel', $storage->read('name'));

        $storage->flush();
        $this->assertNull($storage->read('name'));
    }
}
