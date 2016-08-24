<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2013 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace ZendTest\Db\Sql\Predicate;

use Zend\Db\Sql\Predicate\Like;

class LikeTest extends \PHPUnit_Framework_TestCase
{

    public function testConstructEmptyArgs()
    {
        $like = new Like();
        $this->assertEquals('', $like->getIdentifier());
        $this->assertEquals('', $like->getLike());
    }

    public function testConstructWithArgs()
    {
        $like = new Like('bar', 'Foo%');
        $this->assertEquals('bar', $like->getIdentifier());
        $this->assertEquals('Foo%', $like->getLike());
    }

    public function testAccessorsMutators()
    {
        $like = new Like();
        $like->setIdentifier('bar');
        $this->assertEquals('bar', $like->getIdentifier());
        $like->setLike('foo%');
        $this->assertEquals('foo%', $like->getLike());
        $like->setSpecification('target = target');
        $this->assertEquals('target = target', $like->getSpecification());
    }

    public function testGetExpressionData()
    {
        $like = new Like('bar', 'Foo%');
        $this->assertEquals(
            array(
                array('%1$s LIKE %2$s', array('bar', 'Foo%'), array($like::TYPE_IDENTIFIER, $like::TYPE_VALUE))
            ),
            $like->getExpressionData()
        );
    }

    public function testInstanceOfPerSetters()
    {
        $like = new Like();
        $this->assertInstanceOf('Zend\Db\Sql\Predicate\Like', $like->setIdentifier('bar'));
        $this->assertInstanceOf('Zend\Db\Sql\Predicate\Like', $like->setSpecification('%1$s LIKE %2$s'));
        $this->assertInstanceOf('Zend\Db\Sql\Predicate\Like', $like->setLike('foo%'));
    }

}
