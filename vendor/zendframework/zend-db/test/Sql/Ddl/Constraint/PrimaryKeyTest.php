<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace ZendTest\Db\Sql\Ddl\Constraint;

use PHPUnit\Framework\TestCase;
use Zend\Db\Sql\Ddl\Constraint\PrimaryKey;

class PrimaryKeyTest extends TestCase
{
    /**
     * @covers \Zend\Db\Sql\Ddl\Constraint\PrimaryKey::getExpressionData
     */
    public function testGetExpressionData()
    {
        $pk = new PrimaryKey('foo');
        self::assertEquals(
            [[
                'PRIMARY KEY (%s)',
                ['foo'],
                [$pk::TYPE_IDENTIFIER],
            ]],
            $pk->getExpressionData()
        );
    }
}
