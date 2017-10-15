<?php

/**
 * Directus – <http://getdirectus.com>
 *
 * @link      The canonical repository – <https://github.com/directus/directus>
 * @copyright Copyright 2006-2017 RANGER Studio, LLC – <http://rangerstudio.com>
 * @license   GNU General Public License (v3) – <http://www.gnu.org/copyleft/gpl.html>
 */

namespace Directus\Database\Filters;

/**
 * Interface Filter
 *
 * @author Welling Guzmán <welling@rngr.org>
 */
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
