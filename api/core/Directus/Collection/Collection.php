<?php

/**
 * Directus – <http://getdirectus.com>
 *
 * @link      The canonical repository – <https://github.com/directus/directus>
 * @copyright Copyright 2006-2017 RANGER Studio, LLC – <http://rangerstudio.com>
 * @license   GNU General Public License (v3) – <http://www.gnu.org/copyleft/gpl.html>
 */

namespace Directus\Collection;

use Directus\Util\ArrayUtils;

/**
 * Collection
 *
 * @author Welling Guzmán <welling@rngr.org>
 */
class Collection implements CollectionInterface
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
        return empty($this->items);
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
}
