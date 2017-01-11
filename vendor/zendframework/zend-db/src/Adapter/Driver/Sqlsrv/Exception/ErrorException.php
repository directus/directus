<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace Zend\Db\Adapter\Driver\Sqlsrv\Exception;

use Zend\Db\Adapter\Exception;

class ErrorException extends Exception\ErrorException implements ExceptionInterface
{
    /**
     * Errors
     *
     * @var array
     */
    protected $errors = [];

    /**
     * Construct
     *
     * @param  bool $errors
     */
    public function __construct($errors = false)
    {
        $this->errors = ($errors === false) ? sqlsrv_errors() : $errors;
    }
}
