<?php

declare(strict_types=1);

namespace GraphQL\Error;

use LogicException;

/**
 * Note:
 * This exception should not inherit base Error exception as it is raised when there is an error somewhere in
 * user-land code
 */
class InvariantViolation extends LogicException
{
}
