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
use Zend\Db\Sql\Ddl\Column\Integer;
use Zend\Db\Sql\Ddl\Constraint\PrimaryKey;

class IntegerTest extends TestCase
{
    /**
     * @covers \Zend\Db\Sql\Ddl\Column\Integer::__construct
     */
    public function testObjectConstruction()
    {
        $integer = new Integer('foo');
        self::assertEquals('foo', $integer->getName());
    }

    /**
     * @covers \Zend\Db\Sql\Ddl\Column\Column::getExpressionData
     */
    public function testGetExpressionData()
    {
        $column = new Integer('foo');
        self::assertEquals(
            [['%s %s NOT NULL', ['foo', 'INTEGER'], [$column::TYPE_IDENTIFIER, $column::TYPE_LITERAL]]],
            $column->getExpressionData()
        );

        $column = new Integer('foo');
        $column->addConstraint(new PrimaryKey());
        self::assertEquals(
            [
                ['%s %s NOT NULL', ['foo', 'INTEGER'], [$column::TYPE_IDENTIFIER, $column::TYPE_LITERAL]],
                ' ',
                ['PRIMARY KEY', [], []],
            ],
            $column->getExpressionData()
        );
    }
}
