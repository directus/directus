<?php

namespace Directus\Database\Exception;

use Directus\Exception\Exception;

class StatusMappingEmptyException extends Exception
{
    public function __construct($collection)
    {
        parent::__construct(
            sprintf('"%s" collection status mapping is empty', $collection)
        );
    }
}
