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
use Zend\Db\Sql\ExpressionInterface;
use Zend\Db\Adapter\Driver\DriverInterface;
use Zend\Db\Sql\Predicate;
use Zend\Db\Sql\Select;
use ZendTest\Db\TestAsset\TrustingSql92Platform;

class AbstractSqlTest extends \PHPUnit_Framework_TestCase
{

    /**
     * @var \PHPUnit_Framework_MockObject_MockObject
     */
    protected $abstractSql = null;

    public function setup()
    {
        $this->abstractSql = $this->getMockForAbstractClass('Zend\Db\Sql\AbstractSql');
    }

    /**
     * @covers Zend\Db\Sql\AbstractSql::processExpression
     */
    public function testProcessExpressionWithoutDriver()
    {
        $expression = new Expression('? > ? AND y < ?', array('x', 5, 10), array(Expression::TYPE_IDENTIFIER));
        $sqlAndParams = $this->invokeProcessExpressionMethod($expression);

        $this->assertEquals("\"x\" > '5' AND y < '10'", $sqlAndParams->getSql());
        $this->assertInstanceOf('Zend\Db\Adapter\ParameterContainer', $sqlAndParams->getParameterContainer());
        $this->assertEquals(0, $sqlAndParams->getParameterContainer()->count());
    }

    /**
     * @covers Zend\Db\Sql\AbstractSql::processExpression
     */
    public function testProcessExpressionWithDriverAndParameterizationTypeNamed()
    {
        $mockDriver = $this->getMock('Zend\Db\Adapter\Driver\DriverInterface');
        $mockDriver->expects($this->any())->method('getPrepareType')->will($this->returnValue(DriverInterface::PARAMETERIZATION_NAMED));
        $mockDriver->expects($this->any())->method('formatParameterName')->will($this->returnCallback(function ($x) {
            return ':' . $x;
        }));

        $expression = new Expression('? > ? AND y < ?', array('x', 5, 10), array(Expression::TYPE_IDENTIFIER));
        $sqlAndParams = $this->invokeProcessExpressionMethod($expression, $mockDriver);

        $parameterContainer = $sqlAndParams->getParameterContainer();
        $parameters = $parameterContainer->getNamedArray();

        $this->assertRegExp('#"x" > :expr\d\d\d\dParam1 AND y < :expr\d\d\d\dParam2#', $sqlAndParams->getSql());

        // test keys and values
        preg_match('#expr(\d\d\d\d)Param1#', key($parameters), $matches);
        $expressionNumber = $matches[1];

        $this->assertRegExp('#expr\d\d\d\dParam1#', key($parameters));
        $this->assertEquals(5, current($parameters));
        next($parameters);
        $this->assertRegExp('#expr\d\d\d\dParam2#', key($parameters));
        $this->assertEquals(10, current($parameters));

        // ensure next invocation increases number by 1
        $sqlAndParamsNext = $this->invokeProcessExpressionMethod($expression, $mockDriver);

        $parameterContainer = $sqlAndParamsNext->getParameterContainer();
        $parameters = $parameterContainer->getNamedArray();

        preg_match('#expr(\d\d\d\d)Param1#', key($parameters), $matches);
        $expressionNumberNext = $matches[1];

        $this->assertEquals(1, (int) $expressionNumberNext - (int) $expressionNumber);
    }

    /**
     * @covers Zend\Db\Sql\AbstractSql::processExpression
     */
    public function testProcessExpressionWorksWithExpressionContainingStringParts()
    {
        $expression = new Predicate\Expression('x = ?', 5);

        $predicateSet = new Predicate\PredicateSet(array(new Predicate\PredicateSet(array($expression))));
        $sqlAndParams = $this->invokeProcessExpressionMethod($predicateSet);

        $this->assertEquals("(x = '5')", $sqlAndParams->getSql());
        $this->assertEquals(0, $sqlAndParams->getParameterContainer()->count());
    }

    /**
     * @covers Zend\Db\Sql\AbstractSql::processExpression
     */
    public function testProcessExpressionWorksWithExpressionContainingSelectObject()
    {
        $select = new Select();
        $select->from('x')->where->like('bar', 'Foo%');
        $expression = new Predicate\In('x', $select);

        $predicateSet = new Predicate\PredicateSet(array(new Predicate\PredicateSet(array($expression))));
        $sqlAndParams = $this->invokeProcessExpressionMethod($predicateSet);

        $this->assertEquals('("x" IN (SELECT "x".* FROM "x" WHERE "bar" LIKE \'Foo%\'))', $sqlAndParams->getSql());
        $this->assertEquals(0, $sqlAndParams->getParameterContainer()->count());
    }

    public function testProcessExpressionWorksWithExpressionContainingExpressionObject()
    {
        $expression = new Predicate\Operator(
            'release_date',
            '=',
            new Expression('FROM_UNIXTIME(?)', 100000000)
        );

        $sqlAndParams = $this->invokeProcessExpressionMethod($expression);
        $this->assertEquals('"release_date" = FROM_UNIXTIME(\'100000000\')', $sqlAndParams->getSql());
    }

    /**
     * @param \Zend\Db\Sql\ExpressionInterface $expression
     * @param \Zend\Db\Adapter\Adapter|null $adapter
     * @return \Zend\Db\Adapter\StatementContainer
     */
    protected function invokeProcessExpressionMethod(ExpressionInterface $expression, $driver = null)
    {
        $method = new \ReflectionMethod($this->abstractSql, 'processExpression');
        $method->setAccessible(true);
        return $method->invoke($this->abstractSql, $expression, new TrustingSql92Platform, $driver);
    }

}
