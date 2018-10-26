<?php

namespace Directus\Database\Exception;

use Directus\Exception\Exception;

class StatusMappingWrongValueTypeException extends Exception
{
    /**
     * @param string $type
     * @param int $field
     * @param string $collection
     */
    public function __construct($type, $field, $collection)
    {
        parent::__construct(
            sprintf(
                'Status Interface mapping must be a "%s" value for "%s" field in "%s"',
                $type,
                $field,
                $collection
            )
        );
    }
}
