<?php

/*
 * This file is part of Twig.
 *
 * (c) Fabien Potencier
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

class Twig_Tests_Extension_SandboxTest extends PHPUnit_Framework_TestCase
{
    protected static $params, $templates;

    protected function setUp()
    {
        self::$params = array(
            'name' => 'Fabien',
            'obj' => new FooObject(),
            'arr' => array('obj' => new FooObject()),
        );

        self::$templates = array(
            '1_basic1' => '{{ obj.foo }}',
            '1_basic2' => '{{ name|upper }}',
            '1_basic3' => '{% if name %}foo{% endif %}',
            '1_basic4' => '{{ obj.bar }}',
            '1_basic5' => '{{ obj }}',
            '1_basic6' => '{{ arr.obj }}',
            '1_basic7' => '{{ cycle(["foo","bar"], 1) }}',
            '1_basic8' => '{{ obj.getfoobar }}{{ obj.getFooBar }}',
            '1_basic9' => '{{ obj.foobar }}{{ obj.fooBar }}',
            '1_basic' => '{% if obj.foo %}{{ obj.foo|upper }}{% endif %}',
            '1_layout' => '{% block content %}{% endblock %}',
            '1_child' => "{% extends \"1_layout\" %}\n{% block content %}\n{{ \"a\"|json_encode }}\n{% endblock %}",
        );
    }

    /**
     * @expectedException        Twig_Sandbox_SecurityError
     * @expectedExceptionMessage Filter "json_encode" is not allowed in "1_child" at line 3.
     */
    public function testSandboxWithInheritance()
    {
        $twig = $this->getEnvironment(true, array(), self::$templates, array('block'));
        $twig->loadTemplate('1_child')->render(array());
    }

    public function testSandboxGloballySet()
    {
        $twig = $this->getEnvironment(false, array(), self::$templates);
        $this->assertEquals('FOO', $twig->loadTemplate('1_basic')->render(self::$params), 'Sandbox does nothing if it is disabled globally');

        $twig = $this->getEnvironment(true, array(), self::$templates);
        try {
            $twig->loadTemplate('1_basic1')->render(self::$params);
            $this->fail('Sandbox throws a SecurityError exception if an unallowed method is called');
        } catch (Twig_Sandbox_SecurityError $e) {
        }

        $twig = $this->getEnvironment(true, array(), self::$templates);
        try {
            $twig->loadTemplate('1_basic2')->render(self::$params);
            $this->fail('Sandbox throws a SecurityError exception if an unallowed filter is called');
        } catch (Twig_Sandbox_SecurityError $e) {
        }

        $twig = $this->getEnvironment(true, array(), self::$templates);
        try {
            $twig->loadTemplate('1_basic3')->render(self::$params);
            $this->fail('Sandbox throws a SecurityError exception if an unallowed tag is used in the template');
        } catch (Twig_Sandbox_SecurityError $e) {
        }

        $twig = $this->getEnvironment(true, array(), self::$templates);
        try {
            $twig->loadTemplate('1_basic4')->render(self::$params);
            $this->fail('Sandbox throws a SecurityError exception if an unallowed property is called in the template');
        } catch (Twig_Sandbox_SecurityError $e) {
        }

        $twig = $this->getEnvironment(true, array(), self::$templates);
        try {
            $twig->loadTemplate('1_basic5')->render(self::$params);
            $this->fail('Sandbox throws a SecurityError exception if an unallowed method (__toString()) is called in the template');
        } catch (Twig_Sandbox_SecurityError $e) {
        }

        $twig = $this->getEnvironment(true, array(), self::$templates);
        try {
            $twig->loadTemplate('1_basic6')->render(self::$params);
            $this->fail('Sandbox throws a SecurityError exception if an unallowed method (__toString()) is called in the template');
        } catch (Twig_Sandbox_SecurityError $e) {
        }

        $twig = $this->getEnvironment(true, array(), self::$templates);
        try {
            $twig->loadTemplate('1_basic7')->render(self::$params);
            $this->fail('Sandbox throws a SecurityError exception if an unallowed function is called in the template');
        } catch (Twig_Sandbox_SecurityError $e) {
        }

        $twig = $this->getEnvironment(true, array(), self::$templates, array(), array(), array('FooObject' => 'foo'));
        FooObject::reset();
        $this->assertEquals('foo', $twig->loadTemplate('1_basic1')->render(self::$params), 'Sandbox allow some methods');
        $this->assertEquals(1, FooObject::$called['foo'], 'Sandbox only calls method once');

        $twig = $this->getEnvironment(true, array(), self::$templates, array(), array(), array('FooObject' => '__toString'));
        FooObject::reset();
        $this->assertEquals('foo', $twig->loadTemplate('1_basic5')->render(self::$params), 'Sandbox allow some methods');
        $this->assertEquals(1, FooObject::$called['__toString'], 'Sandbox only calls method once');

        $twig = $this->getEnvironment(false, array(), self::$templates);
        FooObject::reset();
        $this->assertEquals('foo', $twig->loadTemplate('1_basic5')->render(self::$params), 'Sandbox allows __toString when sandbox disabled');
        $this->assertEquals(1, FooObject::$called['__toString'], 'Sandbox only calls method once');

        $twig = $this->getEnvironment(true, array(), self::$templates, array(), array('upper'));
        $this->assertEquals('FABIEN', $twig->loadTemplate('1_basic2')->render(self::$params), 'Sandbox allow some filters');

        $twig = $this->getEnvironment(true, array(), self::$templates, array('if'));
        $this->assertEquals('foo', $twig->loadTemplate('1_basic3')->render(self::$params), 'Sandbox allow some tags');

        $twig = $this->getEnvironment(true, array(), self::$templates, array(), array(), array(), array('FooObject' => 'bar'));
        $this->assertEquals('bar', $twig->loadTemplate('1_basic4')->render(self::$params), 'Sandbox allow some properties');

        $twig = $this->getEnvironment(true, array(), self::$templates, array(), array(), array(), array(), array('cycle'));
        $this->assertEquals('bar', $twig->loadTemplate('1_basic7')->render(self::$params), 'Sandbox allow some functions');

        foreach (array('getfoobar', 'getFoobar', 'getFooBar') as $name) {
            $twig = $this->getEnvironment(true, array(), self::$templates, array(), array(), array('FooObject' => $name));
            FooObject::reset();
            $this->assertEquals('foobarfoobar', $twig->loadTemplate('1_basic8')->render(self::$params), 'Sandbox allow methods in a case-insensitive way');
            $this->assertEquals(2, FooObject::$called['getFooBar'], 'Sandbox only calls method once');

            $this->assertEquals('foobarfoobar', $twig->loadTemplate('1_basic9')->render(self::$params), 'Sandbox allow methods via shortcut names (ie. without get/set)');
        }
    }

    public function testSandboxLocallySetForAnInclude()
    {
        self::$templates = array(
            '2_basic' => '{{ obj.foo }}{% include "2_included" %}{{ obj.foo }}',
            '2_included' => '{% if obj.foo %}{{ obj.foo|upper }}{% endif %}',
        );

        $twig = $this->getEnvironment(false, array(), self::$templates);
        $this->assertEquals('fooFOOfoo', $twig->loadTemplate('2_basic')->render(self::$params), 'Sandbox does nothing if disabled globally and sandboxed not used for the include');

        self::$templates = array(
            '3_basic' => '{{ obj.foo }}{% sandbox %}{% include "3_included" %}{% endsandbox %}{{ obj.foo }}',
            '3_included' => '{% if obj.foo %}{{ obj.foo|upper }}{% endif %}',
        );

        $twig = $this->getEnvironment(true, array(), self::$templates);
        try {
            $twig->loadTemplate('3_basic')->render(self::$params);
            $this->fail('Sandbox throws a SecurityError exception when the included file is sandboxed');
        } catch (Twig_Sandbox_SecurityError $e) {
        }
    }

    public function testMacrosInASandbox()
    {
        $twig = $this->getEnvironment(true, array('autoescape' => 'html'), array('index' => <<<EOF
{%- import _self as macros %}

{%- macro test(text) %}<p>{{ text }}</p>{% endmacro %}

{{- macros.test('username') }}
EOF
        ), array('macro', 'import'), array('escape'));

        $this->assertEquals('<p>username</p>', $twig->loadTemplate('index')->render(array()));
    }

    protected function getEnvironment($sandboxed, $options, $templates, $tags = array(), $filters = array(), $methods = array(), $properties = array(), $functions = array())
    {
        $loader = new Twig_Loader_Array($templates);
        $twig = new Twig_Environment($loader, array_merge(array('debug' => true, 'cache' => false, 'autoescape' => false), $options));
        $policy = new Twig_Sandbox_SecurityPolicy($tags, $filters, $methods, $properties, $functions);
        $twig->addExtension(new Twig_Extension_Sandbox($policy, $sandboxed));

        return $twig;
    }
}

class FooObject
{
    public static $called = array('__toString' => 0, 'foo' => 0, 'getFooBar' => 0);

    public $bar = 'bar';

    public static function reset()
    {
        self::$called = array('__toString' => 0, 'foo' => 0, 'getFooBar' => 0);
    }

    public function __toString()
    {
        ++self::$called['__toString'];

        return 'foo';
    }

    public function foo()
    {
        ++self::$called['foo'];

        return 'foo';
    }

    public function getFooBar()
    {
        ++self::$called['getFooBar'];

        return 'foobar';
    }
}
