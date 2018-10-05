<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace ZendTest\Db\Sql;

use PHPUnit\Framework\TestCase;
use Zend\Db\Sql\Expression;

/**
 * This is a unit testing test case.
 * A unit here is a method, there will be at least one test per method
 *
 * Expression is a value object with no dependencies/collaborators, therefore, no fixure needed
 */
class ExpressionTest extends TestCase
{
    /**
     * @covers \Zend\Db\Sql\Expression::setExpression
     * @return Expression
     */
    public function testSetExpression()
    {
        $expression = new Expression();
        $return = $expression->setExpression('Foo Bar');
        self::assertSame($expression, $return);
        return $return;
    }

    /**
     * @covers \Zend\Db\Sql\Expression::setExpression
     */
    public function testSetExpressionException()
    {
        $expression = new Expression();
        $this->expectException('Zend\Db\Sql\Exception\InvalidArgumentException');
        $this->expectExceptionMessage('Supplied expression must be a string.');
        $expression->setExpression(null);
    }

    /**
     * @covers \Zend\Db\Sql\Expression::getExpression
     * @depends testSetExpression
     */
    public function testGetExpression(Expression $expression)
    {
        self::assertEquals('Foo Bar', $expression->getExpression());
    }

    /**
     * @covers \Zend\Db\Sql\Expression::setParameters
     */
    public function testSetParameters()
    {
        $expression = new Expression();
        $return = $expression->setParameters('foo');
        self::assertSame($expression, $return);
        return $return;
    }

    /**
     * @covers \Zend\Db\Sql\Expression::setParameters
     */
    public function testSetParametersException()
    {
        $expression = new Expression('', 'foo');

        $this->expectException('Zend\Db\Sql\Exception\InvalidArgumentException');
        $this->expectExceptionMessage('Expression parameters must be a scalar or array.');
        $expression->setParameters(null);
    }

    /**
     * @covers \Zend\Db\Sql\Expression::getParameters
     * @depends testSetParameters
     */
    public function testGetParameters(Expression $expression)
    {
        self::assertEquals('foo', $expression->getParameters());
    }

    /**
     * @covers \Zend\Db\Sql\Expression::setTypes
     */
    public function testSetTypes()
    {
        $expression = new Expression();
        $return = $expression->setTypes([
            Expression::TYPE_IDENTIFIER,
            Expression::TYPE_VALUE,
            Expression::TYPE_LITERAL,
        ]);
        self::assertSame($expression, $return);
        return $expression;
    }

    /**
     * @covers \Zend\Db\Sql\Expression::getTypes
     * @depends testSetTypes
     */
    public function testGetTypes(Expression $expression)
    {
        self::assertEquals(
            [Expression::TYPE_IDENTIFIER, Expression::TYPE_VALUE, Expression::TYPE_LITERAL],
            $expression->getTypes()
        );
    }

    /**
     * @covers \Zend\Db\Sql\Expression::getExpressionData
     */
    public function testGetExpressionData()
    {
        $expression = new Expression(
            'X SAME AS ? AND Y = ? BUT LITERALLY ?',
            ['foo', 5, 'FUNC(FF%X)'],
            [Expression::TYPE_IDENTIFIER, Expression::TYPE_VALUE, Expression::TYPE_LITERAL]
        );

        self::assertEquals(
            [[
                'X SAME AS %s AND Y = %s BUT LITERALLY %s',
                ['foo', 5, 'FUNC(FF%X)'],
                [Expression::TYPE_IDENTIFIER, Expression::TYPE_VALUE, Expression::TYPE_LITERAL],
            ]],
            $expression->getExpressionData()
        );
        $expression = new Expression(
            'X SAME AS ? AND Y = ? BUT LITERALLY ?',
            [
                ['foo'        => Expression::TYPE_IDENTIFIER],
                [5            => Expression::TYPE_VALUE],
                ['FUNC(FF%X)' => Expression::TYPE_LITERAL],
            ]
        );

        $expected = [[
            'X SAME AS %s AND Y = %s BUT LITERALLY %s',
            ['foo', 5, 'FUNC(FF%X)'],
            [Expression::TYPE_IDENTIFIER, Expression::TYPE_VALUE, Expression::TYPE_LITERAL],
        ]];

        self::assertEquals($expected, $expression->getExpressionData());
    }

    public function testGetExpressionDataWillEscapePercent()
    {
        $expression = new Expression('X LIKE "foo%"');
        self::assertEquals(
            ['X LIKE "foo%%"'],
            $expression->getExpressionData()
        );
    }

    public function testConstructorWithLiteralZero()
    {
        $expression = new Expression('0');
        self::assertSame('0', $expression->getExpression());
    }

    /**
     * @group 7407
     */
    public function testGetExpressionPreservesPercentageSignInFromUnixtime()
    {
        $expressionString = 'FROM_UNIXTIME(date, "%Y-%m")';
        $expression       = new Expression($expressionString);

        self::assertSame($expressionString, $expression->getExpression());
    }

    public function testNumberOfReplacemensConsidersWhenSameVariableIsUsedManyTimes()
    {
        $expression = new Expression('uf.user_id = :user_id OR uf.friend_id = :user_id', ['user_id' => 1]);
        $expression->getExpressionData();
    }
}
