<?php

namespace Directus\Collection;

use Directus\Util\ArrayUtils;

class Collection implements CollectionInterface, \Iterator
{
    /**
     * Collection items
     *
     * @var array
     */
    protected $items = [];

    /**
     * Collection constructor.
     *
     * @param array $items
     */
    public function __construct($items = [])
    {
        $this->items = $items;
    }

    /**
     * @inheritDoc
     */
    public function toArray()
    {
        return $this->items;
    }

    /**
     * @inheritDoc
     */
    public function set($key, $value)
    {
        $this->items[$key] = $value;
    }

    /**
     * @inheritDoc
     */
    public function get($key, $default = null)
    {
        return ArrayUtils::get($this->items, $key, $default);
    }

    /**
     * @inheritDoc
     */
    public function has($key)
    {
        return ArrayUtils::has($this->items, $key);
    }

    /**
     * @inheritDoc
     */
    public function remove($key)
    {
        if ($this->has($key)) {
            unset($this->items[$key]);
        }
    }

    /**
     * @inheritDoc
     */
    public function isEmpty()
    {
        return $this->count() === 0;
    }

    /**
     * @inheritDoc
     */
    public function clear()
    {
        $this->items = [];
    }

    /**
     * @inheritDoc
     */
    public function replace(array $items)
    {
        $this->clear();
        $this->appendArray($items);
    }

    /**
     * @inheritDoc
     */
    public function appendArray(array $items)
    {
        $this->items = array_merge($this->items, $items);

        return $this->items;
    }

    /**
     * @inheritDoc
     */
    public function appendCollection(Collection $collection)
    {
        return $this->appendArray($collection->toArray());
    }

    /**
     * @inheritDoc
     */
    public function offsetExists($offset)
    {
        return $this->has($offset);
    }

    /**
     * @inheritDoc
     */
    public function offsetGet($offset)
    {
        return $this->get($offset);
    }

    /**
     * @inheritDoc
     */
    public function offsetSet($offset, $value)
    {
        $this->set($offset, $value);
    }

    /**
     * @inheritDoc
     */
    public function offsetUnset($offset)
    {
        $this->remove($offset);
    }

    /**
     * @inheritDoc
     */
    public function count()
    {
        return count($this->items);
    }

    /**
     * @inheritDoc
     */
    public function current()
    {
        return current($this->items);
    }

    /**
     * @inheritDoc
     */
    public function next()
    {
        return next($this->items);
    }

    /**
     * @inheritDoc
     */
    public function key()
    {
        return key($this->items);
    }

    /**
     * @inheritDoc
     */
    public function valid()
    {
        return $this->key() !== null;
    }

    /**
     * @inheritDoc
     */
    public function rewind()
    {
        return reset($this->items);
    }
}
