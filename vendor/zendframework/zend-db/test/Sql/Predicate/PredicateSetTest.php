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
use Zend\Db\Sql\Predicate\IsNull;
use Zend\Db\Sql\Predicate\PredicateSet;

class PredicateSetTest extends TestCase
{
    public function testEmptyConstructorYieldsCountOfZero()
    {
        $predicateSet = new PredicateSet();
        self::assertCount(0, $predicateSet);
    }

    public function testCombinationIsAndByDefault()
    {
        $predicateSet = new PredicateSet();
        $predicateSet->addPredicate(new IsNull('foo'))
                  ->addPredicate(new IsNull('bar'));
        $parts = $predicateSet->getExpressionData();
        self::assertCount(3, $parts);
        self::assertContains('AND', $parts[1]);
        self::assertNotContains('OR', $parts[1]);
    }

    public function testCanPassPredicatesAndDefaultCombinationViaConstructor()
    {
        $predicateSet = new PredicateSet();
        $set = new PredicateSet([
            new IsNull('foo'),
            new IsNull('bar'),
        ], 'OR');
        $parts = $set->getExpressionData();
        self::assertCount(3, $parts);
        self::assertContains('OR', $parts[1]);
        self::assertNotContains('AND', $parts[1]);
    }

    public function testCanPassBothPredicateAndCombinationToAddPredicate()
    {
        $predicateSet = new PredicateSet();
        $predicateSet->addPredicate(new IsNull('foo'), 'OR')
                  ->addPredicate(new IsNull('bar'), 'AND')
                  ->addPredicate(new IsNull('baz'), 'OR')
                  ->addPredicate(new IsNull('bat'), 'AND');
        $parts = $predicateSet->getExpressionData();
        self::assertCount(7, $parts);

        self::assertNotContains('OR', $parts[1], var_export($parts, 1));
        self::assertContains('AND', $parts[1]);

        self::assertContains('OR', $parts[3]);
        self::assertNotContains('AND', $parts[3]);

        self::assertNotContains('OR', $parts[5]);
        self::assertContains('AND', $parts[5]);
    }

    public function testCanUseOrPredicateAndAndPredicateMethods()
    {
        $predicateSet = new PredicateSet();
        $predicateSet->orPredicate(new IsNull('foo'))
                  ->andPredicate(new IsNull('bar'))
                  ->orPredicate(new IsNull('baz'))
                  ->andPredicate(new IsNull('bat'));
        $parts = $predicateSet->getExpressionData();
        self::assertCount(7, $parts);

        self::assertNotContains('OR', $parts[1], var_export($parts, 1));
        self::assertContains('AND', $parts[1]);

        self::assertContains('OR', $parts[3]);
        self::assertNotContains('AND', $parts[3]);

        self::assertNotContains('OR', $parts[5]);
        self::assertContains('AND', $parts[5]);
    }

    /**
     * @covers \Zend\Db\Sql\Predicate\PredicateSet::addPredicates
     */
    public function testAddPredicates()
    {
        $predicateSet = new PredicateSet();

        $predicateSet->addPredicates('x = y');
        $predicateSet->addPredicates(['foo > ?' => 5]);
        $predicateSet->addPredicates(['id' => 2]);
        $predicateSet->addPredicates(['a = b'], PredicateSet::OP_OR);
        $predicateSet->addPredicates(['c1' => null]);
        $predicateSet->addPredicates(['c2' => [1, 2, 3]]);
        $predicateSet->addPredicates([new \Zend\Db\Sql\Predicate\IsNotNull('c3')]);

        $predicates = $this->readAttribute($predicateSet, 'predicates');
        self::assertEquals('AND', $predicates[0][0]);
        self::assertInstanceOf('Zend\Db\Sql\Predicate\Literal', $predicates[0][1]);

        self::assertEquals('AND', $predicates[1][0]);
        self::assertInstanceOf('Zend\Db\Sql\Predicate\Expression', $predicates[1][1]);

        self::assertEquals('AND', $predicates[2][0]);
        self::assertInstanceOf('Zend\Db\Sql\Predicate\Operator', $predicates[2][1]);

        self::assertEquals('OR', $predicates[3][0]);
        self::assertInstanceOf('Zend\Db\Sql\Predicate\Literal', $predicates[3][1]);

        self::assertEquals('AND', $predicates[4][0]);
        self::assertInstanceOf('Zend\Db\Sql\Predicate\IsNull', $predicates[4][1]);

        self::assertEquals('AND', $predicates[5][0]);
        self::assertInstanceOf('Zend\Db\Sql\Predicate\In', $predicates[5][1]);

        self::assertEquals('AND', $predicates[6][0]);
        self::assertInstanceOf('Zend\Db\Sql\Predicate\IsNotNull', $predicates[6][1]);

        $predicateSet->addPredicates(function ($what) use ($predicateSet) {
            self::assertSame($predicateSet, $what);
        });

        $this->expectException('Zend\Db\Sql\Exception\InvalidArgumentException');
        $this->expectExceptionMessage('Predicate cannot be null');
        $predicateSet->addPredicates(null);
    }
}
