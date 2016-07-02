<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2014 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace Zend\Stdlib;

use ArrayAccess;
use Countable;
use Serializable;
use Traversable;

/*
 * Basically, an ArrayObject. You could simply define something like:
 *     class QueryParams extends ArrayObject implements Parameters {}
 * and have 90% of the functionality
 */
interface ParametersInterface extends ArrayAccess, Countable, Serializable, Traversable
{
    /**
     * Constructor
     *
     * @param array $values
     */
    public function __construct(array $values = null);

    /**
     * From array
     *
     * Allow deserialization from standard array
     *
     * @param array $values
     * @return mixed
     */
    public function fromArray(array $values);

    /**
     * From string
     *
     * Allow deserialization from raw body; e.g., for PUT requests
     *
     * @param $string
     * @return mixed
     */
    public function fromString($string);

    /**
     * To array
     *
     * Allow serialization back to standard array
     *
     * @return mixed
     */
    public function toArray();

    /**
     * To string
     *
     * Allow serialization to query format; e.g., for PUT or POST requests
     *
     * @return mixed
     */
    public function toString();

    /**
     * Get
     *
     * @param string $name
     * @param mixed|null $default
     * @return mixed
     */
    public function get($name, $default = null);

    /**
     * Set
     *
     * @param string $name
     * @param mixed $value
     * @return ParametersInterface
     */
    public function set($name, $value);
}
