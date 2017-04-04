<?php

/**
 * Directus – <http://getdirectus.com>
 *
 * @link      The canonical repository – <https://github.com/directus/directus>
 * @copyright Copyright 2006-2017 RANGER Studio, LLC – <http://rangerstudio.com>
 * @license   GNU General Public License (v3) – <http://www.gnu.org/copyleft/gpl.html>
 */

namespace Directus\Exception;

/**
 * HTTP Exceptions
 *
 * @author Welling Guzmán <welling@rngr.org>
 */
class HttpException extends Exception
{
    protected $httpStatus;
    protected $httpHeaders;

    /**
     * Gets exception http status code
     *
     * @return mixed
     */
    public function getStatus()
    {
        return $this->httpStatus;
    }

    /**
     * Get exception http headers
     *
     * @return mixed
     */
    public function getHeaders()
    {
        return $this->httpHeaders;
    }
}
