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
use Zend\Db\Sql\Predicate\Expression;

class ExpressionTest extends TestCase
{

    public function testEmptyConstructorYieldsEmptyLiteralAndParameter()
    {
        $expression = new Expression();
        $this->assertEquals('', $expression->getExpression());
        $this->assertEmpty($expression->getParameters());
    }

    public function testCanPassLiteralAndParameterToConstructor()
    {
        $expression = new Expression();
        $predicate = new Expression('foo.bar = ?', 'bar');
        $this->assertEquals('foo.bar = ?', $predicate->getExpression());
        $this->assertEquals(array('bar'), $predicate->getParameters());
    }

    public function testLiteralIsMutable()
    {
        $expression = new Expression();
        $expression->setExpression('foo.bar = ?');
        $this->assertEquals('foo.bar = ?', $expression->getExpression());
    }

    public function testParameterIsMutable()
    {
        $expression = new Expression();
        $expression->setParameters(array('foo', 'bar'));
        $this->assertEquals(array('foo', 'bar'), $expression->getParameters());
    }

    public function testRetrievingWherePartsReturnsSpecificationArrayOfLiteralAndParametersAndArrayOfTypes()
    {
        $expression = new Expression();
        $expression->setExpression('foo.bar = ? AND id != ?')
                        ->setParameters(array('foo', 'bar'));
        $expected = array(array(
            'foo.bar = %s AND id != %s',
            array('foo', 'bar'),
            array(Expression::TYPE_VALUE, Expression::TYPE_VALUE),
        ));
        $test = $expression->getExpressionData();
        $this->assertEquals($expected, $test, var_export($test, 1));
    }

    public function testAllowZeroParameterValue()
    {
        $predicate = new Expression('foo.bar > ?', 0);
        $this->assertEquals(array(0), $predicate->getParameters());
    }
}
