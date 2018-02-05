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
use Zend\Db\Sql\Predicate\NotIn;
use Zend\Db\Sql\Select;

class NotInTest extends TestCase
{
    public function testRetrievingWherePartsReturnsSpecificationArrayOfIdentifierAndValuesAndArrayOfTypes()
    {
        $in = new NotIn();
        $in->setIdentifier('foo.bar')
            ->setValueSet([1, 2, 3]);
        $expected = [[
            '%s NOT IN (%s, %s, %s)',
            ['foo.bar', 1, 2, 3],
            [NotIn::TYPE_IDENTIFIER, NotIn::TYPE_VALUE, NotIn::TYPE_VALUE, NotIn::TYPE_VALUE],
        ]];
        self::assertEquals($expected, $in->getExpressionData());
    }

    public function testGetExpressionDataWithSubselect()
    {
        $select = new Select;
        $in = new NotIn('foo', $select);
        $expected = [[
            '%s NOT IN %s',
            ['foo', $select],
            [$in::TYPE_IDENTIFIER, $in::TYPE_VALUE],
        ]];
        self::assertEquals($expected, $in->getExpressionData());
    }

    public function testGetExpressionDataWithSubselectAndIdentifier()
    {
        $select = new Select;
        $in = new NotIn('foo', $select);
        $expected = [[
            '%s NOT IN %s',
            ['foo', $select],
            [$in::TYPE_IDENTIFIER, $in::TYPE_VALUE],
        ]];
        self::assertEquals($expected, $in->getExpressionData());
    }

    public function testGetExpressionDataWithSubselectAndArrayIdentifier()
    {
        $select = new Select;
        $in = new NotIn(['foo', 'bar'], $select);
        $expected = [[
            '(%s, %s) NOT IN %s',
            ['foo', 'bar', $select],
            [$in::TYPE_IDENTIFIER, $in::TYPE_IDENTIFIER, $in::TYPE_VALUE],
        ]];
        self::assertEquals($expected, $in->getExpressionData());
    }
}
