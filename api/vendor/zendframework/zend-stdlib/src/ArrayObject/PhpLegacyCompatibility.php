<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2014 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace Zend\Stdlib\ArrayObject;

use ArrayObject as PhpArrayObject;

/**
 * ArrayObject
 *
 * Since we need to substitute an alternate ArrayObject implementation for
 * versions > 5.3.3, we need to provide a stub for 5.3.3. This stub
 * simply extends the PHP ArrayObject implementation, and provides default
 * behavior in the constructor.
 */
abstract class PhpLegacyCompatibility extends PhpArrayObject
{
    /**
     * Constructor
     *
     * @param array  $input
     * @param int    $flags
     * @param string $iteratorClass
     */
    public function __construct($input = array(), $flags = self::STD_PROP_LIST, $iteratorClass = 'ArrayIterator')
    {
        parent::__construct($input, $flags, $iteratorClass);
    }
}
