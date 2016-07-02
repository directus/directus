<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2014 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace Zend\Stdlib;

use ArrayIterator;
use ArrayObject as PhpArrayObject;

/**
 * ArrayObject that acts as a stack with regards to iteration
 */
class ArrayStack extends PhpArrayObject
{
    /**
     * Retrieve iterator
     *
     * Retrieve an array copy of the object, reverse its order, and return an
     * ArrayIterator with that reversed array.
     *
     * @return ArrayIterator
     */
    public function getIterator()
    {
        $array = $this->getArrayCopy();
        return new ArrayIterator(array_reverse($array));
    }
}
