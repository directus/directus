<?php

namespace Zend\Db\Adapter\Driver\Pgsql;

/**
 * Closes a PostgreSQL connection
 *
 * @param resource $connection
 * @return bool
 * @see http://php.net/manual/en/function.pg-close.php
 */
function pg_close($connection = null)
{
    return true;
}
