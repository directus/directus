<?php

/*
 * This file is part of Pimple.
 *
 * Copyright (c) 2009 Fabien Potencier
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is furnished
 * to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

namespace Pimple\Tests;

use Pimple\Container;

/**
 * @author Igor Wiedler <igor@wiedler.ch>
 */
class PimpleTest extends \PHPUnit_Framework_TestCase
{
    public function testWithString()
    {
        $pimple = new Container();
        $pimple['param'] = 'value';

        $this->assertEquals('value', $pimple['param']);
    }

    public function testWithClosure()
    {
        $pimple = new Container();
        $pimple['service'] = function () {
            return new Fixtures\Service();
        };

        $this->assertInstanceOf('Pimple\Tests\Fixtures\Service', $pimple['service']);
    }

    public function testServicesShouldBeDifferent()
    {
        $pimple = new Container();
        $pimple['service'] = $pimple->factory(function () {
            return new Fixtures\Service();
        });

        $serviceOne = $pimple['service'];
        $this->assertInstanceOf('Pimple\Tests\Fixtures\Service', $serviceOne);

        $serviceTwo = $pimple['service'];
        $this->assertInstanceOf('Pimple\Tests\Fixtures\Service', $serviceTwo);

        $this->assertNotSame($serviceOne, $serviceTwo);
    }

    public function testShouldPassContainerAsParameter()
    {
        $pimple = new Container();
        $pimple['service'] = function () {
            return new Fixtures\Service();
        };
        $pimple['container'] = function ($container) {
            return $container;
        };

        $this->assertNotSame($pimple, $pimple['service']);
        $this->assertSame($pimple, $pimple['container']);
    }

    public function testIsset()
    {
        $pimple = new Container();
        $pimple['param'] = 'value';
        $pimple['service'] = function () {
            return new Fixtures\Service();
        };

        $pimple['null'] = null;

        $this->assertTrue(isset($pimple['param']));
        $this->assertTrue(isset($pimple['service']));
        $this->assertTrue(isset($pimple['null']));
        $this->assertFalse(isset($pimple['non_existent']));
    }

    public function testConstructorInjection()
    {
        $params = array('param' => 'value');
        $pimple = new Container($params);

        $this->assertSame($params['param'], $pimple['param']);
    }

    /**
     * @expectedException \Pimple\Exception\UnknownIdentifierException
     * @expectedExceptionMessage Identifier "foo" is not defined.
     */
    public function testOffsetGetValidatesKeyIsPresent()
    {
        $pimple = new Container();
        echo $pimple['foo'];
    }

    /**
     * @group legacy
     * @expectedException \InvalidArgumentException
     * @expectedExceptionMessage Identifier "foo" is not defined.
     */
    public function testLegacyOffsetGetValidatesKeyIsPresent()
    {
        $pimple = new Container();
        echo $pimple['foo'];
    }

    public function testOffsetGetHonorsNullValues()
    {
        $pimple = new Container();
        $pimple['foo'] = null;
        $this->assertNull($pimple['foo']);
    }

    public function testUnset()
    {
        $pimple = new Container();
        $pimple['param'] = 'value';
        $pimple['service'] = function () {
            return new Fixtures\Service();
        };

        unset($pimple['param'], $pimple['service']);
        $this->assertFalse(isset($pimple['param']));
        $this->assertFalse(isset($pimple['service']));
    }

    /**
     * @dataProvider serviceDefinitionProvider
     */
    public function testShare($service)
    {
        $pimple = new Container();
        $pimple['shared_service'] = $service;

        $serviceOne = $pimple['shared_service'];
        $this->assertInstanceOf('Pimple\Tests\Fixtures\Service', $serviceOne);

        $serviceTwo = $pimple['shared_service'];
        $this->assertInstanceOf('Pimple\Tests\Fixtures\Service', $serviceTwo);

        $this->assertSame($serviceOne, $serviceTwo);
    }

    /**
     * @dataProvider serviceDefinitionProvider
     */
    public function testProtect($service)
    {
        $pimple = new Container();
        $pimple['protected'] = $pimple->protect($service);

        $this->assertSame($service, $pimple['protected']);
    }

    public function testGlobalFunctionNameAsParameterValue()
    {
        $pimple = new Container();
        $pimple['global_function'] = 'strlen';
        $this->assertSame('strlen', $pimple['global_function']);
    }

    public function testRaw()
    {
        $pimple = new Container();
        $pimple['service'] = $definition = $pimple->factory(function () { return 'foo'; });
        $this->assertSame($definition, $pimple->raw('service'));
    }

    public function testRawHonorsNullValues()
    {
        $pimple = new Container();
        $pimple['foo'] = null;
        $this->assertNull($pimple->raw('foo'));
    }

    public function testFluentRegister()
    {
        $pimple = new Container();
        $this->assertSame($pimple, $pimple->register($this->getMockBuilder('Pimple\ServiceProviderInterface')->getMock()));
    }

    /**
     * @expectedException \Pimple\Exception\UnknownIdentifierException
     * @expectedExceptionMessage Identifier "foo" is not defined.
     */
    public function testRawValidatesKeyIsPresent()
    {
        $pimple = new Container();
        $pimple->raw('foo');
    }

    /**
     * @group legacy
     * @expectedException \InvalidArgumentException
     * @expectedExceptionMessage Identifier "foo" is not defined.
     */
    public function testLegacyRawValidatesKeyIsPresent()
    {
        $pimple = new Container();
        $pimple->raw('foo');
    }

    /**
     * @dataProvider serviceDefinitionProvider
     */
    public function testExtend($service)
    {
        $pimple = new Container();
        $pimple['shared_service'] = function () {
            return new Fixtures\Service();
        };
        $pimple['factory_service'] = $pimple->factory(function () {
            return new Fixtures\Service();
        });

        $pimple->extend('shared_service', $service);
        $serviceOne = $pimple['shared_service'];
        $this->assertInstanceOf('Pimple\Tests\Fixtures\Service', $serviceOne);
        $serviceTwo = $pimple['shared_service'];
        $this->assertInstanceOf('Pimple\Tests\Fixtures\Service', $serviceTwo);
        $this->assertSame($serviceOne, $serviceTwo);
        $this->assertSame($serviceOne->value, $serviceTwo->value);

        $pimple->extend('factory_service', $service);
        $serviceOne = $pimple['factory_service'];
        $this->assertInstanceOf('Pimple\Tests\Fixtures\Service', $serviceOne);
        $serviceTwo = $pimple['factory_service'];
        $this->assertInstanceOf('Pimple\Tests\Fixtures\Service', $serviceTwo);
        $this->assertNotSame($serviceOne, $serviceTwo);
        $this->assertNotSame($serviceOne->value, $serviceTwo->value);
    }

    public function testExtendDoesNotLeakWithFactories()
    {
        if (extension_loaded('pimple')) {
            $this->markTestSkipped('Pimple extension does not support this test');
        }
        $pimple = new Container();

        $pimple['foo'] = $pimple->factory(function () { return; });
        $pimple['foo'] = $pimple->extend('foo', function ($foo, $pimple) { return; });
        unset($pimple['foo']);

        $p = new \ReflectionProperty($pimple, 'values');
        $p->setAccessible(true);
        $this->assertEmpty($p->getValue($pimple));

        $p = new \ReflectionProperty($pimple, 'factories');
        $p->setAccessible(true);
        $this->assertCount(0, $p->getValue($pimple));
    }

    /**
     * @expectedException \Pimple\Exception\UnknownIdentifierException
     * @expectedExceptionMessage Identifier "foo" is not defined.
     */
    public function testExtendValidatesKeyIsPresent()
    {
        $pimple = new Container();
        $pimple->extend('foo', function () {});
    }

    /**
     * @group legacy
     * @expectedException \InvalidArgumentException
     * @expectedExceptionMessage Identifier "foo" is not defined.
     */
    public function testLegacyExtendValidatesKeyIsPresent()
    {
        $pimple = new Container();
        $pimple->extend('foo', function () {});
    }

    public function testKeys()
    {
        $pimple = new Container();
        $pimple['foo'] = 123;
        $pimple['bar'] = 123;

        $this->assertEquals(array('foo', 'bar'), $pimple->keys());
    }

    /** @test */
    public function settingAnInvokableObjectShouldTreatItAsFactory()
    {
        $pimple = new Container();
        $pimple['invokable'] = new Fixtures\Invokable();

        $this->assertInstanceOf('Pimple\Tests\Fixtures\Service', $pimple['invokable']);
    }

    /** @test */
    public function settingNonInvokableObjectShouldTreatItAsParameter()
    {
        $pimple = new Container();
        $pimple['non_invokable'] = new Fixtures\NonInvokable();

        $this->assertInstanceOf('Pimple\Tests\Fixtures\NonInvokable', $pimple['non_invokable']);
    }

    /**
     * @dataProvider badServiceDefinitionProvider
     * @expectedException \Pimple\Exception\ExpectedInvokableException
     * @expectedExceptionMessage Service definition is not a Closure or invokable object.
     */
    public function testFactoryFailsForInvalidServiceDefinitions($service)
    {
        $pimple = new Container();
        $pimple->factory($service);
    }

    /**
     * @group legacy
     * @dataProvider badServiceDefinitionProvider
     * @expectedException \InvalidArgumentException
     * @expectedExceptionMessage Service definition is not a Closure or invokable object.
     */
    public function testLegacyFactoryFailsForInvalidServiceDefinitions($service)
    {
        $pimple = new Container();
        $pimple->factory($service);
    }

    /**
     * @dataProvider badServiceDefinitionProvider
     * @expectedException \Pimple\Exception\ExpectedInvokableException
     * @expectedExceptionMessage Callable is not a Closure or invokable object.
     */
    public function testProtectFailsForInvalidServiceDefinitions($service)
    {
        $pimple = new Container();
        $pimple->protect($service);
    }

    /**
     * @group legacy
     * @dataProvider badServiceDefinitionProvider
     * @expectedException \InvalidArgumentException
     * @expectedExceptionMessage Callable is not a Closure or invokable object.
     */
    public function testLegacyProtectFailsForInvalidServiceDefinitions($service)
    {
        $pimple = new Container();
        $pimple->protect($service);
    }

    /**
     * @dataProvider badServiceDefinitionProvider
     * @expectedException \Pimple\Exception\InvalidServiceIdentifierException
     * @expectedExceptionMessage Identifier "foo" does not contain an object definition.
     */
    public function testExtendFailsForKeysNotContainingServiceDefinitions($service)
    {
        $pimple = new Container();
        $pimple['foo'] = $service;
        $pimple->extend('foo', function () {});
    }

    /**
     * @group legacy
     * @dataProvider badServiceDefinitionProvider
     * @expectedException \InvalidArgumentException
     * @expectedExceptionMessage Identifier "foo" does not contain an object definition.
     */
    public function testLegacyExtendFailsForKeysNotContainingServiceDefinitions($service)
    {
        $pimple = new Container();
        $pimple['foo'] = $service;
        $pimple->extend('foo', function () {});
    }

    /**
     * @group legacy
     * @expectedDeprecation How Pimple behaves when extending protected closures will be fixed in Pimple 4. Are you sure "foo" should be protected?
     */
    public function testExtendingProtectedClosureDeprecation()
    {
        $pimple = new Container();
        $pimple['foo'] = $pimple->protect(function () {
            return 'bar';
        });

        $pimple->extend('foo', function ($value) {
            return $value.'-baz';
        });

        $this->assertSame('bar-baz', $pimple['foo']);
    }

    /**
     * @dataProvider badServiceDefinitionProvider
     * @expectedException \Pimple\Exception\ExpectedInvokableException
     * @expectedExceptionMessage Extension service definition is not a Closure or invokable object.
     */
    public function testExtendFailsForInvalidServiceDefinitions($service)
    {
        $pimple = new Container();
        $pimple['foo'] = function () {};
        $pimple->extend('foo', $service);
    }

    /**
     * @group legacy
     * @dataProvider badServiceDefinitionProvider
     * @expectedException \InvalidArgumentException
     * @expectedExceptionMessage Extension service definition is not a Closure or invokable object.
     */
    public function testLegacyExtendFailsForInvalidServiceDefinitions($service)
    {
        $pimple = new Container();
        $pimple['foo'] = function () {};
        $pimple->extend('foo', $service);
    }

    /**
     * @expectedException \Pimple\Exception\FrozenServiceException
     * @expectedExceptionMessage Cannot override frozen service "foo".
     */
    public function testExtendFailsIfFrozenServiceIsNonInvokable()
    {
        $pimple = new Container();
        $pimple['foo'] = function () {
            return new Fixtures\NonInvokable();
        };
        $foo = $pimple['foo'];

        $pimple->extend('foo', function () {});
    }

    /**
     * @expectedException \Pimple\Exception\FrozenServiceException
     * @expectedExceptionMessage Cannot override frozen service "foo".
     */
    public function testExtendFailsIfFrozenServiceIsInvokable()
    {
        $pimple = new Container();
        $pimple['foo'] = function () {
            return new Fixtures\Invokable();
        };
        $foo = $pimple['foo'];

        $pimple->extend('foo', function () {});
    }

    /**
     * Provider for invalid service definitions.
     */
    public function badServiceDefinitionProvider()
    {
        return array(
          array(123),
          array(new Fixtures\NonInvokable()),
        );
    }

    /**
     * Provider for service definitions.
     */
    public function serviceDefinitionProvider()
    {
        return array(
            array(function ($value) {
                $service = new Fixtures\Service();
                $service->value = $value;

                return $service;
            }),
            array(new Fixtures\Invokable()),
        );
    }

    public function testDefiningNewServiceAfterFreeze()
    {
        $pimple = new Container();
        $pimple['foo'] = function () {
            return 'foo';
        };
        $foo = $pimple['foo'];

        $pimple['bar'] = function () {
            return 'bar';
        };
        $this->assertSame('bar', $pimple['bar']);
    }

    /**
     * @expectedException \Pimple\Exception\FrozenServiceException
     * @expectedExceptionMessage Cannot override frozen service "foo".
     */
    public function testOverridingServiceAfterFreeze()
    {
        $pimple = new Container();
        $pimple['foo'] = function () {
            return 'foo';
        };
        $foo = $pimple['foo'];

        $pimple['foo'] = function () {
            return 'bar';
        };
    }

    /**
     * @group legacy
     * @expectedException \RuntimeException
     * @expectedExceptionMessage Cannot override frozen service "foo".
     */
    public function testLegacyOverridingServiceAfterFreeze()
    {
        $pimple = new Container();
        $pimple['foo'] = function () {
            return 'foo';
        };
        $foo = $pimple['foo'];

        $pimple['foo'] = function () {
            return 'bar';
        };
    }

    public function testRemovingServiceAfterFreeze()
    {
        $pimple = new Container();
        $pimple['foo'] = function () {
            return 'foo';
        };
        $foo = $pimple['foo'];

        unset($pimple['foo']);
        $pimple['foo'] = function () {
            return 'bar';
        };
        $this->assertSame('bar', $pimple['foo']);
    }

    public function testExtendingService()
    {
        $pimple = new Container();
        $pimple['foo'] = function () {
            return 'foo';
        };
        $pimple['foo'] = $pimple->extend('foo', function ($foo, $app) {
            return "$foo.bar";
        });
        $pimple['foo'] = $pimple->extend('foo', function ($foo, $app) {
            return "$foo.baz";
        });
        $this->assertSame('foo.bar.baz', $pimple['foo']);
    }

    public function testExtendingServiceAfterOtherServiceFreeze()
    {
        $pimple = new Container();
        $pimple['foo'] = function () {
            return 'foo';
        };
        $pimple['bar'] = function () {
            return 'bar';
        };
        $foo = $pimple['foo'];

        $pimple['bar'] = $pimple->extend('bar', function ($bar, $app) {
            return "$bar.baz";
        });
        $this->assertSame('bar.baz', $pimple['bar']);
    }
}
