<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2013 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace ZendTest\Db\Sql\Predicate;

use PHPUnit_Framework_TestCase as TestCase;
use Zend\Db\Sql\Predicate\IsNotNull;

class IsNullTest extends TestCase
{

    public function testEmptyConstructorYieldsNullIdentifier()
    {
        $isNotNull = new IsNotNull();
        $this->assertNull($isNotNull->getIdentifier());
    }

    public function testSpecificationHasSaneDefaultValue()
    {
        $isNotNull = new IsNotNull();
        $this->assertEquals('%1$s IS NOT NULL', $isNotNull->getSpecification());
    }

    public function testCanPassIdentifierToConstructor()
    {
        $isNotNull = new IsNotNull();
        $isnull = new IsNotNull('foo.bar');
        $this->assertEquals('foo.bar', $isnull->getIdentifier());
    }

    public function testIdentifierIsMutable()
    {
        $isNotNull = new IsNotNull();
        $isNotNull->setIdentifier('foo.bar');
        $this->assertEquals('foo.bar', $isNotNull->getIdentifier());
    }

    public function testSpecificationIsMutable()
    {
        $isNotNull = new IsNotNull();
        $isNotNull->setSpecification('%1$s NOT NULL');
        $this->assertEquals('%1$s NOT NULL', $isNotNull->getSpecification());
    }

    public function testRetrievingWherePartsReturnsSpecificationArrayOfIdentifierAndArrayOfTypes()
    {
        $isNotNull = new IsNotNull();
        $isNotNull->setIdentifier('foo.bar');
        $expected = array(array(
            $isNotNull->getSpecification(),
            array('foo.bar'),
            array(IsNotNull::TYPE_IDENTIFIER),
        ));
        $this->assertEquals($expected, $isNotNull->getExpressionData());
    }
}
