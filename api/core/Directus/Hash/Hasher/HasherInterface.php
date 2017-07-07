<?php

/**
 * Directus – <http://getdirectus.com>
 *
 * @link      The canonical repository – <https://github.com/directus/directus>
 * @copyright Copyright 2006-2017 RANGER Studio, LLC – <http://rangerstudio.com>
 * @license   GNU General Public License (v3) – <http://www.gnu.org/copyleft/gpl.html>
 */

namespace Directus\Hash\Hasher;

/**
 * Hasher interface
 *
 * @author Welling Guzmán <welling@rngr.org>
 */
interface HasherInterface
{
    /**
     * Get the hasher unique name
     *
     * @return string
     */
    public function getName();

    /**
     * Hash the given string
     *
     * @param string $string
     * @param array $options
     *
     * @return string
     */
    public function hash($string, array $options = []);
}
