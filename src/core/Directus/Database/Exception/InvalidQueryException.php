<?php

namespace Directus\Database\Exception;

use Directus\Exception\ErrorException;

class InvalidQueryException extends ErrorException
{
    const ERROR_CODE = 9;

    /**
     * @var string
     */
    protected $query;

    /**
     * UnexpectedValueException constructor.
     *
     * @param string $query
     * @param \Exception|\Throwable $previous
     */
    public function __construct($query, $previous = null)
    {
        $error = $previous !== null ? '; error: '.$previous->getMessage() : '';
        parent::__construct("Failed generating the SQL query: $query$error", static::ERROR_CODE, $previous);
        $this->query = $query;
    }

    /**
     * @return string
     */
    public function getQuery()
    {
        return $this->query;
    }
}
