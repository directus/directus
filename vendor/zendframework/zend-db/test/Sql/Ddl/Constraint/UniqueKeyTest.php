<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2013 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace ZendTest\Db\Sql\Ddl\Constraint;

use Zend\Db\Sql\Ddl\Constraint\UniqueKey;

class UniqueKeyTest extends \PHPUnit_Framework_TestCase
{
    /**
     * @covers Zend\Db\Sql\Ddl\Constraint\UniqueKey::getExpressionData
     */
    public function testGetExpressionData()
    {
        $uk = new UniqueKey('foo', 'my_uk');
        $this->assertEquals(
            array(array(
                'CONSTRAINT UNIQUE KEY %s(%s)',
                array('my_uk', 'foo'),
                array($uk::TYPE_IDENTIFIER, $uk::TYPE_IDENTIFIER)
            )),
            $uk->getExpressionData()
        );
    }
}
