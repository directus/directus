<?php

declare(strict_types=1);

namespace GraphQL;

use function trigger_error;
use const E_USER_DEPRECATED;

trigger_error(
    'GraphQL\Schema is moved to GraphQL\Type\Schema',
    E_USER_DEPRECATED
);

/**
 * Schema Definition
 *
 * @deprecated moved to GraphQL\Type\Schema
 */
class Schema extends \GraphQL\Type\Schema
{
}
