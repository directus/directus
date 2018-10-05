<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\Component\Validator\Mapping;

use Symfony\Component\Validator\Exception\ValidatorException;

/**
 * Stores all metadata needed for validating a class property via its getter
 * method.
 *
 * A property getter is any method that is equal to the property's name,
 * prefixed with either "get" or "is". That method will be used to access the
 * property's value.
 *
 * The getter will be invoked by reflection, so the access of private and
 * protected getters is supported.
 *
 * This class supports serialization and cloning.
 *
 * @author Bernhard Schussek <bschussek@gmail.com>
 *
 * @see PropertyMetadataInterface
 */
class GetterMetadata extends MemberMetadata
{
    /**
     * @param string      $class    The class the getter is defined on
     * @param string      $property The property which the getter returns
     * @param string|null $method   The method that is called to retrieve the value being validated (null for auto-detection)
     *
     * @throws ValidatorException
     */
    public function __construct($class, $property, $method = null)
    {
        if (null === $method) {
            $getMethod = 'get'.ucfirst($property);
            $isMethod = 'is'.ucfirst($property);
            $hasMethod = 'has'.ucfirst($property);

            if (method_exists($class, $getMethod)) {
                $method = $getMethod;
            } elseif (method_exists($class, $isMethod)) {
                $method = $isMethod;
            } elseif (method_exists($class, $hasMethod)) {
                $method = $hasMethod;
            } else {
                throw new ValidatorException(sprintf('Neither of these methods exist in class %s: %s, %s, %s', $class, $getMethod, $isMethod, $hasMethod));
            }
        } elseif (!method_exists($class, $method)) {
            throw new ValidatorException(sprintf('The %s() method does not exist in class %s.', $method, $class));
        }

        parent::__construct($class, $method, $property);
    }

    /**
     * {@inheritdoc}
     */
    public function getPropertyValue($object)
    {
        return $this->newReflectionMember($object)->invoke($object);
    }

    /**
     * {@inheritdoc}
     */
    protected function newReflectionMember($objectOrClassName)
    {
        return new \ReflectionMethod($objectOrClassName, $this->getName());
    }
}
