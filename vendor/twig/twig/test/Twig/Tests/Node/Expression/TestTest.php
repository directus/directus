<?php

/*
 * This file is part of Twig.
 *
 * (c) Fabien Potencier
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

class Twig_Tests_Node_Expression_TestTest extends Twig_Test_NodeTestCase
{
    public function testConstructor()
    {
        $expr = new Twig_Node_Expression_Constant('foo', 1);
        $name = new Twig_Node_Expression_Constant('null', 1);
        $args = new Twig_Node();
        $node = new Twig_Node_Expression_Test($expr, $name, $args, 1);

        $this->assertEquals($expr, $node->getNode('node'));
        $this->assertEquals($args, $node->getNode('arguments'));
        $this->assertEquals($name, $node->getAttribute('name'));
    }

    public function getTests()
    {
        $environment = new Twig_Environment($this->getMock('Twig_LoaderInterface'));
        $environment->addTest(new Twig_SimpleTest('barbar', 'twig_tests_test_barbar', array('is_variadic' => true, 'need_context' => true)));

        $tests = array();

        $expr = new Twig_Node_Expression_Constant('foo', 1);
        $node = new Twig_Node_Expression_Test_Null($expr, 'null', new Twig_Node(array()), 1);
        $tests[] = array($node, '(null === "foo")');

        // test as an anonymous function
        if (PHP_VERSION_ID >= 50300) {
            $node = $this->createTest(new Twig_Node_Expression_Constant('foo', 1), 'anonymous', array(new Twig_Node_Expression_Constant('foo', 1)));
            $tests[] = array($node, 'call_user_func_array($this->env->getTest(\'anonymous\')->getCallable(), array("foo", "foo"))');
        }

        // arbitrary named arguments
        $string = new Twig_Node_Expression_Constant('abc', 1);
        $node = $this->createTest($string, 'barbar');
        $tests[] = array($node, 'twig_tests_test_barbar("abc")', $environment);

        $node = $this->createTest($string, 'barbar', array('foo' => new Twig_Node_Expression_Constant('bar', 1)));
        $tests[] = array($node, 'twig_tests_test_barbar("abc", null, null, array("foo" => "bar"))', $environment);

        $node = $this->createTest($string, 'barbar', array('arg2' => new Twig_Node_Expression_Constant('bar', 1)));
        $tests[] = array($node, 'twig_tests_test_barbar("abc", null, "bar")', $environment);

        $node = $this->createTest($string, 'barbar', array(
            new Twig_Node_Expression_Constant('1', 1),
            new Twig_Node_Expression_Constant('2', 1),
            new Twig_Node_Expression_Constant('3', 1),
            'foo' => new Twig_Node_Expression_Constant('bar', 1),
        ));
        $tests[] = array($node, 'twig_tests_test_barbar("abc", "1", "2", array(0 => "3", "foo" => "bar"))', $environment);

        return $tests;
    }

    protected function createTest($node, $name, array $arguments = array())
    {
        return new Twig_Node_Expression_Test($node, $name, new Twig_Node($arguments), 1);
    }

    protected function getEnvironment()
    {
        if (PHP_VERSION_ID >= 50300) {
            return include 'PHP53/TestInclude.php';
        }

        return parent::getEnvironment();
    }
}

function twig_tests_test_barbar($string, $arg1 = null, $arg2 = null, array $args = array())
{
}
