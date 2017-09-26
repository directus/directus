<?php

/**
 * Directus – <http://getdirectus.com>
 *
 * @link      The canonical repository – <https://github.com/directus/directus>
 * @copyright Copyright 2006-2017 RANGER Studio, LLC – <http://rangerstudio.com>
 * @license   GNU General Public License (v3) – <http://www.gnu.org/copyleft/gpl.html>
 */

namespace Directus\Exception;

interface HttpExceptionInterface
{
    /**
     * Returns HTTP status code
     *
     * @return int
     */
    public function getHttpStatus();

    /**
     * Returns HTTP headers
     *
     * @return array headers
     */
    public function getHttpHeaders();
}
