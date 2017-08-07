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
 * Coumn was not found in the database
 *
 * @author Welling Guzmán <welling@rngr.org>
 */
class ColumnNotFoundException extends DbException
{
    public function __construct($column, $message = '', $code = 0, Exception $previous = null)
    {
        if ($message === '') {
            $message = __t('unable_to_find_column_x', ['column' => $column]);
        }

        parent::__construct($message, $code, $previous);
    }
}
