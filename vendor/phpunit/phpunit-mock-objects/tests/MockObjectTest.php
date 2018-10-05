<?php
/*
 * This file is part of the PHPUnit_MockObject package.
 *
 * (c) Sebastian Bergmann <sebastian@phpunit.de>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

class Framework_MockObjectTest extends PHPUnit_Framework_TestCase
{
    public function testMockedMethodIsNeverCalled()
    {
        $mock = $this->getMockBuilder(AnInterface::class)
                     ->getMock();

        $mock->expects($this->never())
             ->method('doSomething');
    }

    public function testMockedMethodIsNeverCalledWithParameter()
    {
        $mock = $this->getMockBuilder(SomeClass::class)
                     ->getMock();

        $mock->expects($this->never())
             ->method('doSomething')
             ->with('someArg');
    }

    /**
     * @doesNotPerformAssertions
     */
    public function testMockedMethodIsNotCalledWhenExpectsAnyWithParameter()
    {
        $mock = $this->getMockBuilder(SomeClass::class)
                     ->getMock();

        $mock->expects($this->any())
             ->method('doSomethingElse')
             ->with('someArg');
    }

    /**
     * @doesNotPerformAssertions
     */
    public function testMockedMethodIsNotCalledWhenMethodSpecifiedDirectlyWithParameter()
    {
        $mock = $this->getMockBuilder(SomeClass::class)
                     ->getMock();

        $mock->method('doSomethingElse')
             ->with('someArg');
    }

    public function testMockedMethodIsCalledAtLeastOnce()
    {
        $mock = $this->getMockBuilder(AnInterface::class)
                     ->getMock();

        $mock->expects($this->atLeastOnce())
             ->method('doSomething');

        $mock->doSomething();
    }

    public function testMockedMethodIsCalledAtLeastOnce2()
    {
        $mock = $this->getMockBuilder(AnInterface::class)
                     ->getMock();

        $mock->expects($this->atLeastOnce())
             ->method('doSomething');

        $mock->doSomething();
        $mock->doSomething();
    }

    public function testMockedMethodIsCalledAtLeastTwice()
    {
        $mock = $this->getMockBuilder(AnInterface::class)
                     ->getMock();

        $mock->expects($this->atLeast(2))
             ->method('doSomething');

        $mock->doSomething();
        $mock->doSomething();
    }

    public function testMockedMethodIsCalledAtLeastTwice2()
    {
        $mock = $this->getMockBuilder(AnInterface::class)
                     ->getMock();

        $mock->expects($this->atLeast(2))
             ->method('doSomething');

        $mock->doSomething();
        $mock->doSomething();
        $mock->doSomething();
    }

    public function testMockedMethodIsCalledAtMostTwice()
    {
        $mock = $this->getMockBuilder(AnInterface::class)
                     ->getMock();

        $mock->expects($this->atMost(2))
             ->method('doSomething');

        $mock->doSomething();
        $mock->doSomething();
    }

    public function testMockedMethodIsCalledAtMosttTwice2()
    {
        $mock = $this->getMockBuilder(AnInterface::class)
                     ->getMock();

        $mock->expects($this->atMost(2))
             ->method('doSomething');

        $mock->doSomething();
    }

    public function testMockedMethodIsCalledOnce()
    {
        $mock = $this->getMockBuilder(AnInterface::class)
                     ->getMock();

        $mock->expects($this->once())
             ->method('doSomething');

        $mock->doSomething();
    }

    public function testMockedMethodIsCalledOnceWithParameter()
    {
        $mock = $this->getMockBuilder(SomeClass::class)
                     ->getMock();

        $mock->expects($this->once())
             ->method('doSomethingElse')
             ->with($this->equalTo('something'));

        $mock->doSomethingElse('something');
    }

    public function testMockedMethodIsCalledExactly()
    {
        $mock = $this->getMockBuilder(AnInterface::class)
                     ->getMock();

        $mock->expects($this->exactly(2))
             ->method('doSomething');

        $mock->doSomething();
        $mock->doSomething();
    }

    public function testStubbedException()
    {
        $mock = $this->getMockBuilder(AnInterface::class)
                     ->getMock();

        $mock->expects($this->any())
             ->method('doSomething')
             ->will($this->throwException(new Exception));

        $this->expectException(Exception::class);

        $mock->doSomething();
    }

    public function testStubbedWillThrowException()
    {
        $mock = $this->getMockBuilder(AnInterface::class)
                     ->getMock();

        $mock->expects($this->any())
             ->method('doSomething')
             ->willThrowException(new Exception);

        $this->expectException(Exception::class);

        $mock->doSomething();
    }

    public function testStubbedReturnValue()
    {
        $mock = $this->getMockBuilder(AnInterface::class)
                     ->getMock();

        $mock->expects($this->any())
             ->method('doSomething')
             ->will($this->returnValue('something'));

        $this->assertEquals('something', $mock->doSomething());

        $mock = $this->getMockBuilder(AnInterface::class)
                     ->getMock();

        $mock->expects($this->any())
             ->method('doSomething')
             ->willReturn('something');

        $this->assertEquals('something', $mock->doSomething());
    }

    public function testStubbedReturnValueMap()
    {
        $map = [
            ['a', 'b', 'c', 'd'],
            ['e', 'f', 'g', 'h']
        ];

        $mock = $this->getMockBuilder(AnInterface::class)
                     ->getMock();

        $mock->expects($this->any())
             ->method('doSomething')
             ->will($this->returnValueMap($map));

        $this->assertEquals('d', $mock->doSomething('a', 'b', 'c'));
        $this->assertEquals('h', $mock->doSomething('e', 'f', 'g'));
        $this->assertEquals(null, $mock->doSomething('foo', 'bar'));

        $mock = $this->getMockBuilder(AnInterface::class)
                     ->getMock();

        $mock->expects($this->any())
             ->method('doSomething')
             ->willReturnMap($map);

        $this->assertEquals('d', $mock->doSomething('a', 'b', 'c'));
        $this->assertEquals('h', $mock->doSomething('e', 'f', 'g'));
        $this->assertEquals(null, $mock->doSomething('foo', 'bar'));
    }

    public function testStubbedReturnArgument()
    {
        $mock = $this->getMockBuilder(AnInterface::class)
                     ->getMock();

        $mock->expects($this->any())
             ->method('doSomething')
             ->will($this->returnArgument(1));

        $this->assertEquals('b', $mock->doSomething('a', 'b'));

        $mock = $this->getMockBuilder(AnInterface::class)
                     ->getMock();

        $mock->expects($this->any())
             ->method('doSomething')
             ->willReturnArgument(1);

        $this->assertEquals('b', $mock->doSomething('a', 'b'));
    }

    public function testFunctionCallback()
    {
        $mock = $this->getMockBuilder(SomeClass::class)
                     ->setMethods(['doSomething'])
                     ->getMock();

        $mock->expects($this->once())
             ->method('doSomething')
             ->will($this->returnCallback('functionCallback'));

        $this->assertEquals('pass', $mock->doSomething('foo', 'bar'));

        $mock = $this->getMockBuilder(SomeClass::class)
                     ->setMethods(['doSomething'])
                     ->getMock();

        $mock->expects($this->once())
             ->method('doSomething')
             ->willReturnCallback('functionCallback');

        $this->assertEquals('pass', $mock->doSomething('foo', 'bar'));
    }

    public function testStubbedReturnSelf()
    {
        $mock = $this->getMockBuilder(AnInterface::class)
                     ->getMock();

        $mock->expects($this->any())
             ->method('doSomething')
             ->will($this->returnSelf());

        $this->assertEquals($mock, $mock->doSomething());

        $mock = $this->getMockBuilder(AnInterface::class)
                     ->getMock();

        $mock->expects($this->any())
             ->method('doSomething')
             ->willReturnSelf();

        $this->assertEquals($mock, $mock->doSomething());
    }

    public function testStubbedReturnOnConsecutiveCalls()
    {
        $mock = $this->getMockBuilder(AnInterface::class)
                     ->getMock();

        $mock->expects($this->any())
             ->method('doSomething')
             ->will($this->onConsecutiveCalls('a', 'b', 'c'));

        $this->assertEquals('a', $mock->doSomething());
        $this->assertEquals('b', $mock->doSomething());
        $this->assertEquals('c', $mock->doSomething());

        $mock = $this->getMockBuilder(AnInterface::class)
                     ->getMock();

        $mock->expects($this->any())
             ->method('doSomething')
             ->willReturnOnConsecutiveCalls('a', 'b', 'c');

        $this->assertEquals('a', $mock->doSomething());
        $this->assertEquals('b', $mock->doSomething());
        $this->assertEquals('c', $mock->doSomething());
    }

    public function testStaticMethodCallback()
    {
        $mock = $this->getMockBuilder(SomeClass::class)
                     ->setMethods(['doSomething'])
                     ->getMock();

        $mock->expects($this->once())
             ->method('doSomething')
             ->will($this->returnCallback(['MethodCallback', 'staticCallback']));

        $this->assertEquals('pass', $mock->doSomething('foo', 'bar'));
    }

    public function testPublicMethodCallback()
    {
        $mock = $this->getMockBuilder(SomeClass::class)
                     ->setMethods(['doSomething'])
                     ->getMock();

        $mock->expects($this->once())
             ->method('doSomething')
             ->will($this->returnCallback([new MethodCallback, 'nonStaticCallback']));

        $this->assertEquals('pass', $mock->doSomething('foo', 'bar'));
    }

    public function testMockClassOnlyGeneratedOnce()
    {
        $mock1 = $this->getMockBuilder(AnInterface::class)
                     ->getMock();

        $mock2 = $this->getMockBuilder(AnInterface::class)
                     ->getMock();

        $this->assertEquals(get_class($mock1), get_class($mock2));
    }

    public function testMockClassDifferentForPartialMocks()
    {
        $mock1 = $this->getMockBuilder(PartialMockTestClass::class)
                      ->getMock();

        $mock2 = $this->getMockBuilder(PartialMockTestClass::class)
                      ->setMethods(['doSomething'])
                      ->getMock();

        $mock3 = $this->getMockBuilder(PartialMockTestClass::class)
                      ->setMethods(['doSomething'])
                      ->getMock();

        $mock4 = $this->getMockBuilder(PartialMockTestClass::class)
                      ->setMethods(['doAnotherThing'])
                      ->getMock();

        $mock5 = $this->getMockBuilder(PartialMockTestClass::class)
                      ->setMethods(['doAnotherThing'])
                      ->getMock();

        $this->assertNotEquals(get_class($mock1), get_class($mock2));
        $this->assertNotEquals(get_class($mock1), get_class($mock3));
        $this->assertNotEquals(get_class($mock1), get_class($mock4));
        $this->assertNotEquals(get_class($mock1), get_class($mock5));
        $this->assertEquals(get_class($mock2), get_class($mock3));
        $this->assertNotEquals(get_class($mock2), get_class($mock4));
        $this->assertNotEquals(get_class($mock2), get_class($mock5));
        $this->assertEquals(get_class($mock4), get_class($mock5));
    }

    public function testMockClassStoreOverrulable()
    {
        $mock1 = $this->getMockBuilder(PartialMockTestClass::class)
                      ->getMock();

        $mock2 = $this->getMockBuilder(PartialMockTestClass::class)
                      ->setMockClassName('MyMockClassNameForPartialMockTestClass1')
                      ->getMock();

        $mock3 = $this->getMockBuilder(PartialMockTestClass::class)
                      ->getMock();

        $mock4 = $this->getMockBuilder(PartialMockTestClass::class)
                      ->setMethods(['doSomething'])
                      ->setMockClassName('AnotherMockClassNameForPartialMockTestClass')
                      ->getMock();

        $mock5 = $this->getMockBuilder(PartialMockTestClass::class)
                      ->setMockClassName('MyMockClassNameForPartialMockTestClass2')
                      ->getMock();

        $this->assertNotEquals(get_class($mock1), get_class($mock2));
        $this->assertEquals(get_class($mock1), get_class($mock3));
        $this->assertNotEquals(get_class($mock1), get_class($mock4));
        $this->assertNotEquals(get_class($mock2), get_class($mock3));
        $this->assertNotEquals(get_class($mock2), get_class($mock4));
        $this->assertNotEquals(get_class($mock2), get_class($mock5));
        $this->assertNotEquals(get_class($mock3), get_class($mock4));
        $this->assertNotEquals(get_class($mock3), get_class($mock5));
        $this->assertNotEquals(get_class($mock4), get_class($mock5));
    }

    public function testGetMockWithFixedClassNameCanProduceTheSameMockTwice()
    {
        $mock = $this->getMockBuilder(stdClass::class)->setMockClassName('FixedName')->getMock();
        $mock = $this->getMockBuilder(stdClass::class)->setMockClassName('FixedName')->getMock();
        $this->assertInstanceOf(stdClass::class, $mock);
    }

    public function testOriginalConstructorSettingConsidered()
    {
        $mock1 = $this->getMockBuilder(PartialMockTestClass::class)
                      ->getMock();

        $mock2 = $this->getMockBuilder(PartialMockTestClass::class)
                      ->disableOriginalConstructor()
                      ->getMock();

        $this->assertTrue($mock1->constructorCalled);
        $this->assertFalse($mock2->constructorCalled);
    }

    public function testOriginalCloneSettingConsidered()
    {
        $mock1 = $this->getMockBuilder(PartialMockTestClass::class)
                      ->getMock();

        $mock2 = $this->getMockBuilder(PartialMockTestClass::class)
                      ->disableOriginalClone()
                      ->getMock();

        $this->assertNotEquals(get_class($mock1), get_class($mock2));
    }

    public function testGetMockForAbstractClass()
    {
        $mock = $this->getMockBuilder(AbstractMockTestClass::class)
                     ->getMock();

        $mock->expects($this->never())
             ->method('doSomething');
    }

    /**
     * @dataProvider traversableProvider
     */
    public function testGetMockForTraversable($type)
    {
        $mock = $this->getMockBuilder($type)
                     ->getMock();

        $this->assertInstanceOf(Traversable::class, $mock);
    }

    public function testMultipleInterfacesCanBeMockedInSingleObject()
    {
        $mock = $this->getMockBuilder([AnInterface::class, AnotherInterface::class])
                     ->getMock();

        $this->assertInstanceOf(AnInterface::class, $mock);
        $this->assertInstanceOf(AnotherInterface::class, $mock);
    }

    public function testGetMockForTrait()
    {
        $mock = $this->getMockForTrait(AbstractTrait::class);

        $mock->expects($this->never())
             ->method('doSomething');

        $parent = get_parent_class($mock);
        $traits = class_uses($parent, false);

        $this->assertContains(AbstractTrait::class, $traits);
    }

    public function testClonedMockObjectShouldStillEqualTheOriginal()
    {
        $a = $this->getMockBuilder(stdClass::class)
                  ->getMock();

        $b = clone $a;

        $this->assertEquals($a, $b);
    }

    public function testMockObjectsConstructedIndepentantlyShouldBeEqual()
    {
        $a = $this->getMockBuilder(stdClass::class)
                  ->getMock();

        $b = $this->getMockBuilder(stdClass::class)
                  ->getMock();

        $this->assertEquals($a, $b);
    }

    public function testMockObjectsConstructedIndepentantlyShouldNotBeTheSame()
    {
        $a = $this->getMockBuilder(stdClass::class)
                  ->getMock();

        $b = $this->getMockBuilder(stdClass::class)
                  ->getMock();

        $this->assertNotSame($a, $b);
    }

    public function testClonedMockObjectCanBeUsedInPlaceOfOriginalOne()
    {
        $x = $this->getMockBuilder(stdClass::class)
                  ->getMock();

        $y = clone $x;

        $mock = $this->getMockBuilder(stdClass::class)
                     ->setMethods(['foo'])
                     ->getMock();

        $mock->expects($this->once())
             ->method('foo')
             ->with($this->equalTo($x));

        $mock->foo($y);
    }

    public function testClonedMockObjectIsNotIdenticalToOriginalOne()
    {
        $x = $this->getMockBuilder(stdClass::class)
                  ->getMock();

        $y = clone $x;

        $mock = $this->getMockBuilder(stdClass::class)
                     ->setMethods(['foo'])
                     ->getMock();

        $mock->expects($this->once())
             ->method('foo')
             ->with($this->logicalNot($this->identicalTo($x)));

        $mock->foo($y);
    }

    public function testObjectMethodCallWithArgumentCloningEnabled()
    {
        $expectedObject = new stdClass;

        $mock = $this->getMockBuilder('SomeClass')
                     ->setMethods(['doSomethingElse'])
                     ->enableArgumentCloning()
                     ->getMock();

        $actualArguments = [];

        $mock->expects($this->any())
             ->method('doSomethingElse')
             ->will(
                 $this->returnCallback(
                     function () use (&$actualArguments) {
                         $actualArguments = func_get_args();
                     }
                 )
             );

        $mock->doSomethingElse($expectedObject);

        $this->assertEquals(1, count($actualArguments));
        $this->assertEquals($expectedObject, $actualArguments[0]);
        $this->assertNotSame($expectedObject, $actualArguments[0]);
    }

    public function testObjectMethodCallWithArgumentCloningDisabled()
    {
        $expectedObject = new stdClass;

        $mock = $this->getMockBuilder('SomeClass')
                     ->setMethods(['doSomethingElse'])
                     ->disableArgumentCloning()
                     ->getMock();

        $actualArguments = [];

        $mock->expects($this->any())
             ->method('doSomethingElse')
             ->will(
                 $this->returnCallback(
                     function () use (&$actualArguments) {
                         $actualArguments = func_get_args();
                     }
                 )
             );

        $mock->doSomethingElse($expectedObject);

        $this->assertEquals(1, count($actualArguments));
        $this->assertSame($expectedObject, $actualArguments[0]);
    }

    public function testArgumentCloningOptionGeneratesUniqueMock()
    {
        $mockWithCloning = $this->getMockBuilder('SomeClass')
                                ->setMethods(['doSomethingElse'])
                                ->enableArgumentCloning()
                                ->getMock();

        $mockWithoutCloning = $this->getMockBuilder('SomeClass')
                                   ->setMethods(['doSomethingElse'])
                                   ->disableArgumentCloning()
                                   ->getMock();

        $this->assertNotEquals($mockWithCloning, $mockWithoutCloning);
    }

    public function testVerificationOfMethodNameFailsWithoutParameters()
    {
        $mock = $this->getMockBuilder(SomeClass::class)
                     ->setMethods(['right', 'wrong'])
                     ->getMock();

        $mock->expects($this->once())
             ->method('right');

        $mock->wrong();

        try {
            $mock->__phpunit_verify();
            $this->fail('Expected exception');
        } catch (PHPUnit_Framework_ExpectationFailedException $e) {
            $this->assertSame(
                "Expectation failed for method name is equal to <string:right> when invoked 1 time(s).\n"
                . "Method was expected to be called 1 times, actually called 0 times.\n",
                $e->getMessage()
            );
        }

        $this->resetMockObjects();
    }

    public function testVerificationOfMethodNameFailsWithParameters()
    {
        $mock = $this->getMockBuilder(SomeClass::class)
                     ->setMethods(['right', 'wrong'])
                     ->getMock();

        $mock->expects($this->once())
             ->method('right');

        $mock->wrong();

        try {
            $mock->__phpunit_verify();
            $this->fail('Expected exception');
        } catch (PHPUnit_Framework_ExpectationFailedException $e) {
            $this->assertSame(
                "Expectation failed for method name is equal to <string:right> when invoked 1 time(s).\n"
                . "Method was expected to be called 1 times, actually called 0 times.\n",
                $e->getMessage()
            );
        }

        $this->resetMockObjects();
    }

    public function testVerificationOfMethodNameFailsWithWrongParameters()
    {
        $mock = $this->getMockBuilder(SomeClass::class)
                     ->setMethods(['right', 'wrong'])
                     ->getMock();

        $mock->expects($this->once())
             ->method('right')
             ->with(['first', 'second']);

        try {
            $mock->right(['second']);
        } catch (PHPUnit_Framework_ExpectationFailedException $e) {
            $this->assertSame(
                "Expectation failed for method name is equal to <string:right> when invoked 1 time(s)\n"
                . "Parameter 0 for invocation SomeClass::right(Array (...)) does not match expected value.\n"
                . 'Failed asserting that two arrays are equal.',
                $e->getMessage()
            );
        }

        try {
            $mock->__phpunit_verify();
            $this->fail('Expected exception');
        } catch (PHPUnit_Framework_ExpectationFailedException $e) {
            $this->assertSame(
                "Expectation failed for method name is equal to <string:right> when invoked 1 time(s).\n"
                . "Parameter 0 for invocation SomeClass::right(Array (...)) does not match expected value.\n"
                . "Failed asserting that two arrays are equal.\n"
                . "--- Expected\n"
                . "+++ Actual\n"
                . "@@ @@\n"
                . " Array (\n"
                . "-    0 => 'first'\n"
                . "-    1 => 'second'\n"
                . "+    0 => 'second'\n"
                . " )\n",
                $e->getMessage()
            );
        }

        $this->resetMockObjects();
    }

    public function testVerificationOfNeverFailsWithEmptyParameters()
    {
        $mock = $this->getMockBuilder(SomeClass::class)
                     ->setMethods(['right', 'wrong'])
                     ->getMock();

        $mock->expects($this->never())
             ->method('right')
             ->with();

        try {
            $mock->right();
            $this->fail('Expected exception');
        } catch (PHPUnit_Framework_ExpectationFailedException $e) {
            $this->assertSame(
                'SomeClass::right() was not expected to be called.',
                $e->getMessage()
            );
        }

        $this->resetMockObjects();
    }

    public function testVerificationOfNeverFailsWithAnyParameters()
    {
        $mock = $this->getMockBuilder(SomeClass::class)
                     ->setMethods(['right', 'wrong'])
                     ->getMock();

        $mock->expects($this->never())
             ->method('right')
             ->withAnyParameters();

        try {
            $mock->right();
            $this->fail('Expected exception');
        } catch (PHPUnit_Framework_ExpectationFailedException $e) {
            $this->assertSame(
                'SomeClass::right() was not expected to be called.',
                $e->getMessage()
            );
        }

        $this->resetMockObjects();
    }

    public function testWithAnythingInsteadOfWithAnyParameters()
    {
        $mock = $this->getMockBuilder(SomeClass::class)
                     ->setMethods(['right', 'wrong'])
                     ->getMock();

        $mock->expects($this->once())
             ->method('right')
             ->with($this->anything());

        try {
            $mock->right();
            $this->fail('Expected exception');
        } catch (PHPUnit_Framework_ExpectationFailedException $e) {
            $this->assertSame(
                "Expectation failed for method name is equal to <string:right> when invoked 1 time(s)\n" .
                "Parameter count for invocation SomeClass::right() is too low.\n" .
                'To allow 0 or more parameters with any value, omit ->with() or use ->withAnyParameters() instead.',
                $e->getMessage()
            );
        }

        $this->resetMockObjects();
    }

    /**
     * See https://github.com/sebastianbergmann/phpunit-mock-objects/issues/81
     */
    public function testMockArgumentsPassedByReference()
    {
        $foo = $this->getMockBuilder('MethodCallbackByReference')
                    ->setMethods(['bar'])
                    ->disableOriginalConstructor()
                    ->disableArgumentCloning()
                    ->getMock();

        $foo->expects($this->any())
            ->method('bar')
            ->will($this->returnCallback([$foo, 'callback']));

        $a = $b = $c = 0;

        $foo->bar($a, $b, $c);

        $this->assertEquals(1, $b);
    }

    /**
     * See https://github.com/sebastianbergmann/phpunit-mock-objects/issues/81
     */
    public function testMockArgumentsPassedByReference2()
    {
        $foo = $this->getMockBuilder('MethodCallbackByReference')
                    ->disableOriginalConstructor()
                    ->disableArgumentCloning()
                    ->getMock();

        $foo->expects($this->any())
            ->method('bar')
            ->will($this->returnCallback(
                function (&$a, &$b, $c) {
                    $b = 1;
                }
            ));

        $a = $b = $c = 0;

        $foo->bar($a, $b, $c);

        $this->assertEquals(1, $b);
    }

    /**
     * @see https://github.com/sebastianbergmann/phpunit-mock-objects/issues/116
     */
    public function testMockArgumentsPassedByReference3()
    {
        $foo = $this->getMockBuilder('MethodCallbackByReference')
                    ->setMethods(['bar'])
                    ->disableOriginalConstructor()
                    ->disableArgumentCloning()
                    ->getMock();

        $a = new stdClass;
        $b = $c = 0;

        $foo->expects($this->any())
            ->method('bar')
            ->with($a, $b, $c)
            ->will($this->returnCallback([$foo, 'callback']));

        $this->assertNull($foo->bar($a, $b, $c));
    }

    /**
     * @see https://github.com/sebastianbergmann/phpunit/issues/796
     */
    public function testMockArgumentsPassedByReference4()
    {
        $foo = $this->getMockBuilder('MethodCallbackByReference')
                    ->setMethods(['bar'])
                    ->disableOriginalConstructor()
                    ->disableArgumentCloning()
                    ->getMock();

        $a = new stdClass;
        $b = $c = 0;

        $foo->expects($this->any())
            ->method('bar')
            ->with($this->isInstanceOf(stdClass::class), $b, $c)
            ->will($this->returnCallback([$foo, 'callback']));

        $this->assertNull($foo->bar($a, $b, $c));
    }

    /**
     * @requires extension soap
     */
    public function testCreateMockFromWsdl()
    {
        $mock = $this->getMockFromWsdl(__DIR__ . '/_fixture/GoogleSearch.wsdl', 'WsdlMock');

        $this->assertStringStartsWith(
            'Mock_WsdlMock_',
            get_class($mock)
        );
    }

    /**
     * @requires extension soap
     */
    public function testCreateNamespacedMockFromWsdl()
    {
        $mock = $this->getMockFromWsdl(__DIR__ . '/_fixture/GoogleSearch.wsdl', 'My\\Space\\WsdlMock');

        $this->assertStringStartsWith(
            'Mock_WsdlMock_',
            get_class($mock)
        );
    }

    /**
     * @requires extension soap
     */
    public function testCreateTwoMocksOfOneWsdlFile()
    {
        $a = $this->getMockFromWsdl(__DIR__ . '/_fixture/GoogleSearch.wsdl');
        $b = $this->getMockFromWsdl(__DIR__ . '/_fixture/GoogleSearch.wsdl');

        $this->assertStringStartsWith('Mock_GoogleSearch_', get_class($a));
        $this->assertEquals(get_class($a), get_class($b));
    }

    /**
     * @see    https://github.com/sebastianbergmann/phpunit-mock-objects/issues/156
     * @ticket 156
     */
    public function testInterfaceWithStaticMethodCanBeStubbed()
    {
        $this->assertInstanceOf(
            InterfaceWithStaticMethod::class,
            $this->getMockBuilder(InterfaceWithStaticMethod::class)->getMock()
        );
    }

    /**
     * @expectedException PHPUnit_Framework_MockObject_BadMethodCallException
     */
    public function testInvokingStubbedStaticMethodRaisesException()
    {
        $mock = $this->getMockBuilder(ClassWithStaticMethod::class)->getMock();

        $mock->staticMethod();
    }

    /**
     * @see    https://github.com/sebastianbergmann/phpunit-mock-objects/issues/171
     * @ticket 171
     */
    public function testStubForClassThatImplementsSerializableCanBeCreatedWithoutInvokingTheConstructor()
    {
        $this->assertInstanceOf(
            ClassThatImplementsSerializable::class,
            $this->getMockBuilder(ClassThatImplementsSerializable::class)
                 ->disableOriginalConstructor()
                 ->getMock()
        );
    }

    public function testGetMockForClassWithSelfTypeHint()
    {
        $this->assertInstanceOf(
            ClassWithSelfTypeHint::class,
            $this->getMockBuilder(ClassWithSelfTypeHint::class)->getMock()
        );
    }

    private function resetMockObjects()
    {
        $refl = new ReflectionObject($this);
        $refl = $refl->getParentClass();
        $prop = $refl->getProperty('mockObjects');
        $prop->setAccessible(true);
        $prop->setValue($this, []);
    }

    public function testStringableClassDoesNotThrow()
    {
        $mock = $this->getMockBuilder(StringableClass::class)->getMock();

        $this->assertInternalType('string', (string) $mock);
    }

    public function testStringableClassCanBeMocked()
    {
        $mock = $this->getMockBuilder(StringableClass::class)->getMock();

        $mock->method('__toString')->willReturn('foo');

        $this->assertSame('foo', (string) $mock);
    }

    public function traversableProvider()
    {
        return [
          ['Traversable'],
          ['\Traversable'],
          ['TraversableMockTestInterface'],
          [['Traversable']],
          [['Iterator','Traversable']],
          [['\Iterator','\Traversable']]
        ];
    }

    public function testParameterCallbackConstraintOnlyEvaluatedOnce()
    {
        $mock                  = $this->getMockBuilder(Foo::class)->setMethods(['bar'])->getMock();
        $expectedNumberOfCalls = 1;
        $callCount             = 0;

        $mock->expects($this->exactly($expectedNumberOfCalls))->method('bar')
            ->with($this->callback(function ($argument) use (&$callCount) {
                return $argument === 'call_' . $callCount++;
            }));

        for ($i = 0; $i < $expectedNumberOfCalls; $i++) {
            $mock->bar('call_' . $i);
        }
    }
}
