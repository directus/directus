<?php

class CollectionTest extends PHPUnit_Framework_TestCase
{
    public function testCollectionEmpty()
    {
        $collection = new \Directus\Collection\Collection();
        $this->assertEmpty($collection->toArray());
        $this->assertTrue($collection->isEmpty());
        $this->assertSame(0, $collection->count());
    }

    public function testCollection()
    {
        $collection = new \Directus\Collection\Collection([
            'name' => 'john',
            'best_friend' => 'joseph',
            'age' => 37
        ]);

        $this->assertSame(3, $collection->count());

        $this->assertTrue($collection->has('name'));
        $this->assertTrue(isset($collection['name']));
        $this->assertFalse($collection->has('location'));
        $this->assertFalse(isset($collection['location']));

        $this->assertSame(37, $collection->get('age'));
        $this->assertNull($collection->get('location'));
        $this->assertNull($collection['location']);
        $this->assertSame('unknown', $collection->get('location', 'unknown'));

        $collection->set('location', 'unknown');
        $collection['pet'] = 'fish';
        $this->assertTrue($collection->has('location'));
        $this->assertTrue($collection->has('pet'));
        $this->assertSame('unknown', $collection->get('location'));
        $this->assertSame('fish', $collection['pet']);

        $collection->remove('location');
        unset($collection['pet']);
        $this->assertFalse($collection->has('location'));
        $this->assertFalse($collection->has('pet'));

        $collection->appendArray(['hair_color' => 'black', 'eye_color' => 'green']);

        $this->assertSame('black', $collection->get('hair_color'));
        $this->assertSame('green', $collection->get('eye_color'));

        $anotherCollection = new \Directus\Collection\Collection(['language' => 'English']);
        $collection->appendCollection($anotherCollection);
        $this->assertTrue($collection->has('language'));

        $collection->clear();
        $this->assertSame(0, $collection->count());
        $this->assertTrue($collection->isEmpty());
        $this->assertEmpty($collection->toArray());
    }
}