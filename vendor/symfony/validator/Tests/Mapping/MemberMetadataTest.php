<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\Component\Validator\Tests\Mapping;

use PHPUnit\Framework\TestCase;
use Symfony\Component\Validator\Constraints\Valid;
use Symfony\Component\Validator\Mapping\MemberMetadata;
use Symfony\Component\Validator\Tests\Fixtures\ClassConstraint;
use Symfony\Component\Validator\Tests\Fixtures\ConstraintA;
use Symfony\Component\Validator\Tests\Fixtures\ConstraintB;

class MemberMetadataTest extends TestCase
{
    protected $metadata;

    protected function setUp()
    {
        $this->metadata = new TestMemberMetadata(
            'Symfony\Component\Validator\Tests\Fixtures\Entity',
            'getLastName',
            'lastName'
        );
    }

    protected function tearDown()
    {
        $this->metadata = null;
    }

    public function testAddConstraintRequiresClassConstraints()
    {
        $this->{method_exists($this, $_ = 'expectException') ? $_ : 'setExpectedException'}('Symfony\Component\Validator\Exception\ConstraintDefinitionException');

        $this->metadata->addConstraint(new ClassConstraint());
    }

    public function testSerialize()
    {
        $this->metadata->addConstraint(new ConstraintA(array('property1' => 'A')));
        $this->metadata->addConstraint(new ConstraintB(array('groups' => 'TestGroup')));

        $metadata = unserialize(serialize($this->metadata));

        $this->assertEquals($this->metadata, $metadata);
    }

    public function testSerializeCollectionCascaded()
    {
        $this->metadata->addConstraint(new Valid(array('traverse' => true)));

        $metadata = unserialize(serialize($this->metadata));

        $this->assertEquals($this->metadata, $metadata);
    }

    public function testSerializeCollectionNotCascaded()
    {
        $this->metadata->addConstraint(new Valid(array('traverse' => false)));

        $metadata = unserialize(serialize($this->metadata));

        $this->assertEquals($this->metadata, $metadata);
    }
}

class TestMemberMetadata extends MemberMetadata
{
    public function getPropertyValue($object)
    {
    }

    protected function newReflectionMember($object)
    {
    }
}
