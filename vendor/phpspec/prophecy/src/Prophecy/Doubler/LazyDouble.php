<?php

/*
 * This file is part of the Prophecy.
 * (c) Konstantin Kudryashov <ever.zet@gmail.com>
 *     Marcello Duarte <marcello.duarte@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Prophecy\Doubler;

use Prophecy\Exception\Doubler\DoubleException;
use Prophecy\Exception\Doubler\ClassNotFoundException;
use Prophecy\Exception\Doubler\InterfaceNotFoundException;
use ReflectionClass;

/**
 * Lazy double.
 * Gives simple interface to describe double before creating it.
 *
 * @author Konstantin Kudryashov <ever.zet@gmail.com>
 */
class LazyDouble
{
    private $doubler;
    private $class;
    private $interfaces = array();
    private $arguments  = null;
    private $double;

    /**
     * Initializes lazy double.
     *
     * @param Doubler $doubler
     */
    public function __construct(Doubler $doubler)
    {
        $this->doubler = $doubler;
    }

    /**
     * Tells doubler to use specific class as parent one for double.
     *
     * @param string|ReflectionClass $class
     *
     * @throws \Prophecy\Exception\Doubler\ClassNotFoundException
     * @throws \Prophecy\Exception\Doubler\DoubleException
     */
    public function setParentClass($class)
    {
        if (null !== $this->double) {
            throw new DoubleException('Can not extend class with already instantiated double.');
        }

        if (!$class instanceof ReflectionClass) {
            if (!class_exists($class)) {
                throw new ClassNotFoundException(sprintf('Class %s not found.', $class), $class);
            }

            $class = new ReflectionClass($class);
        }

        $this->class = $class;
    }

    /**
     * Tells doubler to implement specific interface with double.
     *
     * @param string|ReflectionClass $interface
     *
     * @throws \Prophecy\Exception\Doubler\InterfaceNotFoundException
     * @throws \Prophecy\Exception\Doubler\DoubleException
     */
    public function addInterface($interface)
    {
        if (null !== $this->double) {
            throw new DoubleException(
                'Can not implement interface with already instantiated double.'
            );
        }

        if (!$interface instanceof ReflectionClass) {
            if (!interface_exists($interface)) {
                throw new InterfaceNotFoundException(
                    sprintf('Interface %s not found.', $interface),
                    $interface
                );
            }

            $interface = new ReflectionClass($interface);
        }

        $this->interfaces[] = $interface;
    }

    /**
     * Sets constructor arguments.
     *
     * @param array $arguments
     */
    public function setArguments(array $arguments = null)
    {
        $this->arguments = $arguments;
    }

    /**
     * Creates double instance or returns already created one.
     *
     * @return DoubleInterface
     */
    public function getInstance()
    {
        if (null === $this->double) {
            if (null !== $this->arguments) {
                return $this->double = $this->doubler->double(
                    $this->class, $this->interfaces, $this->arguments
                );
            }

            $this->double = $this->doubler->double($this->class, $this->interfaces);
        }

        return $this->double;
    }
}
