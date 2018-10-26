<?php
class Framework_MockObject_Invocation_ObjectTest extends PHPUnit_Framework_TestCase
{
    public function testConstructorRequiresClassAndMethodAndParametersAndObject()
    {
        $this->assertInstanceOf(
            PHPUnit_Framework_MockObject_Invocation_Object::class,
            new PHPUnit_Framework_MockObject_Invocation_Object(
                'FooClass',
                'FooMethod',
                ['an_argument'],
                'ReturnType',
                new stdClass
            )
        );
    }

    public function testAllowToGetClassNameSetInConstructor()
    {
        $invocation = new PHPUnit_Framework_MockObject_Invocation_Object(
            'FooClass',
            'FooMethod',
            ['an_argument'],
            'ReturnType',
            new stdClass
        );

        $this->assertSame('FooClass', $invocation->className);
    }

    public function testAllowToGetMethodNameSetInConstructor()
    {
        $invocation = new PHPUnit_Framework_MockObject_Invocation_Object(
            'FooClass',
            'FooMethod',
            ['an_argument'],
            'ReturnType',
            new stdClass
        );

        $this->assertSame('FooMethod', $invocation->methodName);
    }

    public function testAllowToGetObjectSetInConstructor()
    {
        $expectedObject = new stdClass;

        $invocation = new PHPUnit_Framework_MockObject_Invocation_Object(
            'FooClass',
            'FooMethod',
            ['an_argument'],
            'ReturnType',
            $expectedObject
        );

        $this->assertSame($expectedObject, $invocation->object);
    }

    public function testAllowToGetMethodParametersSetInConstructor()
    {
        $expectedParameters = [
          'foo', 5, ['a', 'b'], new stdClass, null, false
        ];

        $invocation = new PHPUnit_Framework_MockObject_Invocation_Object(
            'FooClass',
            'FooMethod',
            $expectedParameters,
            'ReturnType',
            new stdClass
        );

        $this->assertSame($expectedParameters, $invocation->parameters);
    }

    public function testConstructorAllowToSetFlagCloneObjectsInParameters()
    {
        $parameters   = [new stdClass];
        $cloneObjects = true;

        $invocation = new PHPUnit_Framework_MockObject_Invocation_Object(
            'FooClass',
            'FooMethod',
            $parameters,
            'ReturnType',
            new stdClass,
            $cloneObjects
        );

        $this->assertEquals($parameters, $invocation->parameters);
        $this->assertNotSame($parameters, $invocation->parameters);
    }

    public function testAllowToGetReturnTypeSetInConstructor()
    {
        $expectedReturnType = 'string';

        $invocation = new PHPUnit_Framework_MockObject_Invocation_Object(
            'FooClass',
            'FooMethod',
            ['an_argument'],
            $expectedReturnType,
            new stdClass
        );

        $this->assertSame($expectedReturnType, $invocation->returnType);
    }
}
