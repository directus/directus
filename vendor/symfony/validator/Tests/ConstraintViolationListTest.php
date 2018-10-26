<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\Component\Validator\Tests;

use PHPUnit\Framework\TestCase;
use Symfony\Component\Validator\ConstraintViolation;
use Symfony\Component\Validator\ConstraintViolationList;

class ConstraintViolationListTest extends TestCase
{
    protected $list;

    protected function setUp()
    {
        $this->list = new ConstraintViolationList();
    }

    protected function tearDown()
    {
        $this->list = null;
    }

    public function testInit()
    {
        $this->assertCount(0, $this->list);
    }

    public function testInitWithViolations()
    {
        $violation = $this->getViolation('Error');
        $this->list = new ConstraintViolationList(array($violation));

        $this->assertCount(1, $this->list);
        $this->assertSame($violation, $this->list[0]);
    }

    public function testAdd()
    {
        $violation = $this->getViolation('Error');
        $this->list->add($violation);

        $this->assertCount(1, $this->list);
        $this->assertSame($violation, $this->list[0]);
    }

    public function testAddAll()
    {
        $violations = array(
            10 => $this->getViolation('Error 1'),
            20 => $this->getViolation('Error 2'),
            30 => $this->getViolation('Error 3'),
        );
        $otherList = new ConstraintViolationList($violations);
        $this->list->addAll($otherList);

        $this->assertCount(3, $this->list);

        $this->assertSame($violations[10], $this->list[0]);
        $this->assertSame($violations[20], $this->list[1]);
        $this->assertSame($violations[30], $this->list[2]);
    }

    public function testIterator()
    {
        $violations = array(
            10 => $this->getViolation('Error 1'),
            20 => $this->getViolation('Error 2'),
            30 => $this->getViolation('Error 3'),
        );

        $this->list = new ConstraintViolationList($violations);

        // indices are reset upon adding -> array_values()
        $this->assertSame(array_values($violations), iterator_to_array($this->list));
    }

    public function testArrayAccess()
    {
        $violation = $this->getViolation('Error');
        $this->list[] = $violation;

        $this->assertSame($violation, $this->list[0]);
        $this->assertArrayHasKey(0, $this->list);

        unset($this->list[0]);

        $this->assertArrayNotHasKey(0, $this->list);

        $this->list[10] = $violation;

        $this->assertSame($violation, $this->list[10]);
        $this->assertArrayHasKey(10, $this->list);
    }

    public function testToString()
    {
        $this->list = new ConstraintViolationList(array(
            $this->getViolation('Error 1', 'Root'),
            $this->getViolation('Error 2', 'Root', 'foo.bar'),
            $this->getViolation('Error 3', 'Root', '[baz]'),
            $this->getViolation('Error 4', '', 'foo.bar'),
            $this->getViolation('Error 5', '', '[baz]'),
        ));

        $expected = <<<'EOF'
Root:
    Error 1
Root.foo.bar:
    Error 2
Root[baz]:
    Error 3
foo.bar:
    Error 4
[baz]:
    Error 5

EOF;

        $this->assertEquals($expected, (string) $this->list);
    }

    /**
     * @dataProvider findByCodesProvider
     */
    public function testFindByCodes($code, $violationsCount)
    {
        $violations = array(
            $this->getViolation('Error', null, null, 'code1'),
            $this->getViolation('Error', null, null, 'code1'),
            $this->getViolation('Error', null, null, 'code2'),
        );
        $list = new ConstraintViolationList($violations);

        $specificErrors = $list->findByCodes($code);

        $this->assertInstanceOf(ConstraintViolationList::class, $specificErrors);
        $this->assertCount($violationsCount, $specificErrors);
    }

    public function findByCodesProvider()
    {
        return array(
            array('code1', 2),
            array(array('code1', 'code2'), 3),
            array('code3', 0),
        );
    }

    protected function getViolation($message, $root = null, $propertyPath = null, $code = null)
    {
        return new ConstraintViolation($message, $message, array(), $root, $propertyPath, null, null, $code);
    }
}
