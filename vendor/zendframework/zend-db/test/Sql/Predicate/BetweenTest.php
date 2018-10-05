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
use Zend\Db\Sql\Predicate\Between;

class BetweenTest extends TestCase
{
    /**
     * @var Between
     */
    protected $between;

    protected function setUp()
    {
        $this->between = new Between();
    }

    /**
     * @covers \Zend\Db\Sql\Predicate\Between::__construct
     * @covers \Zend\Db\Sql\Predicate\Between::getIdentifier
     * @covers \Zend\Db\Sql\Predicate\Between::getMinValue
     * @covers \Zend\Db\Sql\Predicate\Between::getMaxValue
     */
    public function testConstructorYieldsNullIdentifierMinimumAndMaximumValues()
    {
        self::assertNull($this->between->getIdentifier());
        self::assertNull($this->between->getMinValue());
        self::assertNull($this->between->getMaxValue());
    }

    /**
     * @covers \Zend\Db\Sql\Predicate\Between::__construct
     * @covers \Zend\Db\Sql\Predicate\Between::getIdentifier
     * @covers \Zend\Db\Sql\Predicate\Between::getMinValue
     * @covers \Zend\Db\Sql\Predicate\Between::getMaxValue
     */
    public function testConstructorCanPassIdentifierMinimumAndMaximumValues()
    {
        $between = new Between('foo.bar', 1, 300);
        self::assertEquals('foo.bar', $between->getIdentifier());
        self::assertSame(1, $between->getMinValue());
        self::assertSame(300, $between->getMaxValue());

        $between = new Between('foo.bar', 0, 1);
        self::assertEquals('foo.bar', $between->getIdentifier());
        self::assertSame(0, $between->getMinValue());
        self::assertSame(1, $between->getMaxValue());

        $between = new Between('foo.bar', -1, 0);
        self::assertEquals('foo.bar', $between->getIdentifier());
        self::assertSame(-1, $between->getMinValue());
        self::assertSame(0, $between->getMaxValue());
    }

    /**
     * @covers \Zend\Db\Sql\Predicate\Between::getSpecification
     */
    public function testSpecificationHasSaneDefaultValue()
    {
        self::assertEquals('%1$s BETWEEN %2$s AND %3$s', $this->between->getSpecification());
    }



    /**
     * @covers \Zend\Db\Sql\Predicate\Between::setIdentifier
     * @covers \Zend\Db\Sql\Predicate\Between::getIdentifier
     */
    public function testIdentifierIsMutable()
    {
        $this->between->setIdentifier('foo.bar');
        self::assertEquals('foo.bar', $this->between->getIdentifier());
    }

    /**
     * @covers \Zend\Db\Sql\Predicate\Between::setMinValue
     * @covers \Zend\Db\Sql\Predicate\Between::getMinValue
     */
    public function testMinValueIsMutable()
    {
        $this->between->setMinValue(10);
        self::assertEquals(10, $this->between->getMinValue());
    }

    /**
     * @covers \Zend\Db\Sql\Predicate\Between::setMaxValue
     * @covers \Zend\Db\Sql\Predicate\Between::getMaxValue
     */
    public function testMaxValueIsMutable()
    {
        $this->between->setMaxValue(10);
        self::assertEquals(10, $this->between->getMaxValue());
    }

    /**
     * @covers \Zend\Db\Sql\Predicate\Between::setSpecification
     * @covers \Zend\Db\Sql\Predicate\Between::getSpecification
     */
    public function testSpecificationIsMutable()
    {
        $this->between->setSpecification('%1$s IS INBETWEEN %2$s AND %3$s');
        self::assertEquals('%1$s IS INBETWEEN %2$s AND %3$s', $this->between->getSpecification());
    }

    /**
     * @covers \Zend\Db\Sql\Predicate\Between::getExpressionData
     */
    public function testRetrievingWherePartsReturnsSpecificationArrayOfIdentifierAndValuesAndArrayOfTypes()
    {
        $this->between->setIdentifier('foo.bar')
                      ->setMinValue(10)
                      ->setMaxValue(19);
        $expected = [[
            $this->between->getSpecification(),
            ['foo.bar', 10, 19],
            [Between::TYPE_IDENTIFIER, Between::TYPE_VALUE, Between::TYPE_VALUE],
        ]];
        self::assertEquals($expected, $this->between->getExpressionData());

        $this->between->setIdentifier([10 => Between::TYPE_VALUE])
                      ->setMinValue(['foo.bar' => Between::TYPE_IDENTIFIER])
                      ->setMaxValue(['foo.baz' => Between::TYPE_IDENTIFIER]);
        $expected = [[
            $this->between->getSpecification(),
            [10, 'foo.bar', 'foo.baz'],
            [Between::TYPE_VALUE, Between::TYPE_IDENTIFIER, Between::TYPE_IDENTIFIER],
        ]];
        self::assertEquals($expected, $this->between->getExpressionData());
    }
}
