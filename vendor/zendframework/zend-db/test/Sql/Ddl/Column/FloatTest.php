<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2013 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace ZendTest\Db\Sql\Ddl\Column;

use Zend\Db\Sql\Ddl\Column\Float;

class FloatTest extends \PHPUnit_Framework_TestCase
{
    /**
     * @covers Zend\Db\Sql\Ddl\Column\Float::getExpressionData
     */
    public function testGetExpressionData()
    {
        $column = new Float('foo', 5, 10);
        $this->assertEquals(
            array(array('%s DECIMAL(%s) %s %s', array('foo', '5, 10', 'NOT NULL', ''), array($column::TYPE_IDENTIFIER, $column::TYPE_LITERAL, $column::TYPE_LITERAL, $column::TYPE_LITERAL))),
            $column->getExpressionData()
        );
    }
}
