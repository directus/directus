<?php

namespace Directus\Database\Exception;

use Directus\Exception\UnprocessableEntityException;

class UnableSortAliasFieldException extends UnprocessableEntityException
{
    public function __construct($field)
    {
        parent::__construct(sprintf('Unable to sort by "%s" field because it is an alias.', $field));
    }
}
