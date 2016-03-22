<?php

use Directus\Cache\Repository;
use Directus\Cache\ArrayStorage;

class RepositoryTest extends PHPUnit_Framework_TestCase
{
    public function testRepository()
    {
        $storage = new ArrayStorage();
        $repository = new Repository($storage);

        $repository->put('name', 'Bob', 0);
        $this->assertSame('Bob', $repository->read('name'));

        $repository->delete('name');
        $this->assertNull($repository->read('name'));
        $this->assertSame('Joe', $repository->read('name', 'Joe'));

        $repository->put('name', 'Daisy', 0);
        $this->assertSame('Daisy', $repository->read('name'));

        $repository->flush();
        $this->assertNull($repository->read('name'));

        $repository->put('name', 'O.B', 0);
        $this->assertSame('O.B', $repository->read('name'));

        $this->assertSame('O.B', $repository->readAndDelete('name'));
        $this->assertNull($repository->read('name'));

        $repository->readOrPut('name', 0, function() {
           return 'Oswaldo';
        });

        $this->assertSame('Oswaldo', $repository->read('name'));
    }
}
