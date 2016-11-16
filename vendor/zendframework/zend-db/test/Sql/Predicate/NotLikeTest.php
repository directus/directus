<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2013 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace ZendTest\Db\Sql\Predicate;


use Zend\Db\Sql\Predicate\NotLike;

class NotLikeTest extends \PHPUnit_Framework_TestCase
{
    public function testConstructEmptyArgs()
    {
        $notLike = new NotLike();
        $this->assertEquals('', $notLike->getIdentifier());
        $this->assertEquals('', $notLike->getLike());
    }

    public function testConstructWithArgs()
    {
        $notLike = new NotLike('bar', 'Foo%');
        $this->assertEquals('bar', $notLike->getIdentifier());
        $this->assertEquals('Foo%', $notLike->getLike());
    }

    public function testAccessorsMutators()
    {
        $notLike = new NotLike();
        $notLike->setIdentifier('bar');
        $this->assertEquals('bar', $notLike->getIdentifier());
        $notLike->setLike('foo%');
        $this->assertEquals('foo%', $notLike->getLike());
        $notLike->setSpecification('target = target');
        $this->assertEquals('target = target', $notLike->getSpecification());
    }

    public function testGetExpressionData()
    {
        $notLike = new NotLike('bar', 'Foo%');
        $this->assertEquals(
            array(
                array(
                    '%1$s NOT LIKE %2$s',
                    array('bar', 'Foo%'),
                    array($notLike::TYPE_IDENTIFIER, $notLike::TYPE_VALUE)
                )
            ),
            $notLike->getExpressionData()
        );
    }

    public function testInstanceOfPerSetters()
    {
        $notLike = new NotLike();
        $this->assertInstanceOf('Zend\Db\Sql\Predicate\Like', $notLike->setIdentifier('bar'));
        $this->assertInstanceOf('Zend\Db\Sql\Predicate\Like', $notLike->setSpecification('%1$s NOT LIKE %2$s'));
        $this->assertInstanceOf('Zend\Db\Sql\Predicate\Like', $notLike->setLike('foo%'));
    }
}
