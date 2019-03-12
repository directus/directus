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
use Twig\Node\Expression\Test\NullTest;
use Twig\Node\Expression\TestExpression;
use Twig\Node\Node;
use Twig\Test\NodeTestCase;
use Twig\TwigTest;

class Twig_Tests_Node_Expression_TestTest extends NodeTestCase
{
    public function testConstructor()
    {
        $expr = new ConstantExpression('foo', 1);
        $name = new ConstantExpression('null', 1);
        $args = new Node();
        $node = new TestExpression($expr, $name, $args, 1);

        $this->assertEquals($expr, $node->getNode('node'));
        $this->assertEquals($args, $node->getNode('arguments'));
        $this->assertEquals($name, $node->getAttribute('name'));
    }

    public function getTests()
    {
        $environment = new Environment($this->getMockBuilder(LoaderInterface::class)->getMock());
        $environment->addTest(new TwigTest('barbar', 'twig_tests_test_barbar', ['is_variadic' => true, 'need_context' => true]));

        $tests = [];

        $expr = new ConstantExpression('foo', 1);
        $node = new NullTest($expr, 'null', new Node([]), 1);
        $tests[] = [$node, '(null === "foo")'];

        // test as an anonymous function
        $node = $this->createTest(new ConstantExpression('foo', 1), 'anonymous', [new ConstantExpression('foo', 1)]);
        $tests[] = [$node, 'call_user_func_array($this->env->getTest(\'anonymous\')->getCallable(), ["foo", "foo"])'];

        // arbitrary named arguments
        $string = new ConstantExpression('abc', 1);
        $node = $this->createTest($string, 'barbar');
        $tests[] = [$node, 'twig_tests_test_barbar("abc")', $environment];

        $node = $this->createTest($string, 'barbar', ['foo' => new ConstantExpression('bar', 1)]);
        $tests[] = [$node, 'twig_tests_test_barbar("abc", null, null, ["foo" => "bar"])', $environment];

        $node = $this->createTest($string, 'barbar', ['arg2' => new ConstantExpression('bar', 1)]);
        $tests[] = [$node, 'twig_tests_test_barbar("abc", null, "bar")', $environment];

        $node = $this->createTest($string, 'barbar', [
            new ConstantExpression('1', 1),
            new ConstantExpression('2', 1),
            new ConstantExpression('3', 1),
            'foo' => new ConstantExpression('bar', 1),
        ]);
        $tests[] = [$node, 'twig_tests_test_barbar("abc", "1", "2", [0 => "3", "foo" => "bar"])', $environment];

        return $tests;
    }

    protected function createTest($node, $name, array $arguments = [])
    {
        return new TestExpression($node, $name, new Node($arguments), 1);
    }

    protected function getEnvironment()
    {
        $env = new Environment(new ArrayLoader([]));
        $env->addTest(new TwigTest('anonymous', function () {}));

        return $env;
    }
}

function twig_tests_test_barbar($string, $arg1 = null, $arg2 = null, array $args = [])
{
}
