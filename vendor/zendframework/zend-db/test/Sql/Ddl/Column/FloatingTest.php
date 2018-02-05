<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace ZendTest\Db\Sql\Ddl\Column;

use PHPUnit\Framework\TestCase;
use Zend\Db\Sql\Ddl\Column\Floating;

class FloatingTest extends TestCase
{
    /**
     * @covers \Zend\Db\Sql\Ddl\Column\Floating::getExpressionData
     */
    public function testGetExpressionData()
    {
        $column = new Floating('foo', 10, 5);
        self::assertEquals(
            [[
                '%s %s NOT NULL',
                ['foo', 'FLOAT(10,5)'],
                [$column::TYPE_IDENTIFIER, $column::TYPE_LITERAL],
            ]],
            $column->getExpressionData()
        );
    }
}
