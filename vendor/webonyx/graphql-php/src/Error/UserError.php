<?php

declare(strict_types=1);

namespace GraphQL\Error;

use RuntimeException;

/**
 * Error caused by actions of GraphQL clients. Can be safely displayed to a client...
 */
class UserError extends RuntimeException implements ClientAware
{
    /**
     * @return bool
     */
    public function isClientSafe()
    {
        return true;
    }

    /**
     * @return string
     */
    public function getCategory()
    {
        return 'user';
    }
}
