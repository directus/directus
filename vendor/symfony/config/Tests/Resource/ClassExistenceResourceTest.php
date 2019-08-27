<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\Component\Config\Tests\Resource;

use PHPUnit\Framework\TestCase;
use Symfony\Component\Config\Resource\ClassExistenceResource;
use Symfony\Component\Config\Tests\Fixtures\BadParent;
use Symfony\Component\Config\Tests\Fixtures\Resource\ConditionalClass;

class ClassExistenceResourceTest extends TestCase
{
    public function testToString()
    {
        $res = new ClassExistenceResource('BarClass');
        $this->assertSame('BarClass', (string) $res);
    }

    public function testGetResource()
    {
        $res = new ClassExistenceResource('BarClass');
        $this->assertSame('BarClass', $res->getResource());
    }

    public function testIsFreshWhenClassDoesNotExist()
    {
        $res = new ClassExistenceResource('Symfony\Component\Config\Tests\Fixtures\BarClass');

        $this->assertTrue($res->isFresh(time()));

        eval(<<<EOF
namespace Symfony\Component\Config\Tests\Fixtures;

class BarClass
{
}
EOF
        );

        $this->assertFalse($res->isFresh(time()));
    }

    public function testIsFreshWhenClassExists()
    {
        $res = new ClassExistenceResource('Symfony\Component\Config\Tests\Resource\ClassExistenceResourceTest');

        $this->assertTrue($res->isFresh(time()));
    }

    public function testExistsKo()
    {
        spl_autoload_register($autoloader = function ($class) use (&$loadedClass) { $loadedClass = $class; });

        try {
            $res = new ClassExistenceResource('MissingFooClass');
            $this->assertTrue($res->isFresh(0));

            $this->assertSame('MissingFooClass', $loadedClass);

            $loadedClass = 123;

            $res = new ClassExistenceResource('MissingFooClass', false);

            $this->assertSame(123, $loadedClass);
        } finally {
            spl_autoload_unregister($autoloader);
        }
    }

    /**
     * @group issue-32995
     *
     * @runInSeparateProcess https://github.com/symfony/symfony/issues/32995
     */
    public function testBadParentWithTimestamp()
    {
        $res = new ClassExistenceResource(BadParent::class, false);
        $this->assertTrue($res->isFresh(time()));
    }

    /**
     * @group issue-32995
     *
     * @runInSeparateProcess https://github.com/symfony/symfony/issues/32995
     */
    public function testBadParentWithNoTimestamp()
    {
        $this->expectException('ReflectionException');
        $this->expectExceptionMessage('Class Symfony\Component\Config\Tests\Fixtures\MissingParent not found');

        $res = new ClassExistenceResource(BadParent::class, false);
        $res->isFresh(0);
    }

    public function testConditionalClass()
    {
        $res = new ClassExistenceResource(ConditionalClass::class, false);

        $this->assertFalse($res->isFresh(0));
    }
}
