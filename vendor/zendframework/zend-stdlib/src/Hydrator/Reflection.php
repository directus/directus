<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2014 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace Zend\Stdlib\Hydrator;

use ReflectionClass;
use Zend\Stdlib\Exception;

class Reflection extends AbstractHydrator
{
    /**
     * Simple in-memory array cache of ReflectionProperties used.
     * @var array
     */
    protected static $reflProperties = array();

    /**
     * Extract values from an object
     *
     * @param  object $object
     * @return array
     */
    public function extract($object)
    {
        $result = array();
        foreach (self::getReflProperties($object) as $property) {
            $propertyName = $property->getName();
            if (!$this->filterComposite->filter($propertyName)) {
                continue;
            }

            $value = $property->getValue($object);
            $result[$propertyName] = $this->extractValue($propertyName, $value, $object);
        }

        return $result;
    }

    /**
     * Hydrate $object with the provided $data.
     *
     * @param  array $data
     * @param  object $object
     * @return object
     */
    public function hydrate(array $data, $object)
    {
        $reflProperties = self::getReflProperties($object);
        foreach ($data as $key => $value) {
            if (isset($reflProperties[$key])) {
                $reflProperties[$key]->setValue($object, $this->hydrateValue($key, $value, $data));
            }
        }
        return $object;
    }

    /**
     * Get a reflection properties from in-memory cache and lazy-load if
     * class has not been loaded.
     *
     * @param  string|object $input
     * @throws Exception\InvalidArgumentException
     * @return array
     */
    protected static function getReflProperties($input)
    {
        if (is_object($input)) {
            $input = get_class($input);
        } elseif (!is_string($input)) {
            throw new Exception\InvalidArgumentException('Input must be a string or an object.');
        }

        if (isset(static::$reflProperties[$input])) {
            return static::$reflProperties[$input];
        }

        static::$reflProperties[$input] = array();
        $reflClass                      = new ReflectionClass($input);
        $reflProperties                 = $reflClass->getProperties();

        foreach ($reflProperties as $property) {
            $property->setAccessible(true);
            static::$reflProperties[$input][$property->getName()] = $property;
        }

        return static::$reflProperties[$input];
    }
}
