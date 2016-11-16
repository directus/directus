<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2013 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace ZendTest\Db\Sql\Ddl\Column;

use Zend\Db\Sql\Ddl\Column\Boolean;

class BooleanTest extends \PHPUnit_Framework_TestCase
{
    /**
     * @covers Zend\Db\Sql\Ddl\Column\Boolean::getExpressionData
     */
    public function testGetExpressionData()
    {
        $column = new Boolean('foo');
        $this->assertEquals(
            array(array('%s TINYINT NOT NULL', array('foo'), array($column::TYPE_IDENTIFIER))),
            $column->getExpressionData()
        );
    }
}
