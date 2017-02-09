<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace ZendTest\Db\Sql\Ddl\Index;

use Zend\Db\Sql\Ddl\Index\Index;

class IndexTest extends \PHPUnit_Framework_TestCase
{
    /**
     * @covers Zend\Db\Sql\Ddl\Index\Index::getExpressionData
     */
    public function testGetExpressionData()
    {
        $uk = new Index('foo', 'my_uk');
        $this->assertEquals(
            [[
                'INDEX %s(%s)',
                ['my_uk', 'foo'],
                [$uk::TYPE_IDENTIFIER, $uk::TYPE_IDENTIFIER]
            ]],
            $uk->getExpressionData()
        );
    }

    /**
     * @covers Zend\Db\Sql\Ddl\Index\Index::getExpressionData
     */
    public function testGetExpressionDataWithLength()
    {
        $key = new Index(['foo', 'bar'], 'my_uk', [10, 5]);
        $this->assertEquals(
            [[
                'INDEX %s(%s(10), %s(5))',
                ['my_uk', 'foo', 'bar'],
                [$key::TYPE_IDENTIFIER, $key::TYPE_IDENTIFIER, $key::TYPE_IDENTIFIER]
            ]],
            $key->getExpressionData()
        );
    }

    /**
     * @covers Zend\Db\Sql\Ddl\Index\Index::getExpressionData
     */
    public function testGetExpressionDataWithLengthUnmatched()
    {
        $key = new Index(['foo', 'bar'], 'my_uk', [10]);
        $this->assertEquals(
            [[
                'INDEX %s(%s(10), %s)',
                ['my_uk', 'foo', 'bar'],
                [$key::TYPE_IDENTIFIER, $key::TYPE_IDENTIFIER, $key::TYPE_IDENTIFIER]
            ]],
            $key->getExpressionData()
        );
    }
}
