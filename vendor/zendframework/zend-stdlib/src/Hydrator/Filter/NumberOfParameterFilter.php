<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link           http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright      Copyright (c) 2005-2014 Zend Technologies USA Inc. (http://www.zend.com)
 * @license        http://framework.zend.com/license/new-bsd New BSD License
 */

namespace Zend\Stdlib\Hydrator\Filter;

use ReflectionException;
use ReflectionMethod;
use Zend\Stdlib\Exception\InvalidArgumentException;

class NumberOfParameterFilter implements FilterInterface
{
    /**
     * The number of parameters beeing accepted
     * @var int
     */
    protected $numberOfParameters = null;

    /**
     * @param int $numberOfParameters Number of accepted parameters
     */
    public function __construct($numberOfParameters = 0)
    {
        $this->numberOfParameters = 0;
    }

    /**
     * @param string $property the name of the property
     * @return bool
     * @throws InvalidArgumentException
     */
    public function filter($property)
    {
        try {
            $reflectionMethod = new ReflectionMethod($property);
        } catch (ReflectionException $exception) {
            throw new InvalidArgumentException(
                "Method $property doesn't exist"
            );
        }

        if ($reflectionMethod->getNumberOfParameters() !== $this->numberOfParameters) {
            return false;
        }

        return true;
    }
}
