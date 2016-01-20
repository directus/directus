<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2014 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace Zend\Stdlib\Hydrator;

use Zend\Stdlib\Exception;

class ArraySerializable extends AbstractHydrator
{

    /**
     * Extract values from the provided object
     *
     * Extracts values via the object's getArrayCopy() method.
     *
     * @param  object $object
     * @return array
     * @throws Exception\BadMethodCallException for an $object not implementing getArrayCopy()
     */
    public function extract($object)
    {
        if (!is_callable(array($object, 'getArrayCopy'))) {
            throw new Exception\BadMethodCallException(sprintf(
                '%s expects the provided object to implement getArrayCopy()', __METHOD__
            ));
        }

        $data = $object->getArrayCopy();

        foreach ($data as $name => $value) {
            if (!$this->getFilter()->filter($name)) {
                unset($data[$name]);
                continue;
            }

            $data[$name] = $this->extractValue($name, $value);
        }

        return $data;
    }

    /**
     * Hydrate an object
     *
     * Hydrates an object by passing $data to either its exchangeArray() or
     * populate() method.
     *
     * @param  array $data
     * @param  object $object
     * @return object
     * @throws Exception\BadMethodCallException for an $object not implementing exchangeArray() or populate()
     */
    public function hydrate(array $data, $object)
    {
        $self = $this;
        array_walk($data, function (&$value, $name) use ($self) {
            $value = $self->hydrateValue($name, $value);
        });

        if (is_callable(array($object, 'exchangeArray'))) {
            $object->exchangeArray($data);
        } elseif (is_callable(array($object, 'populate'))) {
            $object->populate($data);
        } else {
            throw new Exception\BadMethodCallException(sprintf(
                '%s expects the provided object to implement exchangeArray() or populate()', __METHOD__
            ));
        }
        return $object;
    }
}
