<?php

/**
 * Directus – <http://getdirectus.com>
 *
 * @link      The canonical repository – <https://github.com/directus/directus>
 * @copyright Copyright 2006-2017 RANGER Studio, LLC – <http://rangerstudio.com>
 * @license   GNU General Public License (v3) – <http://www.gnu.org/copyleft/gpl.html>
 */

namespace Directus\Hash\Exception;

use Directus\Exception\Exception;

/**
 * Missing Hasher Exception
 *
 * @author Welling Guzmán <welling@rngr.org>
 */
class MissingHasherException extends Exception
{
    public function __construct($algo, $message = '', $code = 0, \Exception $previous = null)
    {
        if ($message === '') {
            $message = __t('hasher_x_not_found', ['name' => $algo]);
        }

        \Exception::__construct($message, $code, $previous);
    }
}
