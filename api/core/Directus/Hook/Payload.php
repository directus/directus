<?php

/**
 * Directus – <http://getdirectus.com>
 *
 * @link      The canonical repository – <https://github.com/directus/directus>
 * @copyright Copyright 2006-2017 RANGER Studio, LLC – <http://rangerstudio.com>
 * @license   GNU General Public License (v3) – <http://www.gnu.org/copyleft/gpl.html>
 */

namespace Directus\Hook;

use Directus\Collection\Collection;

/**
 * The payload passed between filters
 *
 * @author Welling Guzmán <welling@rngr.org>
 */
class Payload extends Collection
{
    /**
     * @var array
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
     * Gets all the data
     *
     * @return array
     */
    public function getData()
    {
        return $this->items;
    }
}
