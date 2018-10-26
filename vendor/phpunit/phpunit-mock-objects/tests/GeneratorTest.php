<?php
/**
 * @covers PHPUnit_Framework_MockObject_Generator
 *
 * @uses PHPUnit_Framework_MockObject_InvocationMocker
 * @uses PHPUnit_Framework_MockObject_Builder_InvocationMocker
 * @uses PHPUnit_Framework_MockObject_Invocation_Object
 * @uses PHPUnit_Framework_MockObject_Invocation_Static
 * @uses PHPUnit_Framework_MockObject_Matcher
 * @uses PHPUnit_Framework_MockObject_Matcher_InvokedRecorder
 * @uses PHPUnit_Framework_MockObject_Matcher_MethodName
 * @uses PHPUnit_Framework_MockObject_Stub_Return
 * @uses PHPUnit_Framework_MockObject_Matcher_InvokedCount
 */
class Framework_MockObject_GeneratorTest extends PHPUnit_Framework_TestCase
{
    /**
     * @var PHPUnit_Framework_MockObject_Generator
     */
    private $generator;

    protected function setUp()
    {
        $this->generator = new PHPUnit_Framework_MockObject_Generator;
    }

    /**
     * @expectedException PHPUnit_Framework_MockObject_RuntimeException
     */
    public function testGetMockFailsWhenInvalidFunctionNameIsPassedInAsAFunctionToMock()
    {
        $this->generator->getMock(stdClass::class, [0]);
    }

    public function testGetMockCanCreateNonExistingFunctions()
    {
        $mock = $this->generator->getMock(stdClass::class, ['testFunction']);

        $this->assertTrue(method_exists($mock, 'testFunction'));
    }

    /**
     * @expectedException PHPUnit_Framework_MockObject_RuntimeException
     * @expectedExceptionMessage duplicates: "foo, bar, foo" (duplicate: "foo")
     */
    public function testGetMockGeneratorFails()
    {
        $this->generator->getMock(stdClass::class, ['foo', 'bar', 'foo']);
    }

    /**
     * @requires PHP 7
     */
    public function testGetMockBlacklistedMethodNamesPhp7()
    {
        $mock = $this->generator->getMock(InterfaceWithSemiReservedMethodName::class);

        $this->assertTrue(method_exists($mock, 'unset'));
        $this->assertInstanceOf(InterfaceWithSemiReservedMethodName::class, $mock);
    }

    public function testGetMockForAbstractClassDoesNotFailWhenFakingInterfaces()
    {
        $mock = $this->generator->getMockForAbstractClass(Countable::class);

        $this->assertTrue(method_exists($mock, 'count'));
    }

    public function testGetMockForAbstractClassStubbingAbstractClass()
    {
        $mock = $this->generator->getMockForAbstractClass(AbstractMockTestClass::class);

        $this->assertTrue(method_exists($mock, 'doSomething'));
    }

    public function testGetMockForAbstractClassWithNonExistentMethods()
    {
        $mock = $this->generator->getMockForAbstractClass(
            AbstractMockTestClass::class,
            [],
            '',
            true,
            true,
            true,
            ['nonexistentMethod']
        );

        $this->assertTrue(method_exists($mock, 'nonexistentMethod'));
        $this->assertTrue(method_exists($mock, 'doSomething'));
    }

    public function testGetMockForAbstractClassShouldCreateStubsOnlyForAbstractMethodWhenNoMethodsWereInformed()
    {
        $mock = $this->generator->getMockForAbstractClass(AbstractMockTestClass::class);

        $mock->expects($this->any())
             ->method('doSomething')
             ->willReturn('testing');

        $this->assertEquals('testing', $mock->doSomething());
        $this->assertEquals(1, $mock->returnAnything());
    }

    /**
     * @dataProvider getMockForAbstractClassExpectsInvalidArgumentExceptionDataprovider
     * @expectedException PHPUnit_Framework_Exception
     */
    public function testGetMockForAbstractClassExpectingInvalidArgumentException($className, $mockClassName)
    {
        $this->generator->getMockForAbstractClass($className, [], $mockClassName);
    }

    /**
     * @expectedException PHPUnit_Framework_MockObject_RuntimeException
     */
    public function testGetMockForAbstractClassAbstractClassDoesNotExist()
    {
        $this->generator->getMockForAbstractClass('Tux');
    }

    public function getMockForAbstractClassExpectsInvalidArgumentExceptionDataprovider()
    {
        return [
            'className not a string'     => [[], ''],
            'mockClassName not a string' => [Countable::class, new stdClass],
        ];
    }

    public function testGetMockForTraitWithNonExistentMethodsAndNonAbstractMethods()
    {
        $mock = $this->generator->getMockForTrait(
            AbstractTrait::class,
            [],
            '',
            true,
            true,
            true,
            ['nonexistentMethod']
        );

        $this->assertTrue(method_exists($mock, 'nonexistentMethod'));
        $this->assertTrue(method_exists($mock, 'doSomething'));
        $this->assertTrue($mock->mockableMethod());
        $this->assertTrue($mock->anotherMockableMethod());
    }

    public function testGetMockForTraitStubbingAbstractMethod()
    {
        $mock = $this->generator->getMockForTrait(AbstractTrait::class);

        $this->assertTrue(method_exists($mock, 'doSomething'));
    }

    public function testGetMockForSingletonWithReflectionSuccess()
    {
        $mock = $this->generator->getMock(SingletonClass::class, ['doSomething'], [], '', false);

        $this->assertInstanceOf('SingletonClass', $mock);
    }

    /**
     * @expectedException PHPUnit_Framework_MockObject_RuntimeException
     */
    public function testExceptionIsRaisedForMutuallyExclusiveOptions()
    {
        $this->generator->getMock(stdClass::class, [], [], '', false, true, true, true, true);
    }

    /**
     * @requires PHP 7
     */
    public function testCanImplementInterfacesThatHaveMethodsWithReturnTypes()
    {
        $stub = $this->generator->getMock([AnInterfaceWithReturnType::class, AnInterface::class]);

        $this->assertInstanceOf(AnInterfaceWithReturnType::class, $stub);
        $this->assertInstanceOf(AnInterface::class, $stub);
        $this->assertInstanceOf(PHPUnit_Framework_MockObject_MockObject::class, $stub);
    }

    public function testCanConfigureMethodsForDoubleOfNonExistentClass()
    {
        $className = 'X' . md5(microtime());

        $mock = $this->generator->getMock($className, ['someMethod']);

        $this->assertInstanceOf($className, $mock);
    }

    public function testCanInvokeMethodsOfNonExistentClass()
    {
        $className = 'X' . md5(microtime());

        $mock = $this->generator->getMock($className, ['someMethod']);

        $mock->expects($this->once())->method('someMethod');

        $this->assertNull($mock->someMethod());
    }
}
