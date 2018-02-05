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
use Zend\Db\Sql\Predicate\Like;

class LikeTest extends TestCase
{
    public function testConstructEmptyArgs()
    {
        $like = new Like();
        self::assertEquals('', $like->getIdentifier());
        self::assertEquals('', $like->getLike());
    }

    public function testConstructWithArgs()
    {
        $like = new Like('bar', 'Foo%');
        self::assertEquals('bar', $like->getIdentifier());
        self::assertEquals('Foo%', $like->getLike());
    }

    public function testAccessorsMutators()
    {
        $like = new Like();
        $like->setIdentifier('bar');
        self::assertEquals('bar', $like->getIdentifier());
        $like->setLike('foo%');
        self::assertEquals('foo%', $like->getLike());
        $like->setSpecification('target = target');
        self::assertEquals('target = target', $like->getSpecification());
    }

    public function testGetExpressionData()
    {
        $like = new Like('bar', 'Foo%');
        self::assertEquals(
            [
                ['%1$s LIKE %2$s', ['bar', 'Foo%'], [$like::TYPE_IDENTIFIER, $like::TYPE_VALUE]],
            ],
            $like->getExpressionData()
        );

        $like = new Like(['Foo%' => $like::TYPE_VALUE], ['bar' => $like::TYPE_IDENTIFIER]);
        self::assertEquals(
            [
                ['%1$s LIKE %2$s', ['Foo%', 'bar'], [$like::TYPE_VALUE, $like::TYPE_IDENTIFIER]],
            ],
            $like->getExpressionData()
        );
    }

    public function testInstanceOfPerSetters()
    {
        $like = new Like();
        self::assertInstanceOf('Zend\Db\Sql\Predicate\Like', $like->setIdentifier('bar'));
        self::assertInstanceOf('Zend\Db\Sql\Predicate\Like', $like->setSpecification('%1$s LIKE %2$s'));
        self::assertInstanceOf('Zend\Db\Sql\Predicate\Like', $like->setLike('foo%'));
    }
}
