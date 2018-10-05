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
        $self = new Twig_Node_Expression_Name('_self', 1);
        $context = new Twig_Node_Expression_Name('_context', 1);

        $env = new Twig_Environment($this->getMockBuilder('Twig_LoaderInterface')->getMock(), array('strict_variables' => true));
        $env1 = new Twig_Environment($this->getMockBuilder('Twig_LoaderInterface')->getMock(), array('strict_variables' => false));

        $output = '(isset($context["foo"]) || array_key_exists("foo", $context) ? $context["foo"] : (function () { throw new Twig_Error_Runtime(\'Variable "foo" does not exist.\', 1, $this->source); })())';

        return array(
            array($node, "// line 1\n".$output, $env),
            array($node, $this->getVariableGetter('foo', 1), $env1),
            array($self, "// line 1\n\$this->getTemplateName()"),
            array($context, "// line 1\n\$context"),
        );
    }
}
