<?php

/*
 * This file is part of Twig.
 *
 * (c) Fabien Potencier
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

class Twig_Tests_Node_BlockTest extends Twig_Test_NodeTestCase
{
    public function testConstructor()
    {
        $body = new Twig_Node_Text('foo', 1);
        $node = new Twig_Node_Block('foo', $body, 1);

        $this->assertEquals($body, $node->getNode('body'));
        $this->assertEquals('foo', $node->getAttribute('name'));
    }

    public function getTests()
    {
        $body = new Twig_Node_Text('foo', 1);
        $node = new Twig_Node_Block('foo', $body, 1);

        return [
            [$node, <<<EOF
// line 1
public function block_foo(\$context, array \$blocks = [])
{
    echo "foo";
}
EOF
            ],
        ];
    }
}
