<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace ZendTest\Db\Sql;

use Zend\Db\Sql\Literal;

class LiteralTest extends \PHPUnit_Framework_TestCase
{
    public function testSetLiteral()
    {
        $literal = new Literal('bar');
        $this->assertSame($literal, $literal->setLiteral('foo'));
    }

    public function testGetLiteral()
    {
        $literal = new Literal('bar');
        $this->assertEquals('bar', $literal->getLiteral());
    }

    public function testGetExpressionData()
    {
        $literal = new Literal('bar');
        $this->assertEquals([['bar', [], []]], $literal->getExpressionData());
    }

    public function testGetExpressionDataWillEscapePercent()
    {
        $expression = new Literal('X LIKE "foo%"');
        $this->assertEquals([[
                'X LIKE "foo%%"',
                [],
                []
            ]],
            $expression->getExpressionData()
        );
    }
}
