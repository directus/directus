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
use Zend\Db\Sql\Predicate\NotLike;

class NotLikeTest extends TestCase
{
    public function testConstructEmptyArgs()
    {
        $notLike = new NotLike();
        self::assertEquals('', $notLike->getIdentifier());
        self::assertEquals('', $notLike->getLike());
    }

    public function testConstructWithArgs()
    {
        $notLike = new NotLike('bar', 'Foo%');
        self::assertEquals('bar', $notLike->getIdentifier());
        self::assertEquals('Foo%', $notLike->getLike());
    }

    public function testAccessorsMutators()
    {
        $notLike = new NotLike();
        $notLike->setIdentifier('bar');
        self::assertEquals('bar', $notLike->getIdentifier());
        $notLike->setLike('foo%');
        self::assertEquals('foo%', $notLike->getLike());
        $notLike->setSpecification('target = target');
        self::assertEquals('target = target', $notLike->getSpecification());
    }

    public function testGetExpressionData()
    {
        $notLike = new NotLike('bar', 'Foo%');
        self::assertEquals(
            [
                [
                    '%1$s NOT LIKE %2$s',
                    ['bar', 'Foo%'],
                    [$notLike::TYPE_IDENTIFIER, $notLike::TYPE_VALUE],
                ],
            ],
            $notLike->getExpressionData()
        );
    }

    public function testInstanceOfPerSetters()
    {
        $notLike = new NotLike();
        self::assertInstanceOf('Zend\Db\Sql\Predicate\Like', $notLike->setIdentifier('bar'));
        self::assertInstanceOf('Zend\Db\Sql\Predicate\Like', $notLike->setSpecification('%1$s NOT LIKE %2$s'));
        self::assertInstanceOf('Zend\Db\Sql\Predicate\Like', $notLike->setLike('foo%'));
    }
}
