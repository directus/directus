<?php

/**
 * Directus – <http://getdirectus.com>
 *
 * @link      The canonical repository – <https://github.com/directus/directus>
 * @copyright Copyright 2006-2017 RANGER Studio, LLC – <http://rangerstudio.com>
 * @license   GNU General Public License (v3) – <http://www.gnu.org/copyleft/gpl.html>
 */

namespace Directus\Collection;

/**
 * Arrayable Interface
 *
 * @author Welling Guzmán <welling@rngr.org>
 */
interface Arrayable
{
    /**
     * Get the instance object as an array
     *
     * @return array
     */
    public function toArray();
}
