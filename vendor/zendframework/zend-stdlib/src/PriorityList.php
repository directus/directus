<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2015 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace Zend\Stdlib;

use Countable;
use Iterator;

class PriorityList implements Iterator, Countable
{
    const EXTR_DATA     = 0x00000001;
    const EXTR_PRIORITY = 0x00000002;
    const EXTR_BOTH     = 0x00000003;
    /**
     * Internal list of all items.
     *
     * @var array[]
     */
    protected $items = [];

    /**
     * Serial assigned to items to preserve LIFO.
     *
     * @var int
     */
    protected $serial = 0;

    /**
     * Serial order mode
     * @var integer
     */
    protected $isLIFO = 1;

    /**
     * Internal counter to avoid usage of count().
     *
     * @var int
     */
    protected $count = 0;

    /**
     * Whether the list was already sorted.
     *
     * @var bool
     */
    protected $sorted = false;

    /**
     * Insert a new item.
     *
     * @param  string  $name
     * @param  mixed   $value
     * @param  int     $priority
     *
     * @return void
     */
    public function insert($name, $value, $priority = 0)
    {
        if (! isset($this->items[$name])) {
            $this->count++;
        }

        $this->sorted = false;

        $this->items[$name] = [
            'data'     => $value,
            'priority' => (int) $priority,
            'serial'   => $this->serial++,
        ];
    }

    /**
     * @param string $name
     * @param int    $priority
     *
     * @return $this
     *
     * @throws \Exception
     */
    public function setPriority($name, $priority)
    {
        if (! isset($this->items[$name])) {
            throw new \Exception("item $name not found");
        }

        $this->items[$name]['priority'] = (int) $priority;
        $this->sorted                   = false;

        return $this;
    }

    /**
     * Remove a item.
     *
     * @param  string $name
     * @return void
     */
    public function remove($name)
    {
        if (isset($this->items[$name])) {
            $this->count--;
        }

        unset($this->items[$name]);
    }

    /**
     * Remove all items.
     *
     * @return void
     */
    public function clear()
    {
        $this->items  = [];
        $this->serial = 0;
        $this->count  = 0;
        $this->sorted = false;
    }

    /**
     * Get a item.
     *
     * @param  string $name
     * @return mixed
     */
    public function get($name)
    {
        if (! isset($this->items[$name])) {
            return;
        }

        return $this->items[$name]['data'];
    }

    /**
     * Sort all items.
     *
     * @return void
     */
    protected function sort()
    {
        if (! $this->sorted) {
            uasort($this->items, [$this, 'compare']);
            $this->sorted = true;
        }
    }

    /**
     * Compare the priority of two items.
     *
     * @param  array $item1,
     * @param  array $item2
     * @return int
     */
    protected function compare(array $item1, array $item2)
    {
        return ($item1['priority'] === $item2['priority'])
            ? ($item1['serial'] > $item2['serial'] ? -1 : 1) * $this->isLIFO
            : ($item1['priority'] > $item2['priority'] ? -1 : 1);
    }

    /**
     * Get/Set serial order mode
     *
     * @param bool|null $flag
     *
     * @return bool
     */
    public function isLIFO($flag = null)
    {
        if ($flag !== null) {
            $isLifo = $flag === true ? 1 : -1;

            if ($isLifo !== $this->isLIFO) {
                $this->isLIFO = $isLifo;
                $this->sorted = false;
            }
        }

        return 1 === $this->isLIFO;
    }

    /**
     * {@inheritDoc}
     */
    public function rewind()
    {
        $this->sort();
        reset($this->items);
    }

    /**
     * {@inheritDoc}
     */
    public function current()
    {
        $this->sorted || $this->sort();
        $node = current($this->items);

        return $node ? $node['data'] : false;
    }

    /**
     * {@inheritDoc}
     */
    public function key()
    {
        $this->sorted || $this->sort();
        return key($this->items);
    }

    /**
     * {@inheritDoc}
     */
    public function next()
    {
        $node = next($this->items);

        return $node ? $node['data'] : false;
    }

    /**
     * {@inheritDoc}
     */
    public function valid()
    {
        return current($this->items) !== false;
    }

    /**
     * @return self
     */
    public function getIterator()
    {
        return clone $this;
    }

    /**
     * {@inheritDoc}
     */
    public function count()
    {
        return $this->count;
    }

    /**
     * Return list as array
     *
     * @param int $flag
     *
     * @return array
     */
    public function toArray($flag = self::EXTR_DATA)
    {
        $this->sort();

        if ($flag == self::EXTR_BOTH) {
            return $this->items;
        }

        return array_map(
            function ($item) use ($flag) {
                return ($flag == PriorityList::EXTR_PRIORITY) ? $item['priority'] : $item['data'];
            },
            $this->items
        );
    }
}
