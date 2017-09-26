<?php

/**
 * Directus – <http://getdirectus.com>
 *
 * @link      The canonical repository – <https://github.com/directus/directus>
 * @copyright Copyright 2006-2017 RANGER Studio, LLC – <http://rangerstudio.com>
 * @license   GNU General Public License (v3) – <http://www.gnu.org/copyleft/gpl.html>
 */

namespace Directus\Exception;

use Directus\Exception\Traits\HttpExceptionTrait;

/**
 * HTTP Exceptions
 *
 * @author Welling Guzmán <welling@rngr.org>
 */
class HttpException extends Exception implements HttpExceptionInterface
{
    use HttpExceptionTrait;

    protected $httpStatus = 500;
    protected $httpHeaders = '';
}
