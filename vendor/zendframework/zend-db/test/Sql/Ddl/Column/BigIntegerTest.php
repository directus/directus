<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2013 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace ZendTest\Db\Sql\Ddl\Column;

use Zend\Db\Sql\Ddl\Column\BigInteger;

class BigIntegerTest extends \PHPUnit_Framework_TestCase
{

    /**
     * @covers Zend\Db\Sql\Ddl\Column\BigInteger::__construct
     */
    public function testObjectConstruction()
    {
        $integer = new BigInteger('foo');
        $this->assertEquals('foo', $integer->getName());
    }

    /**
     * @covers Zend\Db\Sql\Ddl\Column\Column::getExpressionData
     */
    public function testGetExpressionData()
    {
        $column = new BigInteger('foo');
        $this->assertEquals(
            array(array('%s %s', array('foo', 'BIGINT NOT NULL'), array($column::TYPE_IDENTIFIER, $column::TYPE_LITERAL))),
            $column->getExpressionData()
        );
    }
}
