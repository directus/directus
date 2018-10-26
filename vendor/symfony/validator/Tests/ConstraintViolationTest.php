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

class ConstraintViolationTest extends TestCase
{
    public function testToStringHandlesArrays()
    {
        $violation = new ConstraintViolation(
            'Array',
            '{{ value }}',
            array('{{ value }}' => array(1, 2, 3)),
            'Root',
            'property.path',
            null
        );

        $expected = <<<'EOF'
Root.property.path:
    Array
EOF;

        $this->assertSame($expected, (string) $violation);
    }

    public function testToStringHandlesArrayRoots()
    {
        $violation = new ConstraintViolation(
            '42 cannot be used here',
            'this is the message template',
            array(),
            array('some_value' => 42),
            'some_value',
            null
        );

        $expected = <<<'EOF'
Array.some_value:
    42 cannot be used here
EOF;

        $this->assertSame($expected, (string) $violation);
    }
}
