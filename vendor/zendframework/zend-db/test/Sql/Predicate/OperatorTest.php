<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace ZendTest\Db\Sql\Predicate;

use PHPUnit_Framework_TestCase as TestCase;
use Zend\Db\Sql\Predicate\Operator;

class OperatorTest extends TestCase
{
    public function testEmptyConstructorYieldsNullLeftAndRightValues()
    {
        $operator = new Operator();
        $this->assertNull($operator->getLeft());
        $this->assertNull($operator->getRight());
    }

    public function testEmptyConstructorYieldsDefaultsForOperatorAndLeftAndRightTypes()
    {
        $operator = new Operator();
        $this->assertEquals(Operator::OP_EQ, $operator->getOperator());
        $this->assertEquals(Operator::TYPE_IDENTIFIER, $operator->getLeftType());
        $this->assertEquals(Operator::TYPE_VALUE, $operator->getRightType());
    }

    public function testCanPassAllValuesToConstructor()
    {
        $operator = new Operator('bar', '>=', 'foo.bar', Operator::TYPE_VALUE, Operator::TYPE_IDENTIFIER);
        $this->assertEquals(Operator::OP_GTE, $operator->getOperator());
        $this->assertEquals('bar', $operator->getLeft());
        $this->assertEquals('foo.bar', $operator->getRight());
        $this->assertEquals(Operator::TYPE_VALUE, $operator->getLeftType());
        $this->assertEquals(Operator::TYPE_IDENTIFIER, $operator->getRightType());

        $operator = new Operator(['bar'=>Operator::TYPE_VALUE], '>=', ['foo.bar'=>Operator::TYPE_IDENTIFIER]);
        $this->assertEquals(Operator::OP_GTE, $operator->getOperator());
        $this->assertEquals(['bar'=>Operator::TYPE_VALUE], $operator->getLeft());
        $this->assertEquals(['foo.bar'=>Operator::TYPE_IDENTIFIER], $operator->getRight());
        $this->assertEquals(Operator::TYPE_VALUE, $operator->getLeftType());
        $this->assertEquals(Operator::TYPE_IDENTIFIER, $operator->getRightType());

        $operator = new Operator('bar', '>=', 0);
        $this->assertEquals(0, $operator->getRight());
    }

    public function testLeftIsMutable()
    {
        $operator = new Operator();
        $operator->setLeft('foo.bar');
        $this->assertEquals('foo.bar', $operator->getLeft());
    }

    public function testRightIsMutable()
    {
        $operator = new Operator();
        $operator->setRight('bar');
        $this->assertEquals('bar', $operator->getRight());
    }

    public function testLeftTypeIsMutable()
    {
        $operator = new Operator();
        $operator->setLeftType(Operator::TYPE_VALUE);
        $this->assertEquals(Operator::TYPE_VALUE, $operator->getLeftType());
    }

    public function testRightTypeIsMutable()
    {
        $operator = new Operator();
        $operator->setRightType(Operator::TYPE_IDENTIFIER);
        $this->assertEquals(Operator::TYPE_IDENTIFIER, $operator->getRightType());
    }

    public function testOperatorIsMutable()
    {
        $operator = new Operator();
        $operator->setOperator(Operator::OP_LTE);
        $this->assertEquals(Operator::OP_LTE, $operator->getOperator());
    }

    public function testRetrievingWherePartsReturnsSpecificationArrayOfLeftAndRightAndArrayOfTypes()
    {
        $operator = new Operator();
        $operator->setLeft('foo')
            ->setOperator('>=')
            ->setRight('foo.bar')
            ->setLeftType(Operator::TYPE_VALUE)
            ->setRightType(Operator::TYPE_IDENTIFIER);
        $expected = [[
            '%s >= %s',
            ['foo', 'foo.bar'],
            [Operator::TYPE_VALUE, Operator::TYPE_IDENTIFIER],
        ]];
        $test = $operator->getExpressionData();
        $this->assertEquals($expected, $test, var_export($test, 1));
    }
}
