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
use Zend\Db\Sql\Ddl\Column\Time;

class TimeTest extends TestCase
{
    /**
     * @covers \Zend\Db\Sql\Ddl\Column\Time::getExpressionData
     */
    public function testGetExpressionData()
    {
        $column = new Time('foo');
        self::assertEquals(
            [['%s %s NOT NULL', ['foo', 'TIME'], [$column::TYPE_IDENTIFIER, $column::TYPE_LITERAL]]],
            $column->getExpressionData()
        );
    }
}
