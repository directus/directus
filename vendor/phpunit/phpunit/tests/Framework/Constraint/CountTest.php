<?php
/*
 * This file is part of PHPUnit.
 *
 * (c) Sebastian Bergmann <sebastian@phpunit.de>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

class CountTest extends PHPUnit_Framework_TestCase
{
    public function testCount()
    {
        $countConstraint = new PHPUnit_Framework_Constraint_Count(3);
        $this->assertTrue($countConstraint->evaluate([1, 2, 3], '', true));

        $countConstraint = new PHPUnit_Framework_Constraint_Count(0);
        $this->assertTrue($countConstraint->evaluate([], '', true));

        $countConstraint = new PHPUnit_Framework_Constraint_Count(2);
        $it              = new TestIterator([1, 2]);

        $this->assertTrue($countConstraint->evaluate($it, '', true));
    }

    public function testCountDoesNotChangeIteratorKey()
    {
        $countConstraint = new PHPUnit_Framework_Constraint_Count(2);

        // test with 1st implementation of Iterator
        $it = new TestIterator([1, 2]);

        $countConstraint->evaluate($it, '', true);
        $this->assertEquals(1, $it->current());

        $it->next();
        $countConstraint->evaluate($it, '', true);
        $this->assertEquals(2, $it->current());

        $it->next();
        $countConstraint->evaluate($it, '', true);
        $this->assertFalse($it->valid());

        // test with 2nd implementation of Iterator
        $it = new TestIterator2([1, 2]);

        $countConstraint = new PHPUnit_Framework_Constraint_Count(2);
        $countConstraint->evaluate($it, '', true);
        $this->assertEquals(1, $it->current());

        $it->next();
        $countConstraint->evaluate($it, '', true);
        $this->assertEquals(2, $it->current());

        $it->next();
        $countConstraint->evaluate($it, '', true);
        $this->assertFalse($it->valid());
    }

    public function testCountGeneratorsDoNotRewind()
    {
        $generatorMaker = new TestGeneratorMaker();

        $countConstraint = new PHPUnit_Framework_Constraint_Count(3);

        $generator = $generatorMaker->create([1, 2, 3]);
        $this->assertEquals(1, $generator->current());
        $countConstraint->evaluate($generator, '', true);
        $this->assertEquals(null, $generator->current());

        $countConstraint = new PHPUnit_Framework_Constraint_Count(2);

        $generator = $generatorMaker->create([1, 2, 3]);
        $this->assertEquals(1, $generator->current());
        $generator->next();
        $this->assertEquals(2, $generator->current());
        $countConstraint->evaluate($generator, '', true);
        $this->assertEquals(null, $generator->current());

        $countConstraint = new PHPUnit_Framework_Constraint_Count(1);

        $generator = $generatorMaker->create([1, 2, 3]);
        $this->assertEquals(1, $generator->current());
        $generator->next();
        $this->assertEquals(2, $generator->current());
        $generator->next();
        $this->assertEquals(3, $generator->current());
        $countConstraint->evaluate($generator, '', true);
        $this->assertEquals(null, $generator->current());
    }
}
