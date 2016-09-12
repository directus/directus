<?php

use Directus\Session\Storage\ArraySessionStorage as NoPersistenceSessionStorage;
use Directus\Session\Storage\NativeSessionStorage;

class SessionStorageTest extends PHPUnit_Framework_TestCase
{
    protected $nativeStorage;

    /**
     * @expectedException \InvalidArgumentException
     */
    public function testInvalidNameArrayStorage()
    {
        $storage = new NoPersistenceSessionStorage(['name' => false]);
    }

    /**
     * @expectedException \InvalidArgumentException
     */
    public function testInvalidNameNativeStorage()
    {
        $storage = new NativeSessionStorage(['name' => false]);
    }

    public function testArrayStorage()
    {
        $storage = new NoPersistenceSessionStorage(['name' => 'test']);

        $this->assertSame('test', $storage->getName());
        $this->assertFalse($storage->isStarted());

        // start storage
        $this->assertTrue($storage->start());
        $this->assertTrue($storage->isStarted());
        $this->assertFalse($storage->start());

        $storage->stop();
        $this->assertFalse($storage->isStarted());

        // attributes
        $this->assertEmpty($storage->getItems());

        $this->assertNull($storage->get('name'));
        $storage->set('name', 'john');
        $this->assertSame('john', $storage->get('name'));
        $storage->set('country_code', 'DO');
        $this->assertSame('DO', $storage->get('country_code'));

        $storage->remove('name');
        $this->assertNull($storage->get('name'));

        $storage->clear();
        $this->assertEmpty($storage->getItems());
    }

    public function testNativeStorage()
    {
        $this->iniSet('session.use_cookies', 0);

        $storage = new NativeSessionStorage(['name' => 'test']);

        $this->assertSame('test', $storage->getName());
        $this->assertFalse($storage->isStarted());

        // start storage
        $storage->start();
        $this->assertTrue($storage->isStarted());
        $this->assertFalse($storage->start());

        $storage->stop();
        $this->assertFalse($storage->isStarted());

        // attributes
        $this->assertEmpty($storage->getItems());

        $this->assertNull($storage->get('name'));
        $storage->set('name', 'john');
        $this->assertSame('john', $storage->get('name'));
        $storage->set('country_code', 'DO');
        $this->assertSame('DO', $storage->get('country_code'));

        $storage->remove('name');
        $this->assertNull($storage->get('name'));

        $storage->clear();
        $this->assertEmpty($storage->getItems());
    }
}
