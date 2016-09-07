<?php

/*
 * This file is part of Twig.
 *
 * (c) Fabien Potencier
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

class Twig_Tests_Node_ModuleTest extends Twig_Test_NodeTestCase
{
    public function testConstructor()
    {
        $body = new Twig_Node_Text('foo', 1);
        $parent = new Twig_Node_Expression_Constant('layout.twig', 1);
        $blocks = new Twig_Node();
        $macros = new Twig_Node();
        $traits = new Twig_Node();
        $filename = 'foo.twig';
        $node = new Twig_Node_Module($body, $parent, $blocks, $macros, $traits, new Twig_Node(array()), $filename);

        $this->assertEquals($body, $node->getNode('body'));
        $this->assertEquals($blocks, $node->getNode('blocks'));
        $this->assertEquals($macros, $node->getNode('macros'));
        $this->assertEquals($parent, $node->getNode('parent'));
        $this->assertEquals($filename, $node->getAttribute('filename'));
    }

    public function getTests()
    {
        $twig = new Twig_Environment($this->getMockBuilder('Twig_LoaderInterface')->getMock());

        $tests = array();

        $body = new Twig_Node_Text('foo', 1);
        $extends = null;
        $blocks = new Twig_Node();
        $macros = new Twig_Node();
        $traits = new Twig_Node();
        $filename = 'foo.twig';

        $node = new Twig_Node_Module($body, $extends, $blocks, $macros, $traits, new Twig_Node(array()), $filename);
        $tests[] = array($node, <<<EOF
<?php

/* foo.twig */
class __TwigTemplate_%x extends Twig_Template
{
    public function __construct(Twig_Environment \$env)
    {
        parent::__construct(\$env);

        \$this->parent = false;

        \$this->blocks = array(
        );
    }

    protected function doDisplay(array \$context, array \$blocks = array())
    {
        // line 1
        echo "foo";
    }

    public function getTemplateName()
    {
        return "foo.twig";
    }

    public function getDebugInfo()
    {
        return array (  19 => 1,);
    }
}
EOF
        , $twig, true);

        $import = new Twig_Node_Import(new Twig_Node_Expression_Constant('foo.twig', 1), new Twig_Node_Expression_AssignName('macro', 1), 2);

        $body = new Twig_Node(array($import));
        $extends = new Twig_Node_Expression_Constant('layout.twig', 1);

        $node = new Twig_Node_Module($body, $extends, $blocks, $macros, $traits, new Twig_Node(array()), $filename);
        $tests[] = array($node, <<<EOF
<?php

/* foo.twig */
class __TwigTemplate_%x extends Twig_Template
{
    public function __construct(Twig_Environment \$env)
    {
        parent::__construct(\$env);

        // line 1
        \$this->parent = \$this->loadTemplate("layout.twig", "foo.twig", 1);
        \$this->blocks = array(
        );
    }

    protected function doGetParent(array \$context)
    {
        return "layout.twig";
    }

    protected function doDisplay(array \$context, array \$blocks = array())
    {
        // line 2
        \$context["macro"] = \$this->loadTemplate("foo.twig", "foo.twig", 2);
        // line 1
        \$this->parent->display(\$context, array_merge(\$this->blocks, \$blocks));
    }

    public function getTemplateName()
    {
        return "foo.twig";
    }

    public function isTraitable()
    {
        return false;
    }

    public function getDebugInfo()
    {
        return array (  26 => 1,  24 => 2,  11 => 1,);
    }
}
EOF
        , $twig, true);

        $set = new Twig_Node_Set(false, new Twig_Node(array(new Twig_Node_Expression_AssignName('foo', 4))), new Twig_Node(array(new Twig_Node_Expression_Constant('foo', 4))), 4);
        $body = new Twig_Node(array($set));
        $extends = new Twig_Node_Expression_Conditional(
                        new Twig_Node_Expression_Constant(true, 2),
                        new Twig_Node_Expression_Constant('foo', 2),
                        new Twig_Node_Expression_Constant('foo', 2),
                        2
                    );

        $node = new Twig_Node_Module($body, $extends, $blocks, $macros, $traits, new Twig_Node(array()), $filename);
        $tests[] = array($node, <<<EOF
<?php

/* foo.twig */
class __TwigTemplate_%x extends Twig_Template
{
    protected function doGetParent(array \$context)
    {
        // line 2
        return \$this->loadTemplate(((true) ? ("foo") : ("foo")), "foo.twig", 2);
    }

    protected function doDisplay(array \$context, array \$blocks = array())
    {
        // line 4
        \$context["foo"] = "foo";
        // line 2
        \$this->getParent(\$context)->display(\$context, array_merge(\$this->blocks, \$blocks));
    }

    public function getTemplateName()
    {
        return "foo.twig";
    }

    public function isTraitable()
    {
        return false;
    }

    public function getDebugInfo()
    {
        return array (  17 => 2,  15 => 4,  9 => 2,);
    }
}
EOF
        , $twig, true);

        return $tests;
    }
}
