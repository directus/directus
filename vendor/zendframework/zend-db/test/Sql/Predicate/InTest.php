<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace ZendTest\Db\Sql\Predicate;

use PHPUnit_Framework_TestCase as TestCase;
use Zend\Db\Sql\Select;
use Zend\Db\Sql\Predicate\In;

class InTest extends TestCase
{
    public function testEmptyConstructorYieldsNullIdentifierAndValueSet()
    {
        $in = new In();
        $this->assertNull($in->getIdentifier());
        $this->assertNull($in->getValueSet());
    }

    public function testCanPassIdentifierAndValueSetToConstructor()
    {
        $in = new In('foo.bar', [1, 2]);
        $this->assertEquals('foo.bar', $in->getIdentifier());
        $this->assertEquals([1, 2], $in->getValueSet());
    }

    public function testIdentifierIsMutable()
    {
        $in = new In();
        $in->setIdentifier('foo.bar');
        $this->assertEquals('foo.bar', $in->getIdentifier());
    }

    public function testValueSetIsMutable()
    {
        $in = new In();
        $in->setValueSet([1, 2]);
        $this->assertEquals([1, 2], $in->getValueSet());
    }

    public function testRetrievingWherePartsReturnsSpecificationArrayOfIdentifierAndValuesAndArrayOfTypes()
    {
        $in = new In();
        $in->setIdentifier('foo.bar')
            ->setValueSet([1, 2, 3]);
        $expected = [[
            '%s IN (%s, %s, %s)',
            ['foo.bar', 1, 2, 3],
            [In::TYPE_IDENTIFIER, In::TYPE_VALUE, In::TYPE_VALUE, In::TYPE_VALUE],
        ]];
        $this->assertEquals($expected, $in->getExpressionData());

        $in->setIdentifier('foo.bar')
            ->setValueSet([
                [1=>In::TYPE_LITERAL],
                [2=>In::TYPE_VALUE],
                [3=>In::TYPE_LITERAL],
            ]);
        $expected = [[
            '%s IN (%s, %s, %s)',
            ['foo.bar', 1, 2, 3],
            [In::TYPE_IDENTIFIER, In::TYPE_LITERAL, In::TYPE_VALUE, In::TYPE_LITERAL],
        ]];
        $qqq = $in->getExpressionData();
        $this->assertEquals($expected, $in->getExpressionData());
    }

    public function testGetExpressionDataWithSubselect()
    {
        $select = new Select;
        $in = new In('foo', $select);
        $expected = [[
            '%s IN %s',
            ['foo', $select],
            [$in::TYPE_IDENTIFIER, $in::TYPE_VALUE]
        ]];
        $this->assertEquals($expected, $in->getExpressionData());
    }

    public function testGetExpressionDataWithSubselectAndIdentifier()
    {
        $select = new Select;
        $in = new In('foo', $select);
        $expected = [[
            '%s IN %s',
            ['foo', $select],
            [$in::TYPE_IDENTIFIER, $in::TYPE_VALUE]
        ]];
        $this->assertEquals($expected, $in->getExpressionData());
    }

    public function testGetExpressionDataWithSubselectAndArrayIdentifier()
    {
        $select = new Select;
        $in = new In(['foo', 'bar'], $select);
        $expected = [[
            '(%s, %s) IN %s',
            ['foo', 'bar', $select],
            [$in::TYPE_IDENTIFIER, $in::TYPE_IDENTIFIER, $in::TYPE_VALUE]
        ]];
        $this->assertEquals($expected, $in->getExpressionData());
    }
}
