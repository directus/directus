<?php

/*
 * This file is part of Twig.
 *
 * (c) Fabien Potencier
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

class Twig_Tests_Node_Expression_FilterTest extends Twig_Test_NodeTestCase
{
    public function testConstructor()
    {
        $expr = new Twig_Node_Expression_Constant('foo', 1);
        $name = new Twig_Node_Expression_Constant('upper', 1);
        $args = new Twig_Node();
        $node = new Twig_Node_Expression_Filter($expr, $name, $args, 1);

        $this->assertEquals($expr, $node->getNode('node'));
        $this->assertEquals($name, $node->getNode('filter'));
        $this->assertEquals($args, $node->getNode('arguments'));
    }

    public function getTests()
    {
        $environment = new Twig_Environment($this->getMockBuilder('Twig_LoaderInterface')->getMock());
        $environment->addFilter(new Twig_Filter('bar', 'twig_tests_filter_dummy', ['needs_environment' => true]));
        $environment->addFilter(new Twig_Filter('barbar', 'twig_tests_filter_barbar', ['needs_context' => true, 'is_variadic' => true]));

        $tests = [];

        $expr = new Twig_Node_Expression_Constant('foo', 1);
        $node = $this->createFilter($expr, 'upper');
        $node = $this->createFilter($node, 'number_format', [new Twig_Node_Expression_Constant(2, 1), new Twig_Node_Expression_Constant('.', 1), new Twig_Node_Expression_Constant(',', 1)]);

        $tests[] = [$node, 'twig_number_format_filter($this->env, twig_upper_filter($this->env, "foo"), 2, ".", ",")'];

        // named arguments
        $date = new Twig_Node_Expression_Constant(0, 1);
        $node = $this->createFilter($date, 'date', [
            'timezone' => new Twig_Node_Expression_Constant('America/Chicago', 1),
            'format' => new Twig_Node_Expression_Constant('d/m/Y H:i:s P', 1),
        ]);
        $tests[] = [$node, 'twig_date_format_filter($this->env, 0, "d/m/Y H:i:s P", "America/Chicago")'];

        // skip an optional argument
        $date = new Twig_Node_Expression_Constant(0, 1);
        $node = $this->createFilter($date, 'date', [
            'timezone' => new Twig_Node_Expression_Constant('America/Chicago', 1),
        ]);
        $tests[] = [$node, 'twig_date_format_filter($this->env, 0, null, "America/Chicago")'];

        // underscores vs camelCase for named arguments
        $string = new Twig_Node_Expression_Constant('abc', 1);
        $node = $this->createFilter($string, 'reverse', [
            'preserve_keys' => new Twig_Node_Expression_Constant(true, 1),
        ]);
        $tests[] = [$node, 'twig_reverse_filter($this->env, "abc", true)'];
        $node = $this->createFilter($string, 'reverse', [
            'preserveKeys' => new Twig_Node_Expression_Constant(true, 1),
        ]);
        $tests[] = [$node, 'twig_reverse_filter($this->env, "abc", true)'];

        // filter as an anonymous function
        $node = $this->createFilter(new Twig_Node_Expression_Constant('foo', 1), 'anonymous');
        $tests[] = [$node, 'call_user_func_array($this->env->getFilter(\'anonymous\')->getCallable(), ["foo"])'];

        // needs environment
        $node = $this->createFilter($string, 'bar');
        $tests[] = [$node, 'twig_tests_filter_dummy($this->env, "abc")', $environment];

        $node = $this->createFilter($string, 'bar', [new Twig_Node_Expression_Constant('bar', 1)]);
        $tests[] = [$node, 'twig_tests_filter_dummy($this->env, "abc", "bar")', $environment];

        // arbitrary named arguments
        $node = $this->createFilter($string, 'barbar');
        $tests[] = [$node, 'twig_tests_filter_barbar($context, "abc")', $environment];

        $node = $this->createFilter($string, 'barbar', ['foo' => new Twig_Node_Expression_Constant('bar', 1)]);
        $tests[] = [$node, 'twig_tests_filter_barbar($context, "abc", null, null, ["foo" => "bar"])', $environment];

        $node = $this->createFilter($string, 'barbar', ['arg2' => new Twig_Node_Expression_Constant('bar', 1)]);
        $tests[] = [$node, 'twig_tests_filter_barbar($context, "abc", null, "bar")', $environment];

        $node = $this->createFilter($string, 'barbar', [
            new Twig_Node_Expression_Constant('1', 1),
            new Twig_Node_Expression_Constant('2', 1),
            new Twig_Node_Expression_Constant('3', 1),
            'foo' => new Twig_Node_Expression_Constant('bar', 1),
        ]);
        $tests[] = [$node, 'twig_tests_filter_barbar($context, "abc", "1", "2", [0 => "3", "foo" => "bar"])', $environment];

        return $tests;
    }

    /**
     * @expectedException        Twig_Error_Syntax
     * @expectedExceptionMessage Unknown argument "foobar" for filter "date(format, timezone)" at line 1.
     */
    public function testCompileWithWrongNamedArgumentName()
    {
        $date = new Twig_Node_Expression_Constant(0, 1);
        $node = $this->createFilter($date, 'date', [
            'foobar' => new Twig_Node_Expression_Constant('America/Chicago', 1),
        ]);

        $compiler = $this->getCompiler();
        $compiler->compile($node);
    }

    /**
     * @expectedException        Twig_Error_Syntax
     * @expectedExceptionMessage Value for argument "from" is required for filter "replace" at line 1.
     */
    public function testCompileWithMissingNamedArgument()
    {
        $value = new Twig_Node_Expression_Constant(0, 1);
        $node = $this->createFilter($value, 'replace', [
            'to' => new Twig_Node_Expression_Constant('foo', 1),
        ]);

        $compiler = $this->getCompiler();
        $compiler->compile($node);
    }

    protected function createFilter($node, $name, array $arguments = [])
    {
        $name = new Twig_Node_Expression_Constant($name, 1);
        $arguments = new Twig_Node($arguments);

        return new Twig_Node_Expression_Filter($node, $name, $arguments, 1);
    }

    protected function getEnvironment()
    {
        $env = new Twig_Environment(new Twig_Loader_Array([]));
        $env->addFilter(new Twig_Filter('anonymous', function () {}));

        return $env;
    }
}

function twig_tests_filter_dummy()
{
}

function twig_tests_filter_barbar($context, $string, $arg1 = null, $arg2 = null, array $args = [])
{
}
