<?php

class SessionTest extends PHPUnit_Framework_TestCase
{
    public function testSession()
    {
        $storage = new \Directus\Session\Storage\ArraySessionStorage();
        $session = new \Directus\Session\Session($storage);

        $this->assertInstanceOf('\Directus\Session\Storage\ArraySessionStorage', $session->getStorage());
        $this->assertSame($storage, $session->getStorage());
    }

    public function testStorageCalls()
    {
        $storage = new \Directus\Session\Storage\ArraySessionStorage();
        $session = new \Directus\Session\Session($storage);

        $this->assertNull($session->get('name'));

        $storage->set('name', 'joseph');
        $this->assertSame('joseph', $session->get('name'));
    }
}
