<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2013 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace ZendTest\Db\Sql\Ddl\Column;

use Zend\Db\Sql\Ddl\Column\Time;

class TimeTest extends \PHPUnit_Framework_TestCase
{
    /**
     * @covers Zend\Db\Sql\Ddl\Column\Time::getExpressionData
     */
    public function testGetExpressionData()
    {
        $column = new Time('foo');
        $this->assertEquals(
            array(array('%s TIME %s %s', array('foo', 'NOT NULL', ''), array($column::TYPE_IDENTIFIER, $column::TYPE_LITERAL, $column::TYPE_LITERAL))),
            $column->getExpressionData()
        );
    }
}
