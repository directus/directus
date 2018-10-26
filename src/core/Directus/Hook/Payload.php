<?php

namespace Directus\Hook;

use Directus\Collection\Collection;

class Payload extends Collection
{
    /**
     * @var Collection
     */
    protected $attributes = [];

    public function __construct(array $data = [], array $attributes = [])
    {
        parent::__construct($data);

        $this->attributes = new Collection($attributes);
    }

    /**
     * Gets an attribute
     *
     * @param $key
     *
     * @return mixed
     */
    public function attribute($key)
    {
        return $this->attributes[$key];
    }

    /**
     * @return Collection
     */
    public function attributes()
    {
        return $this->attributes;
    }

    /**
     * Gets all the data
     *
     * @return array
     */
    public function getData()
    {
        return $this->items;
    }
}
