<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2014 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace Zend\Stdlib;

interface ParameterObjectInterface
{
    /**
     * @param string $key
     * @param mixed $value
     * @return void
     */
    public function __set($key, $value);

    /**
     * @param string $key
     * @return mixed
     */
    public function __get($key);

    /**
     * @param string $key
     * @return bool
     */
    public function __isset($key);

    /**
     * @param string $key
     * @return void
     */
    public function __unset($key);
}
