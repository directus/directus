<?php

namespace Directus\Container;

use Directus\Container\Exception\ValueNotFoundException;
use Psr\Container\ContainerInterface;

class Container extends \Pimple\Container implements ContainerInterface
{
    /**
     * @inheritDoc
     */
    public function has($offset)
    {
        return $this->offsetExists($offset);
    }

    /**
     * @inheritDoc
     */
    public function get($offset)
    {
        if (!$this->offsetExists($offset)) {
            throw new ValueNotFoundException(sprintf('The key "%s" is not defined.', $offset));
        }

        return $this->offsetGet($offset);
    }

    /**
     * @inheritDoc
     */
    public function set($offset, $value)
    {
        $this->offsetSet($offset, $value);
    }
}
