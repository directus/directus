<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2015 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace Zend\Stdlib\Guard;

use Traversable;

/**
 * Provide a guard method for array or Traversable data
 */
trait ArrayOrTraversableGuardTrait
{
    /**
     * Verifies that the data is an array or Traversable
     *
     * @param  mixed  $data           the data to verify
     * @param  string $dataName       the data name
     * @param  string $exceptionClass FQCN for the exception
     * @throws \Exception
     */
    protected function guardForArrayOrTraversable(
        $data,
        $dataName = 'Argument',
        $exceptionClass = 'Zend\Stdlib\Exception\InvalidArgumentException'
    ) {
        if (!is_array($data) && !($data instanceof Traversable)) {
            $message = sprintf(
                "%s must be an array or Traversable, [%s] given",
                $dataName,
                is_object($data) ? get_class($data) : gettype($data)
            );
            throw new $exceptionClass($message);
        }
    }
}
