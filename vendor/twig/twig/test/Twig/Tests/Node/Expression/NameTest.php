<?php

/*
 * This file is part of Twig.
 *
 * (c) Fabien Potencier
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

class Twig_Tests_Node_Expression_NameTest extends Twig_Test_NodeTestCase
{
    public function testConstructor()
    {
        $node = new Twig_Node_Expression_Name('foo', 1);

        $this->assertEquals('foo', $node->getAttribute('name'));
    }

    public function getTests()
    {
        $node = new Twig_Node_Expression_Name('foo', 1);
        $context = new Twig_Node_Expression_Name('_context', 1);

        $env = new Twig_Environment($this->getMockBuilder('Twig_LoaderInterface')->getMock(), array('strict_variables' => true));
        $env1 = new Twig_Environment($this->getMockBuilder('Twig_LoaderInterface')->getMock(), array('strict_variables' => false));

        return array(
            array($node, "// line 1\n".(PHP_VERSION_ID >= 50400 ? '(isset($context["foo"]) ? $context["foo"] : $this->getContext($context, "foo"))' : '$this->getContext($context, "foo")'), $env),
            array($node, $this->getVariableGetter('foo', 1), $env1),
            array($context, "// line 1\n\$context"),
        );
    }
}
