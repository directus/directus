<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\Component\Validator\Tests\Mapping\Loader;

use PHPUnit\Framework\TestCase;
use Symfony\Component\Validator\Constraints\All;
use Symfony\Component\Validator\Constraints\Callback;
use Symfony\Component\Validator\Constraints\Choice;
use Symfony\Component\Validator\Constraints\Collection;
use Symfony\Component\Validator\Constraints\IsTrue;
use Symfony\Component\Validator\Constraints\NotNull;
use Symfony\Component\Validator\Constraints\Range;
use Symfony\Component\Validator\Mapping\ClassMetadata;
use Symfony\Component\Validator\Mapping\Loader\YamlFileLoader;
use Symfony\Component\Validator\Tests\Fixtures\ConstraintA;
use Symfony\Component\Validator\Tests\Fixtures\ConstraintB;

class YamlFileLoaderTest extends TestCase
{
    public function testLoadClassMetadataReturnsFalseIfEmpty()
    {
        $loader = new YamlFileLoader(__DIR__.'/empty-mapping.yml');
        $metadata = new ClassMetadata('Symfony\Component\Validator\Tests\Fixtures\Entity');

        $this->assertFalse($loader->loadClassMetadata($metadata));

        $r = new \ReflectionProperty($loader, 'classes');
        $r->setAccessible(true);
        $this->assertSame([], $r->getValue($loader));
    }

    /**
     * @dataProvider provideInvalidYamlFiles
     * @expectedException \InvalidArgumentException
     */
    public function testInvalidYamlFiles($path)
    {
        $loader = new YamlFileLoader(__DIR__.'/'.$path);
        $metadata = new ClassMetadata('Symfony\Component\Validator\Tests\Fixtures\Entity');

        $loader->loadClassMetadata($metadata);
    }

    public function provideInvalidYamlFiles()
    {
        return [
            ['nonvalid-mapping.yml'],
            ['bad-format.yml'],
        ];
    }

    /**
     * @see https://github.com/symfony/symfony/pull/12158
     */
    public function testDoNotModifyStateIfExceptionIsThrown()
    {
        $loader = new YamlFileLoader(__DIR__.'/nonvalid-mapping.yml');
        $metadata = new ClassMetadata('Symfony\Component\Validator\Tests\Fixtures\Entity');
        try {
            $loader->loadClassMetadata($metadata);
        } catch (\InvalidArgumentException $e) {
            // Call again. Again an exception should be thrown
            $this->{method_exists($this, $_ = 'expectException') ? $_ : 'setExpectedException'}('\InvalidArgumentException');
            $loader->loadClassMetadata($metadata);
        }
    }

    public function testLoadClassMetadataReturnsTrueIfSuccessful()
    {
        $loader = new YamlFileLoader(__DIR__.'/constraint-mapping.yml');
        $metadata = new ClassMetadata('Symfony\Component\Validator\Tests\Fixtures\Entity');

        $this->assertTrue($loader->loadClassMetadata($metadata));
    }

    public function testLoadClassMetadataReturnsFalseIfNotSuccessful()
    {
        $loader = new YamlFileLoader(__DIR__.'/constraint-mapping.yml');
        $metadata = new ClassMetadata('\stdClass');

        $this->assertFalse($loader->loadClassMetadata($metadata));
    }

    public function testLoadClassMetadata()
    {
        $loader = new YamlFileLoader(__DIR__.'/constraint-mapping.yml');
        $metadata = new ClassMetadata('Symfony\Component\Validator\Tests\Fixtures\Entity');

        $loader->loadClassMetadata($metadata);

        $expected = new ClassMetadata('Symfony\Component\Validator\Tests\Fixtures\Entity');
        $expected->setGroupSequence(['Foo', 'Entity']);
        $expected->addConstraint(new ConstraintA());
        $expected->addConstraint(new ConstraintB());
        $expected->addConstraint(new Callback('validateMe'));
        $expected->addConstraint(new Callback('validateMeStatic'));
        $expected->addConstraint(new Callback(['Symfony\Component\Validator\Tests\Fixtures\CallbackClass', 'callback']));
        $expected->addPropertyConstraint('firstName', new NotNull());
        $expected->addPropertyConstraint('firstName', new Range(['min' => 3]));
        $expected->addPropertyConstraint('firstName', new Choice(['A', 'B']));
        $expected->addPropertyConstraint('firstName', new All([new NotNull(), new Range(['min' => 3])]));
        $expected->addPropertyConstraint('firstName', new All(['constraints' => [new NotNull(), new Range(['min' => 3])]]));
        $expected->addPropertyConstraint('firstName', new Collection(['fields' => [
            'foo' => [new NotNull(), new Range(['min' => 3])],
            'bar' => [new Range(['min' => 5])],
        ]]));
        $expected->addPropertyConstraint('firstName', new Choice([
            'message' => 'Must be one of %choices%',
            'choices' => ['A', 'B'],
        ]));
        $expected->addGetterConstraint('lastName', new NotNull());
        $expected->addGetterConstraint('valid', new IsTrue());
        $expected->addGetterConstraint('permissions', new IsTrue());

        $this->assertEquals($expected, $metadata);
    }

    public function testLoadClassMetadataWithConstants()
    {
        $loader = new YamlFileLoader(__DIR__.'/mapping-with-constants.yml');
        $metadata = new ClassMetadata('Symfony\Component\Validator\Tests\Fixtures\Entity');

        $loader->loadClassMetadata($metadata);

        $expected = new ClassMetadata('Symfony\Component\Validator\Tests\Fixtures\Entity');
        $expected->addPropertyConstraint('firstName', new Range(['max' => PHP_INT_MAX]));

        $this->assertEquals($expected, $metadata);
    }

    public function testLoadGroupSequenceProvider()
    {
        $loader = new YamlFileLoader(__DIR__.'/constraint-mapping.yml');
        $metadata = new ClassMetadata('Symfony\Component\Validator\Tests\Fixtures\GroupSequenceProviderEntity');

        $loader->loadClassMetadata($metadata);

        $expected = new ClassMetadata('Symfony\Component\Validator\Tests\Fixtures\GroupSequenceProviderEntity');
        $expected->setGroupSequenceProvider(true);

        $this->assertEquals($expected, $metadata);
    }
}
