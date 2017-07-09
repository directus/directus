<?php

/**
 * Directus – <http://getdirectus.com>
 *
 * @link      The canonical repository – <https://github.com/directus/directus>
 * @copyright Copyright 2006-2017 RANGER Studio, LLC – <http://rangerstudio.com>
 * @license   GNU General Public License (v3) – <http://www.gnu.org/copyleft/gpl.html>
 */

namespace Directus\Database\Exception;

use Exception;

/**
 * Table already exists in the database
 *
 * @author Welling Guzmán <welling@rngr.org>
 */
class TableAlreadyExistsException extends DbException
{
    public function __construct($table, $message = '', $code = 0, Exception $previous = null)
    {
        if ($message === '') {
            $message = __t('table_x_already_exists', ['table_name' => $table]);
        }

        parent::__construct($message, $code, $previous);
    }
}
