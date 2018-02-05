<?php
/**
 * @link      http://github.com/zendframework/zend-db for the canonical source repository
 * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace Zend\Db\Sql;

use Countable;
use Iterator;

/**
 * Aggregate JOIN specifications.
 *
 * Each specification is an array with the following keys:
 *
 * - name: the JOIN name
 * - on: the table on which the JOIN occurs
 * - columns: the columns to include with the JOIN operation; defaults to
 *   `Select::SQL_STAR`.
 * - type: the type of JOIN being performed; see the `JOIN_*` constants;
 *   defaults to `JOIN_INNER`
 */
class Join implements Iterator, Countable
{
    const JOIN_INNER       = 'inner';
    const JOIN_OUTER       = 'outer';
    const JOIN_LEFT        = 'left';
    const JOIN_RIGHT       = 'right';
    const JOIN_RIGHT_OUTER = 'right outer';
    const JOIN_LEFT_OUTER  = 'left outer';

    /**
     * Current iterator position.
     *
     * @var int
     */
    private $position = 0;

    /**
     * JOIN specifications
     *
     * @var array
     */
    protected $joins = [];

    /**
     * Initialize iterator position.
     */
    public function __construct()
    {
        $this->position = 0;
    }

    /**
     * Rewind iterator.
     */
    public function rewind()
    {
        $this->position = 0;
    }

    /**
     * Return current join specification.
     *
     * @return array
     */
    public function current()
    {
        return $this->joins[$this->position];
    }

    /**
     * Return the current iterator index.
     *
     * @return int
     */
    public function key()
    {
        return $this->position;
    }

    /**
     * Advance to the next JOIN specification.
     */
    public function next()
    {
        ++$this->position;
    }

    /**
     * Is the iterator at a valid position?
     *
     * @return bool
     */
    public function valid()
    {
        return isset($this->joins[$this->position]);
    }

    /**
     * @return array
     */
    public function getJoins()
    {
        return $this->joins;
    }

    /**
     * @param string|array|TableIdentifier $name A table name on which to join, or a single
     *     element associative array, of the form alias => table, or TableIdentifier instance
     * @param string $on A string specification describing the fields to join on.
     * @param string|string[]|int|int[] $columns A single column name, an array
     *     of column names, or (a) specification(s) such as SQL_STAR representing
     *     the columns to join.
     * @param string $type The JOIN type to use; see the JOIN_* constants.
     * @return self Provides a fluent interface
     * @throws Exception\InvalidArgumentException for invalid $name values.
     */
    public function join($name, $on, $columns = [Select::SQL_STAR], $type = Join::JOIN_INNER)
    {
        if (is_array($name) && (! is_string(key($name)) || count($name) !== 1)) {
            throw new Exception\InvalidArgumentException(
                sprintf("join() expects '%s' as a single element associative array", array_shift($name))
            );
        }

        if (! is_array($columns)) {
            $columns = [$columns];
        }

        $this->joins[] = [
            'name'    => $name,
            'on'      => $on,
            'columns' => $columns,
            'type'    => $type ? $type : Join::JOIN_INNER
        ];

        return $this;
    }

    /**
     * Reset to an empty list of JOIN specifications.
     *
     * @return self Provides a fluent interface
     */
    public function reset()
    {
        $this->joins = [];
        return $this;
    }

    /**
     * Get count of attached predicates
     *
     * @return int
     */
    public function count()
    {
        return count($this->joins);
    }
}
