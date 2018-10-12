<?php

namespace Directus\Config;

use Directus\Util\ArrayUtils;

class StatusItem
{
    /**
     * @var int
     */
    protected $value;

    /**
     * @var string
     */
    protected $name;

    /**
     * @var int
     */
    protected $sort;

    /**
     * @var array
     */
    protected $attributes;

    /**
     * @var array
     */
    protected $defaultAttributes = [
        'text_color' => '#000000',
        'background_color' => '#FFFFFF',
        'listing_subdued' => false,
        'listing_badge' => false,
        'soft_delete' => false,
        'hard_delete' => false,
    ];

    public function __construct($value, $name, $sort, array $attributes = [])
    {
        $this->value = $value;
        $this->name = $name;
        $this->sort = $sort;
        $this->attributes = array_merge($this->defaultAttributes, $attributes);
    }

    /**
     * @return int
     */
    public function getValue()
    {
        return $this->value;
    }

    /**
     * @return string
     */
    public function getName()
    {
        return $this->name;
    }

    /**
     * @return int
     */
    public function getSort()
    {
        return $this->sort;
    }

    /**
     * @return bool
     */
    public function isSoftDelete()
    {
        return $this->getAttribute('soft_delete') == true;
    }

    /**
     * @return array
     */
    public function getAttributes()
    {
        return $this->attributes;
    }

    /**
     * @param $key
     *
     * @return mixed
     */
    public function getAttribute($key)
    {
        return ArrayUtils::get($this->attributes, $key);
    }
}
