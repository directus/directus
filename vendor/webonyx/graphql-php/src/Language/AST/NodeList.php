<?php

declare(strict_types=1);

namespace GraphQL\Language\AST;

use ArrayAccess;
use Countable;
use Generator;
use GraphQL\Utils\AST;
use IteratorAggregate;
use function array_merge;
use function array_splice;
use function count;
use function is_array;

class NodeList implements ArrayAccess, IteratorAggregate, Countable
{
    /** @var Node[]|mixed[] */
    private $nodes;

    /**
     * @param Node[]|mixed[] $nodes
     *
     * @return static
     */
    public static function create(array $nodes)
    {
        return new static($nodes);
    }

    /**
     * @param Node[]|mixed[] $nodes
     */
    public function __construct(array $nodes)
    {
        $this->nodes = $nodes;
    }

    /**
     * @param mixed $offset
     *
     * @return bool
     */
    public function offsetExists($offset)
    {
        return isset($this->nodes[$offset]);
    }

    /**
     * @param mixed $offset
     *
     * @return mixed
     */
    public function offsetGet($offset)
    {
        $item = $this->nodes[$offset];

        if (is_array($item) && isset($item['kind'])) {
            $this->nodes[$offset] = $item = AST::fromArray($item);
        }

        return $item;
    }

    /**
     * @param mixed $offset
     * @param mixed $value
     */
    public function offsetSet($offset, $value)
    {
        if (is_array($value) && isset($value['kind'])) {
            $value = AST::fromArray($value);
        }
        $this->nodes[$offset] = $value;
    }

    /**
     * @param mixed $offset
     */
    public function offsetUnset($offset)
    {
        unset($this->nodes[$offset]);
    }

    /**
     * @param int   $offset
     * @param int   $length
     * @param mixed $replacement
     *
     * @return NodeList
     */
    public function splice($offset, $length, $replacement = null)
    {
        return new NodeList(array_splice($this->nodes, $offset, $length, $replacement));
    }

    /**
     * @param NodeList|Node[] $list
     *
     * @return NodeList
     */
    public function merge($list)
    {
        if ($list instanceof self) {
            $list = $list->nodes;
        }

        return new NodeList(array_merge($this->nodes, $list));
    }

    /**
     * @return Generator
     */
    public function getIterator()
    {
        foreach ($this->nodes as $key => $_) {
            yield $this->offsetGet($key);
        }
    }

    /**
     * @return int
     */
    public function count()
    {
        return count($this->nodes);
    }
}
