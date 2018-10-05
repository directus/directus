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
use Zend\Db\Sql\Ddl\Column\Varchar;

class VarcharTest extends TestCase
{
    /**
     * @covers \Zend\Db\Sql\Ddl\Column\Varchar::getExpressionData
     */
    public function testGetExpressionData()
    {
        $column = new Varchar('foo', 20);
        self::assertEquals(
            [['%s %s NOT NULL', ['foo', 'VARCHAR(20)'], [$column::TYPE_IDENTIFIER, $column::TYPE_LITERAL]]],
            $column->getExpressionData()
        );

        $column->setDefault('bar');
        self::assertEquals(
            [[
                '%s %s NOT NULL DEFAULT %s',
                ['foo', 'VARCHAR(20)', 'bar'],
                [$column::TYPE_IDENTIFIER, $column::TYPE_LITERAL, $column::TYPE_VALUE],
            ]],
            $column->getExpressionData()
        );
    }
}
