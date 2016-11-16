<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2013 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace ZendTest\Db\Sql;

use Zend\Db\Sql\Expression;

/**
 * This is a unit testing test case.
 * A unit here is a method, there will be at least one test per method
 *
 * Expression is a value object with no dependencies/collaborators, therefore, no fixure needed
 */
class ExpressionTest extends \PHPUnit_Framework_TestCase
{

    /**
     * @covers Zend\Db\Sql\Expression::setExpression
     * @return Expression
     */
    public function testSetExpression()
    {
        $expression = new Expression();
        $return = $expression->setExpression('Foo Bar');
        $this->assertSame($expression, $return);
        return $return;
    }

    /**
     * @covers Zend\Db\Sql\Expression::setExpression
     */
    public function testSetExpressionException()
    {
        $expression = new Expression();
        $this->setExpectedException('Zend\Db\Sql\Exception\InvalidArgumentException', 'Supplied expression must be a string.');
        $return = $expression->setExpression(null);
    }

    /**
     * @covers Zend\Db\Sql\Expression::getExpression
     * @depends testSetExpression
     */
    public function testGetExpression(Expression $expression)
    {
        $this->assertEquals('Foo Bar', $expression->getExpression());
    }

    /**
     * @covers Zend\Db\Sql\Expression::setParameters
     */
    public function testSetParameters()
    {
        $expression = new Expression();
        $return = $expression->setParameters('foo');
        $this->assertSame($expression, $return);
        return $return;
    }

    /**
     * @covers Zend\Db\Sql\Expression::setParameters
     */
    public function testSetParametersException()
    {
        $expression = new Expression('','foo');

        $this->setExpectedException('Zend\Db\Sql\Exception\InvalidArgumentException', 'Expression parameters must be a scalar or array.');
        $return = $expression->setParameters(null);
    }

    /**
     * @covers Zend\Db\Sql\Expression::getParameters
     * @depends testSetParameters
     */
    public function testGetParameters(Expression $expression)
    {
        $this->assertEquals('foo', $expression->getParameters());
    }

    /**
     * @covers Zend\Db\Sql\Expression::setTypes
     */
    public function testSetTypes()
    {
        $expression = new Expression();
        $return = $expression->setTypes(array(Expression::TYPE_IDENTIFIER, Expression::TYPE_VALUE, Expression::TYPE_LITERAL));
        $this->assertSame($expression, $return);
        return $expression;
    }

    /**
     * @covers Zend\Db\Sql\Expression::getTypes
     * @depends testSetTypes
     */
    public function testGetTypes(Expression $expression)
    {
        $this->assertEquals(
            array(Expression::TYPE_IDENTIFIER, Expression::TYPE_VALUE, Expression::TYPE_LITERAL),
            $expression->getTypes()
        );
    }

    /**
     * @covers Zend\Db\Sql\Expression::getExpressionData
     */
    public function testGetExpressionData()
    {
        $expression = new Expression(
            'X SAME AS ? AND Y = ? BUT LITERALLY ?',
            array('foo', 5, 'FUNC(FF%X)'),
            array(Expression::TYPE_IDENTIFIER, Expression::TYPE_VALUE, Expression::TYPE_LITERAL)
        );

        $this->assertEquals(
            array(array(
                'X SAME AS %s AND Y = %s BUT LITERALLY %s',
                array('foo', 5, 'FUNC(FF%X)'),
                array(Expression::TYPE_IDENTIFIER, Expression::TYPE_VALUE, Expression::TYPE_LITERAL)
            )),
            $expression->getExpressionData()
        );
    }

    public function testGetExpressionDataWillEscapePercent()
    {
        $expression = new Expression('X LIKE "foo%"');
        $this->assertEquals(array(array(
                'X LIKE "foo%%"',
                array(),
                array()
            )),
            $expression->getExpressionData()
        );
    }

}
