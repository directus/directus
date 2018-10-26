<?php

namespace Directus\Collection;

interface CollectionInterface extends Arrayable, \Countable, \ArrayAccess
{
    /**
     * Sets an item in the collection with the given key-value
     *
     * @param $key
     * @param $value
     *
     * @return void
     */
    public function set($key, $value);

    /**
     * Get the a collection item with the given key.
     *
     * @param $key
     * @param null $default
     *
     * @return mixed
     */
    public function get($key, $default = null);

    /**
     * Checks whether the collection contains a item with the given key
     *
     * @param $key
     *
     * @return bool
     */
    public function has($key);

    /**
     * Removes a item by the given key
     *
     * @param $key
     *
     * @return void
     */
    public function remove($key);

    /**
     * Checks whether the collection is empty
     *
     * @return bool
     */
    public function isEmpty();

    /**
     * Removes all the items from the collection
     *
     * @return void
     */
    public function clear();

    /**
     * Replaces all current items with the given items
     *
     * @param array $items
     *
     * @return void
     */
    public function replace(array $items);

    /**
     * Append an array into the collection items
     *
     * @param array $items
     *
     * @return array
     */
    public function appendArray(array $items);

    /**
     * Append a collection object into the collection items
     *
     * @param Collection $collection
     *
     * @return array
     */
    public function appendCollection(Collection $collection);
}
