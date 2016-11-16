<?php

/*
 * This file is part of Twig.
 *
 * (c) Fabien Potencier
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

class Twig_Tests_Node_Expression_AssignNameTest extends Twig_Test_NodeTestCase
{
    public function testConstructor()
    {
        $node = new Twig_Node_Expression_AssignName('foo', 1);

        $this->assertEquals('foo', $node->getAttribute('name'));
    }

    public function getTests()
    {
        $node = new Twig_Node_Expression_AssignName('foo', 1);

        return array(
            array($node, '$context["foo"]'),
        );
    }
}
