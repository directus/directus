<?php

/**
 * Directus – <http://getdirectus.com>
 *
 * @link      The canonical repository – <https://github.com/directus/directus>
 * @copyright Copyright 2006-2017 RANGER Studio, LLC – <http://rangerstudio.com>
 * @license   GNU General Public License (v3) – <http://www.gnu.org/copyleft/gpl.html>
 */

namespace Directus\Authentication;

/**
 * Represents a user information
 *
 * @author Welling Guzmán <welling@rngr.org>
 */
interface UserInterface
{
    /**
     * Gets the user identification number
     *
     * @return int
     */
    public function getId();

    /**
     * Gets the user email
     *
     * @return string
     */
    public function getEmail();
}
