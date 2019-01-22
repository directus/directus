<?php

/*
 * This file is part of Twig.
 *
 * (c) Fabien Potencier
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

class Twig_Tests_Extension_SandboxTest extends \PHPUnit\Framework\TestCase
{
    protected static $params;
    protected static $templates;

    protected function setUp()
    {
        self::$params = [
            'name' => 'Fabien',
            'obj' => new FooObject(),
            'arr' => ['obj' => new FooObject()],
        ];

        self::$templates = [
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
            '1_include' => '{{ include("1_basic1", sandboxed=true) }}',
            '1_range_operator' => '{{ (1..2)[0] }}',
        ];
    }

    /**
     * @expectedException        Twig_Sandbox_SecurityError
     * @expectedExceptionMessage Filter "json_encode" is not allowed in "1_child" at line 3.
     */
    public function testSandboxWithInheritance()
    {
        $twig = $this->getEnvironment(true, [], self::$templates, ['block']);
        $twig->loadTemplate('1_child')->render([]);
    }

    public function testSandboxGloballySet()
    {
        $twig = $this->getEnvironment(false, [], self::$templates);
        $this->assertEquals('FOO', $twig->loadTemplate('1_basic')->render(self::$params), 'Sandbox does nothing if it is disabled globally');
    }

    public function testSandboxUnallowedMethodAccessor()
    {
        $twig = $this->getEnvironment(true, [], self::$templates);
        try {
            $twig->loadTemplate('1_basic1')->render(self::$params);
            $this->fail('Sandbox throws a SecurityError exception if an unallowed method is called');
        } catch (Twig_Sandbox_SecurityError $e) {
            $this->assertInstanceOf('Twig_Sandbox_SecurityNotAllowedMethodError', $e, 'Exception should be an instance of Twig_Sandbox_SecurityNotAllowedMethodError');
            $this->assertEquals('FooObject', $e->getClassName(), 'Exception should be raised on the "FooObject" class');
            $this->assertEquals('foo', $e->getMethodName(), 'Exception should be raised on the "foo" method');
        }
    }

    public function testSandboxUnallowedFilter()
    {
        $twig = $this->getEnvironment(true, [], self::$templates);
        try {
            $twig->loadTemplate('1_basic2')->render(self::$params);
            $this->fail('Sandbox throws a SecurityError exception if an unallowed filter is called');
        } catch (Twig_Sandbox_SecurityError $e) {
            $this->assertInstanceOf('Twig_Sandbox_SecurityNotAllowedFilterError', $e, 'Exception should be an instance of Twig_Sandbox_SecurityNotAllowedFilterError');
            $this->assertEquals('upper', $e->getFilterName(), 'Exception should be raised on the "upper" filter');
        }
    }

    public function testSandboxUnallowedTag()
    {
        $twig = $this->getEnvironment(true, [], self::$templates);
        try {
            $twig->loadTemplate('1_basic3')->render(self::$params);
            $this->fail('Sandbox throws a SecurityError exception if an unallowed tag is used in the template');
        } catch (Twig_Sandbox_SecurityError $e) {
            $this->assertInstanceOf('Twig_Sandbox_SecurityNotAllowedTagError', $e, 'Exception should be an instance of Twig_Sandbox_SecurityNotAllowedTagError');
            $this->assertEquals('if', $e->getTagName(), 'Exception should be raised on the "if" tag');
        }
    }

    public function testSandboxUnallowedProperty()
    {
        $twig = $this->getEnvironment(true, [], self::$templates);
        try {
            $twig->loadTemplate('1_basic4')->render(self::$params);
            $this->fail('Sandbox throws a SecurityError exception if an unallowed property is called in the template');
        } catch (Twig_Sandbox_SecurityError $e) {
            $this->assertInstanceOf('Twig_Sandbox_SecurityNotAllowedPropertyError', $e, 'Exception should be an instance of Twig_Sandbox_SecurityNotAllowedPropertyError');
            $this->assertEquals('FooObject', $e->getClassName(), 'Exception should be raised on the "FooObject" class');
            $this->assertEquals('bar', $e->getPropertyName(), 'Exception should be raised on the "bar" property');
        }
    }

    public function testSandboxUnallowedToString()
    {
        $twig = $this->getEnvironment(true, [], self::$templates);
        try {
            $twig->loadTemplate('1_basic5')->render(self::$params);
            $this->fail('Sandbox throws a SecurityError exception if an unallowed method (__toString()) is called in the template');
        } catch (Twig_Sandbox_SecurityError $e) {
            $this->assertInstanceOf('Twig_Sandbox_SecurityNotAllowedMethodError', $e, 'Exception should be an instance of Twig_Sandbox_SecurityNotAllowedMethodError');
            $this->assertEquals('FooObject', $e->getClassName(), 'Exception should be raised on the "FooObject" class');
            $this->assertEquals('__tostring', $e->getMethodName(), 'Exception should be raised on the "__toString" method');
        }
    }

    public function testSandboxUnallowedToStringArray()
    {
        $twig = $this->getEnvironment(true, [], self::$templates);
        try {
            $twig->loadTemplate('1_basic6')->render(self::$params);
            $this->fail('Sandbox throws a SecurityError exception if an unallowed method (__toString()) is called in the template');
        } catch (Twig_Sandbox_SecurityError $e) {
            $this->assertInstanceOf('Twig_Sandbox_SecurityNotAllowedMethodError', $e, 'Exception should be an instance of Twig_Sandbox_SecurityNotAllowedMethodError');
            $this->assertEquals('FooObject', $e->getClassName(), 'Exception should be raised on the "FooObject" class');
            $this->assertEquals('__tostring', $e->getMethodName(), 'Exception should be raised on the "__toString" method');
        }
    }

    public function testSandboxUnallowedFunction()
    {
        $twig = $this->getEnvironment(true, [], self::$templates);
        try {
            $twig->loadTemplate('1_basic7')->render(self::$params);
            $this->fail('Sandbox throws a SecurityError exception if an unallowed function is called in the template');
        } catch (Twig_Sandbox_SecurityError $e) {
            $this->assertInstanceOf('Twig_Sandbox_SecurityNotAllowedFunctionError', $e, 'Exception should be an instance of Twig_Sandbox_SecurityNotAllowedFunctionError');
            $this->assertEquals('cycle', $e->getFunctionName(), 'Exception should be raised on the "cycle" function');
        }
    }

    public function testSandboxUnallowedRangeOperator()
    {
        $twig = $this->getEnvironment(true, [], self::$templates);
        try {
            $twig->loadTemplate('1_range_operator')->render(self::$params);
            $this->fail('Sandbox throws a SecurityError exception if the unallowed range operator is called');
        } catch (Twig_Sandbox_SecurityError $e) {
            $this->assertInstanceOf('Twig_Sandbox_SecurityNotAllowedFunctionError', $e, 'Exception should be an instance of Twig_Sandbox_SecurityNotAllowedFunctionError');
            $this->assertEquals('range', $e->getFunctionName(), 'Exception should be raised on the "range" function');
        }
    }

    public function testSandboxAllowMethodFoo()
    {
        $twig = $this->getEnvironment(true, [], self::$templates, [], [], ['FooObject' => 'foo']);
        FooObject::reset();
        $this->assertEquals('foo', $twig->loadTemplate('1_basic1')->render(self::$params), 'Sandbox allow some methods');
        $this->assertEquals(1, FooObject::$called['foo'], 'Sandbox only calls method once');
    }

    public function testSandboxAllowMethodToString()
    {
        $twig = $this->getEnvironment(true, [], self::$templates, [], [], ['FooObject' => '__toString']);
        FooObject::reset();
        $this->assertEquals('foo', $twig->loadTemplate('1_basic5')->render(self::$params), 'Sandbox allow some methods');
        $this->assertEquals(1, FooObject::$called['__toString'], 'Sandbox only calls method once');
    }

    public function testSandboxAllowMethodToStringDisabled()
    {
        $twig = $this->getEnvironment(false, [], self::$templates);
        FooObject::reset();
        $this->assertEquals('foo', $twig->loadTemplate('1_basic5')->render(self::$params), 'Sandbox allows __toString when sandbox disabled');
        $this->assertEquals(1, FooObject::$called['__toString'], 'Sandbox only calls method once');
    }

    public function testSandboxAllowFilter()
    {
        $twig = $this->getEnvironment(true, [], self::$templates, [], ['upper']);
        $this->assertEquals('FABIEN', $twig->loadTemplate('1_basic2')->render(self::$params), 'Sandbox allow some filters');
    }

    public function testSandboxAllowTag()
    {
        $twig = $this->getEnvironment(true, [], self::$templates, ['if']);
        $this->assertEquals('foo', $twig->loadTemplate('1_basic3')->render(self::$params), 'Sandbox allow some tags');
    }

    public function testSandboxAllowProperty()
    {
        $twig = $this->getEnvironment(true, [], self::$templates, [], [], [], ['FooObject' => 'bar']);
        $this->assertEquals('bar', $twig->loadTemplate('1_basic4')->render(self::$params), 'Sandbox allow some properties');
    }

    public function testSandboxAllowFunction()
    {
        $twig = $this->getEnvironment(true, [], self::$templates, [], [], [], [], ['cycle']);
        $this->assertEquals('bar', $twig->loadTemplate('1_basic7')->render(self::$params), 'Sandbox allow some functions');
    }

    public function testSandboxAllowRangeOperator()
    {
        $twig = $this->getEnvironment(true, [], self::$templates, [], [], [], [], ['range']);
        $this->assertEquals('1', $twig->loadTemplate('1_range_operator')->render(self::$params), 'Sandbox allow the range operator');
    }

    public function testSandboxAllowFunctionsCaseInsensitive()
    {
        foreach (['getfoobar', 'getFoobar', 'getFooBar'] as $name) {
            $twig = $this->getEnvironment(true, [], self::$templates, [], [], ['FooObject' => $name]);
            FooObject::reset();
            $this->assertEquals('foobarfoobar', $twig->loadTemplate('1_basic8')->render(self::$params), 'Sandbox allow methods in a case-insensitive way');
            $this->assertEquals(2, FooObject::$called['getFooBar'], 'Sandbox only calls method once');

            $this->assertEquals('foobarfoobar', $twig->loadTemplate('1_basic9')->render(self::$params), 'Sandbox allow methods via shortcut names (ie. without get/set)');
        }
    }

    public function testSandboxLocallySetForAnInclude()
    {
        self::$templates = [
            '2_basic' => '{{ obj.foo }}{% include "2_included" %}{{ obj.foo }}',
            '2_included' => '{% if obj.foo %}{{ obj.foo|upper }}{% endif %}',
        ];

        $twig = $this->getEnvironment(false, [], self::$templates);
        $this->assertEquals('fooFOOfoo', $twig->loadTemplate('2_basic')->render(self::$params), 'Sandbox does nothing if disabled globally and sandboxed not used for the include');

        self::$templates = [
            '3_basic' => '{{ obj.foo }}{% sandbox %}{% include "3_included" %}{% endsandbox %}{{ obj.foo }}',
            '3_included' => '{% if obj.foo %}{{ obj.foo|upper }}{% endif %}',
        ];

        $twig = $this->getEnvironment(true, [], self::$templates);
        try {
            $twig->loadTemplate('3_basic')->render(self::$params);
            $this->fail('Sandbox throws a SecurityError exception when the included file is sandboxed');
        } catch (Twig_Sandbox_SecurityError $e) {
            $this->assertInstanceOf('Twig_Sandbox_SecurityNotAllowedTagError', $e, 'Exception should be an instance of Twig_Sandbox_SecurityNotAllowedTagError');
            $this->assertEquals('sandbox', $e->getTagName());
        }
    }

    public function testMacrosInASandbox()
    {
        $twig = $this->getEnvironment(true, ['autoescape' => 'html'], ['index' => <<<EOF
{%- import _self as macros %}

{%- macro test(text) %}<p>{{ text }}</p>{% endmacro %}

{{- macros.test('username') }}
EOF
        ], ['macro', 'import'], ['escape']);

        $this->assertEquals('<p>username</p>', $twig->loadTemplate('index')->render([]));
    }

    public function testSandboxDisabledAfterIncludeFunctionError()
    {
        $twig = $this->getEnvironment(false, [], self::$templates);

        $e = null;
        try {
            $twig->loadTemplate('1_include')->render(self::$params);
        } catch (Throwable $e) {
        }
        if (null === $e) {
            $this->fail('An exception should be thrown for this test to be valid.');
        }

        $this->assertFalse($twig->getExtension('Twig_Extension_Sandbox')->isSandboxed(), 'Sandboxed include() function call should not leave Sandbox enabled when an error occurs.');
    }

    protected function getEnvironment($sandboxed, $options, $templates, $tags = [], $filters = [], $methods = [], $properties = [], $functions = [])
    {
        $loader = new Twig_Loader_Array($templates);
        $twig = new Twig_Environment($loader, array_merge(['debug' => true, 'cache' => false, 'autoescape' => false], $options));
        $policy = new Twig_Sandbox_SecurityPolicy($tags, $filters, $methods, $properties, $functions);
        $twig->addExtension(new Twig_Extension_Sandbox($policy, $sandboxed));

        return $twig;
    }
}

class FooObject
{
    public static $called = ['__toString' => 0, 'foo' => 0, 'getFooBar' => 0];

    public $bar = 'bar';

    public static function reset()
    {
        self::$called = ['__toString' => 0, 'foo' => 0, 'getFooBar' => 0];
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
