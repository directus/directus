<?php

/*
 * This file is part of Twig.
 *
 * (c) Fabien Potencier
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

use Twig\Environment;
use Twig\Loader\ArrayLoader;
use Twig\Loader\LoaderInterface;
use Twig\Node\Expression\ConstantExpression;
use Twig\Node\Expression\FunctionExpression;
use Twig\Node\Node;
use Twig\Test\NodeTestCase;
use Twig\TwigFunction;

class Twig_Tests_Node_Expression_FunctionTest extends NodeTestCase
{
    public function testConstructor()
    {
        $name = 'function';
        $args = new Node();
        $node = new FunctionExpression($name, $args, 1);

        $this->assertEquals($name, $node->getAttribute('name'));
        $this->assertEquals($args, $node->getNode('arguments'));
    }

    public function getTests()
    {
        $environment = new Environment($this->getMockBuilder(LoaderInterface::class)->getMock());
        $environment->addFunction(new TwigFunction('foo', 'twig_tests_function_dummy', []));
        $environment->addFunction(new TwigFunction('bar', 'twig_tests_function_dummy', ['needs_environment' => true]));
        $environment->addFunction(new TwigFunction('foofoo', 'twig_tests_function_dummy', ['needs_context' => true]));
        $environment->addFunction(new TwigFunction('foobar', 'twig_tests_function_dummy', ['needs_environment' => true, 'needs_context' => true]));
        $environment->addFunction(new TwigFunction('barbar', 'twig_tests_function_barbar', ['is_variadic' => true]));

        $tests = [];

        $node = $this->createFunction('foo');
        $tests[] = [$node, 'twig_tests_function_dummy()', $environment];

        $node = $this->createFunction('foo', [new ConstantExpression('bar', 1), new ConstantExpression('foobar', 1)]);
        $tests[] = [$node, 'twig_tests_function_dummy("bar", "foobar")', $environment];

        $node = $this->createFunction('bar');
        $tests[] = [$node, 'twig_tests_function_dummy($this->env)', $environment];

        $node = $this->createFunction('bar', [new ConstantExpression('bar', 1)]);
        $tests[] = [$node, 'twig_tests_function_dummy($this->env, "bar")', $environment];

        $node = $this->createFunction('foofoo');
        $tests[] = [$node, 'twig_tests_function_dummy($context)', $environment];

        $node = $this->createFunction('foofoo', [new ConstantExpression('bar', 1)]);
        $tests[] = [$node, 'twig_tests_function_dummy($context, "bar")', $environment];

        $node = $this->createFunction('foobar');
        $tests[] = [$node, 'twig_tests_function_dummy($this->env, $context)', $environment];

        $node = $this->createFunction('foobar', [new ConstantExpression('bar', 1)]);
        $tests[] = [$node, 'twig_tests_function_dummy($this->env, $context, "bar")', $environment];

        // named arguments
        $node = $this->createFunction('date', [
            'timezone' => new ConstantExpression('America/Chicago', 1),
            'date' => new ConstantExpression(0, 1),
        ]);
        $tests[] = [$node, 'twig_date_converter($this->env, 0, "America/Chicago")'];

        // arbitrary named arguments
        $node = $this->createFunction('barbar');
        $tests[] = [$node, 'twig_tests_function_barbar()', $environment];

        $node = $this->createFunction('barbar', ['foo' => new ConstantExpression('bar', 1)]);
        $tests[] = [$node, 'twig_tests_function_barbar(null, null, ["foo" => "bar"])', $environment];

        $node = $this->createFunction('barbar', ['arg2' => new ConstantExpression('bar', 1)]);
        $tests[] = [$node, 'twig_tests_function_barbar(null, "bar")', $environment];

        $node = $this->createFunction('barbar', [
            new ConstantExpression('1', 1),
            new ConstantExpression('2', 1),
            new ConstantExpression('3', 1),
            'foo' => new ConstantExpression('bar', 1),
        ]);
        $tests[] = [$node, 'twig_tests_function_barbar("1", "2", [0 => "3", "foo" => "bar"])', $environment];

        // function as an anonymous function
        $node = $this->createFunction('anonymous', [new ConstantExpression('foo', 1)]);
        $tests[] = [$node, 'call_user_func_array($this->env->getFunction(\'anonymous\')->getCallable(), ["foo"])'];

        return $tests;
    }

    protected function createFunction($name, array $arguments = [])
    {
        return new FunctionExpression($name, new Node($arguments), 1);
    }

    protected function getEnvironment()
    {
        $env = new Environment(new ArrayLoader([]));
        $env->addFunction(new TwigFunction('anonymous', function () {}));

        return $env;
    }
}

function twig_tests_function_dummy()
{
}

function twig_tests_function_barbar($arg1 = null, $arg2 = null, array $args = [])
{
}
