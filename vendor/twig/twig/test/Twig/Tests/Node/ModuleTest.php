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
        $source = new Twig_Source('{{ foo }}', 'foo.twig');
        $node = new Twig_Node_Module($body, $parent, $blocks, $macros, $traits, new Twig_Node([]), $source);

        $this->assertEquals($body, $node->getNode('body'));
        $this->assertEquals($blocks, $node->getNode('blocks'));
        $this->assertEquals($macros, $node->getNode('macros'));
        $this->assertEquals($parent, $node->getNode('parent'));
        $this->assertEquals($source->getName(), $node->getTemplateName());
    }

    public function getTests()
    {
        $twig = new Twig_Environment($this->getMockBuilder('Twig_LoaderInterface')->getMock());

        $tests = [];

        $body = new Twig_Node_Text('foo', 1);
        $extends = null;
        $blocks = new Twig_Node();
        $macros = new Twig_Node();
        $traits = new Twig_Node();
        $source = new Twig_Source('{{ foo }}', 'foo.twig');

        $node = new Twig_Node_Module($body, $extends, $blocks, $macros, $traits, new Twig_Node([]), $source);
        $tests[] = [$node, <<<EOF
<?php

/* foo.twig */
class __TwigTemplate_%x extends Twig_Template
{
    private \$source;

    public function __construct(Twig_Environment \$env)
    {
        parent::__construct(\$env);

        \$this->source = \$this->getSourceContext();

        \$this->parent = false;

        \$this->blocks = [
        ];
    }

    protected function doDisplay(array \$context, array \$blocks = [])
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
        return array (  23 => 1,);
    }

    public function getSourceContext()
    {
        return new Twig_Source("", "foo.twig", "");
    }
}
EOF
        , $twig, true];

        $import = new Twig_Node_Import(new Twig_Node_Expression_Constant('foo.twig', 1), new Twig_Node_Expression_AssignName('macro', 1), 2);

        $body = new Twig_Node([$import]);
        $extends = new Twig_Node_Expression_Constant('layout.twig', 1);

        $node = new Twig_Node_Module($body, $extends, $blocks, $macros, $traits, new Twig_Node([]), $source);
        $tests[] = [$node, <<<EOF
<?php

/* foo.twig */
class __TwigTemplate_%x extends Twig_Template
{
    private \$source;

    public function __construct(Twig_Environment \$env)
    {
        parent::__construct(\$env);

        \$this->source = \$this->getSourceContext();

        // line 1
        \$this->parent = \$this->loadTemplate("layout.twig", "foo.twig", 1);
        \$this->blocks = [
        ];
    }

    protected function doGetParent(array \$context)
    {
        return "layout.twig";
    }

    protected function doDisplay(array \$context, array \$blocks = [])
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
        return array (  30 => 1,  28 => 2,  15 => 1,);
    }

    public function getSourceContext()
    {
        return new Twig_Source("", "foo.twig", "");
    }
}
EOF
        , $twig, true];

        $set = new Twig_Node_Set(false, new Twig_Node([new Twig_Node_Expression_AssignName('foo', 4)]), new Twig_Node([new Twig_Node_Expression_Constant('foo', 4)]), 4);
        $body = new Twig_Node([$set]);
        $extends = new Twig_Node_Expression_Conditional(
                        new Twig_Node_Expression_Constant(true, 2),
                        new Twig_Node_Expression_Constant('foo', 2),
                        new Twig_Node_Expression_Constant('foo', 2),
                        2
                    );

        $twig = new Twig_Environment($this->getMockBuilder('Twig_LoaderInterface')->getMock(), ['debug' => true]);
        $node = new Twig_Node_Module($body, $extends, $blocks, $macros, $traits, new Twig_Node([]), $source);
        $tests[] = [$node, <<<EOF
<?php

/* foo.twig */
class __TwigTemplate_%x extends Twig_Template
{
    private \$source;

    public function __construct(Twig_Environment \$env)
    {
        parent::__construct(\$env);

        \$this->source = \$this->getSourceContext();

        \$this->blocks = [
        ];
    }

    protected function doGetParent(array \$context)
    {
        // line 2
        return \$this->loadTemplate(((true) ? ("foo") : ("foo")), "foo.twig", 2);
    }

    protected function doDisplay(array \$context, array \$blocks = [])
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
        return array (  29 => 2,  27 => 4,  21 => 2,);
    }

    public function getSourceContext()
    {
        return new Twig_Source("{{ foo }}", "foo.twig", "");
    }
}
EOF
        , $twig, true];

        return $tests;
    }
}
