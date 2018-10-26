<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2015 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace Zend\Stdlib\Guard;

/**
 * Provide a guard method against null data
 */
trait NullGuardTrait
{
    /**
     * Verify that the data is not null
     *
     * @param  mixed  $data           the data to verify
     * @param  string $dataName       the data name
     * @param  string $exceptionClass FQCN for the exception
     * @throws \Exception
     */
    protected function guardAgainstNull(
        $data,
        $dataName = 'Argument',
        $exceptionClass = 'Zend\Stdlib\Exception\InvalidArgumentException'
    ) {
        if (null === $data) {
            $message = sprintf('%s cannot be null', $dataName);
            throw new $exceptionClass($message);
        }
    }
}
