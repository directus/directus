<?php

/**
 * Directus – <http://getdirectus.com>
 *
 * @link      The canonical repository – <https://github.com/directus/directus>
 * @copyright Copyright 2006-2017 RANGER Studio, LLC – <http://rangerstudio.com>
 * @license   GNU General Public License (v3) – <http://www.gnu.org/copyleft/gpl.html>
 */

namespace Directus\Permissions\Exception;

use Directus\Exception\HttpExceptionInterface;
use Directus\Exception\Traits\HttpExceptionTrait;

/**
 * ACL Exception
 *
 * @author Daniel Bickett <daniel@rngr.org>
 */
abstract class AclException extends \Exception implements HttpExceptionInterface
{
    use HttpExceptionTrait;
    protected $httpStatus = 403;

}
