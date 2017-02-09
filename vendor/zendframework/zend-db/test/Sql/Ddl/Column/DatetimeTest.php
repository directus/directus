<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace ZendTest\Db\Sql\Ddl\Column;

use Zend\Db\Sql\Ddl\Column\Datetime;

class DatetimeTest extends \PHPUnit_Framework_TestCase
{
    /**
     * @covers Zend\Db\Sql\Ddl\Column\Datetime::getExpressionData
     */
    public function testGetExpressionData()
    {
        $column = new Datetime('foo');
        $this->assertEquals(
            [['%s %s NOT NULL', ['foo', 'DATETIME'], [$column::TYPE_IDENTIFIER, $column::TYPE_LITERAL]]],
            $column->getExpressionData()
        );
    }
}
