<?php

namespace Doctrine\Instantiator;

use Doctrine\Instantiator\Exception\ExceptionInterface;

/**
 * Instantiator provides utility methods to build objects without invoking their constructors
 */
interface InstantiatorInterface
{
    /**
     * @param string $className
     *
     * @return object
     *
     * @throws ExceptionInterface
     */
    public function instantiate($className);
}
