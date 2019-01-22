<?php

/*
 * This file is part of Twig.
 *
 * (c) Fabien Potencier
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

class Twig_Tests_Node_AutoEscapeTest extends Twig_Test_NodeTestCase
{
    public function testConstructor()
    {
        $body = new Twig_Node([new Twig_Node_Text('foo', 1)]);
        $node = new Twig_Node_AutoEscape(true, $body, 1);

        $this->assertEquals($body, $node->getNode('body'));
        $this->assertTrue($node->getAttribute('value'));
    }

    public function getTests()
    {
        $body = new Twig_Node([new Twig_Node_Text('foo', 1)]);
        $node = new Twig_Node_AutoEscape(true, $body, 1);

        return [
            [$node, "// line 1\necho \"foo\";"],
        ];
    }
}
