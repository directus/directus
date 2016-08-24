<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2013 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace ZendTest\Db\Sql\Predicate;

use PHPUnit_Framework_TestCase as TestCase;
use Zend\Db\Sql\Select;
use Zend\Db\Sql\Predicate\NotIn;

class NotInTest extends TestCase
{

    public function testRetrievingWherePartsReturnsSpecificationArrayOfIdentifierAndValuesAndArrayOfTypes()
    {
        $in = new NotIn();
        $in->setIdentifier('foo.bar')
            ->setValueSet(array(1, 2, 3));
        $expected = array(array(
            '%s NOT IN (%s, %s, %s)',
            array('foo.bar', 1, 2, 3),
            array(NotIn::TYPE_IDENTIFIER, NotIn::TYPE_VALUE, NotIn::TYPE_VALUE, NotIn::TYPE_VALUE),
        ));
        $this->assertEquals($expected, $in->getExpressionData());
    }

    public function testGetExpressionDataWithSubselect()
    {
        $in = new NotIn('foo', $select = new Select);
        $expected = array(array(
            '%s NOT IN %s',
            array('foo', $select),
            array($in::TYPE_IDENTIFIER, $in::TYPE_VALUE)
        ));
        $this->assertEquals($expected, $in->getExpressionData());
    }
}
