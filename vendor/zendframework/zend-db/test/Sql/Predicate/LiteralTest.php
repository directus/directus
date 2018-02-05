<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace ZendTest\Db\Sql\Predicate;

use PHPUnit\Framework\TestCase;
use Zend\Db\Sql\Predicate\Literal;

class LiteralTest extends TestCase
{
    public function testSetLiteral()
    {
        $literal = new Literal('bar');
        self::assertSame($literal, $literal->setLiteral('foo'));
    }

    public function testGetLiteral()
    {
        $literal = new Literal('bar');
        self::assertEquals('bar', $literal->getLiteral());
    }

    public function testGetExpressionData()
    {
        $literal = new Literal('bar');
        self::assertEquals([['bar', [], []]], $literal->getExpressionData());
    }
}
