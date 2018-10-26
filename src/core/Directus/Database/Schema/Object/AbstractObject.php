<?php

namespace Directus\Database\Schema\Object;

use Directus\Collection\Arrayable;
use Directus\Collection\Collection as Attributes;
use Directus\Exception\ErrorException;

abstract class AbstractObject implements \ArrayAccess, Arrayable, \JsonSerializable
{
    /**
     * @var \Directus\Collection\Collection
     */
    protected $attributes = [];

    public function __construct(array $attributes)
    {
        $this->attributes = new Attributes($attributes);
    }

    /**
     * @param mixed $offset
     *
     * @return bool
     */
    public function offsetExists($offset)
    {
        return $this->attributes->has($offset);
    }

    /**
     * @param mixed $offset
     *
     * @return mixed
     */
    public function offsetGet($offset)
    {
        return $this->attributes->get($offset);
    }

    /**
     * @param mixed $offset
     * @param mixed $value
     *
     * @return void
     *
     * @throws ErrorException
     */
    public function offsetSet($offset, $value)
    {
        throw new ErrorException('Cannot set any value in ' . get_class($this));
    }

    /**
     * @param mixed $offset
     *
     * @return void
     *
     * @throws ErrorException
     */
    public function offsetUnset($offset)
    {
        throw new ErrorException('Cannot unset any attribute in ' . get_class($this));
    }

    /**
     * @return array
     */
    public function toArray()
    {
        return $this->attributes->toArray();
    }

    /**
     * @inheritDoc
     */
    function jsonSerialize()
    {
        return $this->toArray();
    }
}
