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
use Zend\Db\Sql\Ddl\Constraint\UniqueKey;

class UniqueKeyTest extends TestCase
{
    /**
     * @covers \Zend\Db\Sql\Ddl\Constraint\UniqueKey::getExpressionData
     */
    public function testGetExpressionData()
    {
        $uk = new UniqueKey('foo', 'my_uk');
        self::assertEquals(
            [[
                'CONSTRAINT %s UNIQUE (%s)',
                ['my_uk', 'foo'],
                [$uk::TYPE_IDENTIFIER, $uk::TYPE_IDENTIFIER],
            ]],
            $uk->getExpressionData()
        );
    }
}
