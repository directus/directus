<?php

/*
 * This file is part of Twig.
 *
 * (c) Fabien Potencier
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

use Twig\Node\BlockReferenceNode;
use Twig\Test\NodeTestCase;

class Twig_Tests_Node_BlockReferenceTest extends NodeTestCase
{
    public function testConstructor()
    {
        $node = new BlockReferenceNode('foo', 1);

        $this->assertEquals('foo', $node->getAttribute('name'));
    }

    public function getTests()
    {
        return [
            [new BlockReferenceNode('foo', 1), <<<EOF
// line 1
\$this->displayBlock('foo', \$context, \$blocks);
EOF
            ],
        ];
    }
}
