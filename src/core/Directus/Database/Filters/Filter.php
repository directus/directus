<?php

namespace Directus\Database\Filters;

interface Filter
{
    /**
     * Get the array representation of the filter
     *
     * @return array
     */
    public function toArray();

    /**
     * Gets the filter identifier
     *
     * @return string
     */
    public function getIdentifier();

    /**
     * Gets the filter value
     *
     * @return mixed
     */
    public function getValue();
}
