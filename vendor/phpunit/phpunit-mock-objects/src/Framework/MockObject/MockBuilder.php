<?php
/*
 * This file is part of the PHPUnit_MockObject package.
 *
 * (c) Sebastian Bergmann <sebastian@phpunit.de>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * Implementation of the Builder pattern for Mock objects.
 *
 * @since File available since Release 1.0.0
 */
class PHPUnit_Framework_MockObject_MockBuilder
{
    /**
     * @var PHPUnit_Framework_TestCase
     */
    private $testCase;

    /**
     * @var string
     */
    private $type;

    /**
     * @var array
     */
    private $methods = [];

    /**
     * @var array
     */
    private $methodsExcept = [];

    /**
     * @var string
     */
    private $mockClassName = '';

    /**
     * @var array
     */
    private $constructorArgs = [];

    /**
     * @var bool
     */
    private $originalConstructor = true;

    /**
     * @var bool
     */
    private $originalClone = true;

    /**
     * @var bool
     */
    private $autoload = true;

    /**
     * @var bool
     */
    private $cloneArguments = false;

    /**
     * @var bool
     */
    private $callOriginalMethods = false;

    /**
     * @var object
     */
    private $proxyTarget = null;

    /**
     * @var bool
     */
    private $allowMockingUnknownTypes = true;

    /**
     * @var PHPUnit_Framework_MockObject_Generator
     */
    private $generator;

    /**
     * @param PHPUnit_Framework_TestCase $testCase
     * @param array|string               $type
     */
    public function __construct(PHPUnit_Framework_TestCase $testCase, $type)
    {
        $this->testCase  = $testCase;
        $this->type      = $type;
        $this->generator = new PHPUnit_Framework_MockObject_Generator;
    }

    /**
     * Creates a mock object using a fluent interface.
     *
     * @return PHPUnit_Framework_MockObject_MockObject
     */
    public function getMock()
    {
        $object = $this->generator->getMock(
            $this->type,
            $this->methods,
            $this->constructorArgs,
            $this->mockClassName,
            $this->originalConstructor,
            $this->originalClone,
            $this->autoload,
            $this->cloneArguments,
            $this->callOriginalMethods,
            $this->proxyTarget,
            $this->allowMockingUnknownTypes
        );

        $this->testCase->registerMockObject($object);

        return $object;
    }

    /**
     * Creates a mock object for an abstract class using a fluent interface.
     *
     * @return PHPUnit_Framework_MockObject_MockObject
     */
    public function getMockForAbstractClass()
    {
        $object = $this->generator->getMockForAbstractClass(
            $this->type,
            $this->constructorArgs,
            $this->mockClassName,
            $this->originalConstructor,
            $this->originalClone,
            $this->autoload,
            $this->methods,
            $this->cloneArguments
        );

        $this->testCase->registerMockObject($object);

        return $object;
    }

    /**
     * Creates a mock object for a trait using a fluent interface.
     *
     * @return PHPUnit_Framework_MockObject_MockObject
     */
    public function getMockForTrait()
    {
        $object = $this->generator->getMockForTrait(
            $this->type,
            $this->constructorArgs,
            $this->mockClassName,
            $this->originalConstructor,
            $this->originalClone,
            $this->autoload,
            $this->methods,
            $this->cloneArguments
        );

        $this->testCase->registerMockObject($object);

        return $object;
    }

    /**
     * Specifies the subset of methods to mock. Default is to mock all of them.
     *
     * @param array|null $methods
     *
     * @return PHPUnit_Framework_MockObject_MockBuilder
     */
    public function setMethods(array $methods = null)
    {
        $this->methods = $methods;

        return $this;
    }

    /**
     * Specifies the subset of methods to not mock. Default is to mock all of them.
     *
     * @param array $methods
     *
     * @return PHPUnit_Framework_MockObject_MockBuilder
     */
    public function setMethodsExcept(array $methods = [])
    {
        $this->methodsExcept = $methods;

        $this->setMethods(
            array_diff(
                $this->generator->getClassMethods($this->type),
                $this->methodsExcept
            )
        );

        return $this;
    }

    /**
     * Specifies the arguments for the constructor.
     *
     * @param array $args
     *
     * @return PHPUnit_Framework_MockObject_MockBuilder
     */
    public function setConstructorArgs(array $args)
    {
        $this->constructorArgs = $args;

        return $this;
    }

    /**
     * Specifies the name for the mock class.
     *
     * @param string $name
     *
     * @return PHPUnit_Framework_MockObject_MockBuilder
     */
    public function setMockClassName($name)
    {
        $this->mockClassName = $name;

        return $this;
    }

    /**
     * Disables the invocation of the original constructor.
     *
     * @return PHPUnit_Framework_MockObject_MockBuilder
     */
    public function disableOriginalConstructor()
    {
        $this->originalConstructor = false;

        return $this;
    }

    /**
     * Enables the invocation of the original constructor.
     *
     * @return PHPUnit_Framework_MockObject_MockBuilder
     *
     * @since  Method available since Release 1.2.0
     */
    public function enableOriginalConstructor()
    {
        $this->originalConstructor = true;

        return $this;
    }

    /**
     * Disables the invocation of the original clone constructor.
     *
     * @return PHPUnit_Framework_MockObject_MockBuilder
     */
    public function disableOriginalClone()
    {
        $this->originalClone = false;

        return $this;
    }

    /**
     * Enables the invocation of the original clone constructor.
     *
     * @return PHPUnit_Framework_MockObject_MockBuilder
     *
     * @since  Method available since Release 1.2.0
     */
    public function enableOriginalClone()
    {
        $this->originalClone = true;

        return $this;
    }

    /**
     * Disables the use of class autoloading while creating the mock object.
     *
     * @return PHPUnit_Framework_MockObject_MockBuilder
     */
    public function disableAutoload()
    {
        $this->autoload = false;

        return $this;
    }

    /**
     * Enables the use of class autoloading while creating the mock object.
     *
     * @return PHPUnit_Framework_MockObject_MockBuilder
     *
     * @since  Method available since Release 1.2.0
     */
    public function enableAutoload()
    {
        $this->autoload = true;

        return $this;
    }

    /**
     * Disables the cloning of arguments passed to mocked methods.
     *
     * @return PHPUnit_Framework_MockObject_MockBuilder
     *
     * @since  Method available since Release 1.2.0
     */
    public function disableArgumentCloning()
    {
        $this->cloneArguments = false;

        return $this;
    }

    /**
     * Enables the cloning of arguments passed to mocked methods.
     *
     * @return PHPUnit_Framework_MockObject_MockBuilder
     *
     * @since  Method available since Release 1.2.0
     */
    public function enableArgumentCloning()
    {
        $this->cloneArguments = true;

        return $this;
    }

    /**
     * Enables the invocation of the original methods.
     *
     * @return PHPUnit_Framework_MockObject_MockBuilder
     *
     * @since  Method available since Release 2.0.0
     */
    public function enableProxyingToOriginalMethods()
    {
        $this->callOriginalMethods = true;

        return $this;
    }

    /**
     * Disables the invocation of the original methods.
     *
     * @return PHPUnit_Framework_MockObject_MockBuilder
     *
     * @since  Method available since Release 2.0.0
     */
    public function disableProxyingToOriginalMethods()
    {
        $this->callOriginalMethods = false;
        $this->proxyTarget         = null;

        return $this;
    }

    /**
     * Sets the proxy target.
     *
     * @param object $object
     *
     * @return PHPUnit_Framework_MockObject_MockBuilder
     *
     * @since  Method available since Release 2.0.0
     */
    public function setProxyTarget($object)
    {
        $this->proxyTarget = $object;

        return $this;
    }

    /**
     * @return PHPUnit_Framework_MockObject_MockBuilder
     *
     * @since  Method available since Release 3.2.0
     */
    public function allowMockingUnknownTypes()
    {
        $this->allowMockingUnknownTypes = true;

        return $this;
    }

    /**
     * @return PHPUnit_Framework_MockObject_MockBuilder
     *
     * @since  Method available since Release 3.2.0
     */
    public function disallowMockingUnknownTypes()
    {
        $this->allowMockingUnknownTypes = false;

        return $this;
    }
}
