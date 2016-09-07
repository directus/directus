<?php

/*
 * This file is part of Twig.
 *
 * (c) Fabien Potencier
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */
class Twig_Tests_TemplateTest extends PHPUnit_Framework_TestCase
{
    /**
     * @expectedException LogicException
     */
    public function testDisplayBlocksAcceptTemplateOnlyAsBlocks()
    {
        $template = $this->getMockForAbstractClass('Twig_Template', array(), '', false);
        $template->displayBlock('foo', array(), array('foo' => array(new stdClass(), 'foo')));
    }

    /**
     * @dataProvider getAttributeExceptions
     */
    public function testGetAttributeExceptions($template, $message, $useExt)
    {
        $name = 'index_'.($useExt ? 1 : 0);
        $templates = array(
            $name => $template.$useExt, // appending $useExt makes the template content unique
        );

        $env = new Twig_Environment(new Twig_Loader_Array($templates), array('strict_variables' => true));
        if (!$useExt) {
            $env->addNodeVisitor(new CExtDisablingNodeVisitor());
        }
        $template = $env->loadTemplate($name);

        $context = array(
            'string' => 'foo',
            'null' => null,
            'empty_array' => array(),
            'array' => array('foo' => 'foo'),
            'array_access' => new Twig_TemplateArrayAccessObject(),
            'magic_exception' => new Twig_TemplateMagicPropertyObjectWithException(),
            'object' => new stdClass(),
        );

        try {
            $template->render($context);
            $this->fail('Accessing an invalid attribute should throw an exception.');
        } catch (Twig_Error_Runtime $e) {
            $this->assertSame(sprintf($message, $name), $e->getMessage());
        }
    }

    public function getAttributeExceptions()
    {
        $tests = array(
            array('{{ string["a"] }}', 'Impossible to access a key ("a") on a string variable ("foo") in "%s" at line 1', false),
            array('{{ null["a"] }}', 'Impossible to access a key ("a") on a null variable in "%s" at line 1', false),
            array('{{ empty_array["a"] }}', 'Key "a" does not exist as the array is empty in "%s" at line 1', false),
            array('{{ array["a"] }}', 'Key "a" for array with keys "foo" does not exist in "%s" at line 1', false),
            array('{{ array_access["a"] }}', 'Key "a" in object with ArrayAccess of class "Twig_TemplateArrayAccessObject" does not exist in "%s" at line 1', false),
            array('{{ string.a }}', 'Impossible to access an attribute ("a") on a string variable ("foo") in "%s" at line 1', false),
            array('{{ string.a() }}', 'Impossible to invoke a method ("a") on a string variable ("foo") in "%s" at line 1', false),
            array('{{ null.a }}', 'Impossible to access an attribute ("a") on a null variable in "%s" at line 1', false),
            array('{{ null.a() }}', 'Impossible to invoke a method ("a") on a null variable in "%s" at line 1', false),
            array('{{ empty_array.a }}', 'Key "a" does not exist as the array is empty in "%s" at line 1', false),
            array('{{ array.a }}', 'Key "a" for array with keys "foo" does not exist in "%s" at line 1', false),
            array('{{ attribute(array, -10) }}', 'Key "-10" for array with keys "foo" does not exist in "%s" at line 1', false),
            array('{{ array_access.a }}', 'Neither the property "a" nor one of the methods "a()", "geta()"/"isa()" or "__call()" exist and have public access in class "Twig_TemplateArrayAccessObject" in "%s" at line 1', false),
            array('{% from _self import foo %}{% macro foo(obj) %}{{ obj.missing_method() }}{% endmacro %}{{ foo(array_access) }}', 'Neither the property "missing_method" nor one of the methods "missing_method()", "getmissing_method()"/"ismissing_method()" or "__call()" exist and have public access in class "Twig_TemplateArrayAccessObject" in "%s" at line 1', false),
            array('{{ magic_exception.test }}', 'An exception has been thrown during the rendering of a template ("Hey! Don\'t try to isset me!") in "%s" at line 1.', false),
            array('{{ object["a"] }}', 'Impossible to access a key "a" on an object of class "stdClass" that does not implement ArrayAccess interface in "%s" at line 1', false),
        );

        if (function_exists('twig_template_get_attributes')) {
            foreach (array_slice($tests, 0) as $test) {
                $test[2] = true;
                $tests[] = $test;
            }
        }

        return $tests;
    }

    public function testGetSource()
    {
        $template = new Twig_TemplateTest(new Twig_Environment($this->getMockBuilder('Twig_LoaderInterface')->getMock()), false);

        $this->assertSame("<? */*bar*/ ?>\n", $template->getSource());
    }

    /**
     * @dataProvider getGetAttributeWithSandbox
     */
    public function testGetAttributeWithSandbox($object, $item, $allowed, $useExt)
    {
        $twig = new Twig_Environment($this->getMockBuilder('Twig_LoaderInterface')->getMock());
        $policy = new Twig_Sandbox_SecurityPolicy(array(), array(), array(/*method*/), array(/*prop*/), array());
        $twig->addExtension(new Twig_Extension_Sandbox($policy, !$allowed));
        $template = new Twig_TemplateTest($twig, $useExt);

        try {
            $template->getAttribute($object, $item, array(), 'any');

            if (!$allowed) {
                $this->fail();
            }
        } catch (Twig_Sandbox_SecurityError $e) {
            if ($allowed) {
                $this->fail();
            }

            $this->assertContains('is not allowed', $e->getMessage());
        }
    }

    public function getGetAttributeWithSandbox()
    {
        $tests = array(
            array(new Twig_TemplatePropertyObject(), 'defined', false, false),
            array(new Twig_TemplatePropertyObject(), 'defined', true, false),
            array(new Twig_TemplateMethodObject(), 'defined', false, false),
            array(new Twig_TemplateMethodObject(), 'defined', true, false),
        );

        if (function_exists('twig_template_get_attributes')) {
            foreach (array_slice($tests, 0) as $test) {
                $test[3] = true;
                $tests[] = $test;
            }
        }

        return $tests;
    }

    /**
     * @dataProvider getGetAttributeWithTemplateAsObject
     */
    public function testGetAttributeWithTemplateAsObject($useExt)
    {
        $template = new Twig_TemplateTest(new Twig_Environment($this->getMockBuilder('Twig_LoaderInterface')->getMock()), $useExt);
        $template1 = new Twig_TemplateTest(new Twig_Environment($this->getMockBuilder('Twig_LoaderInterface')->getMock()), false);

        $this->assertInstanceof('Twig_Markup', $template->getAttribute($template1, 'string'));
        $this->assertEquals('some_string', $template->getAttribute($template1, 'string'));

        $this->assertInstanceof('Twig_Markup', $template->getAttribute($template1, 'true'));
        $this->assertEquals('1', $template->getAttribute($template1, 'true'));

        $this->assertInstanceof('Twig_Markup', $template->getAttribute($template1, 'zero'));
        $this->assertEquals('0', $template->getAttribute($template1, 'zero'));

        $this->assertNotInstanceof('Twig_Markup', $template->getAttribute($template1, 'empty'));
        $this->assertSame('', $template->getAttribute($template1, 'empty'));

        $this->assertFalse($template->getAttribute($template1, 'env', array(), Twig_Template::ANY_CALL, true));
        $this->assertFalse($template->getAttribute($template1, 'environment', array(), Twig_Template::ANY_CALL, true));
        $this->assertFalse($template->getAttribute($template1, 'getEnvironment', array(), Twig_Template::METHOD_CALL, true));
        $this->assertFalse($template->getAttribute($template1, 'displayWithErrorHandling', array(), Twig_Template::METHOD_CALL, true));
    }

    public function getGetAttributeWithTemplateAsObject()
    {
        $bools = array(
            array(false),
        );

        if (function_exists('twig_template_get_attributes')) {
            $bools[] = array(true);
        }

        return $bools;
    }

    /**
     * @dataProvider getTestsDependingOnExtensionAvailability
     */
    public function testGetAttributeOnArrayWithConfusableKey($useExt = false)
    {
        $template = new Twig_TemplateTest(
            new Twig_Environment($this->getMockBuilder('Twig_LoaderInterface')->getMock()),
            $useExt
        );

        $array = array('Zero', 'One', -1 => 'MinusOne', '' => 'EmptyString', '1.5' => 'FloatButString', '01' => 'IntegerButStringWithLeadingZeros');

        $this->assertSame('Zero', $array[false]);
        $this->assertSame('One', $array[true]);
        $this->assertSame('One', $array[1.5]);
        $this->assertSame('One', $array['1']);
        $this->assertSame('MinusOne', $array[-1.5]);
        $this->assertSame('FloatButString', $array['1.5']);
        $this->assertSame('IntegerButStringWithLeadingZeros', $array['01']);
        $this->assertSame('EmptyString', $array[null]);

        $this->assertSame('Zero', $template->getAttribute($array, false), 'false is treated as 0 when accessing an array (equals PHP behavior)');
        $this->assertSame('One', $template->getAttribute($array, true), 'true is treated as 1 when accessing an array (equals PHP behavior)');
        $this->assertSame('One', $template->getAttribute($array, 1.5), 'float is casted to int when accessing an array (equals PHP behavior)');
        $this->assertSame('One', $template->getAttribute($array, '1'), '"1" is treated as integer 1 when accessing an array (equals PHP behavior)');
        $this->assertSame('MinusOne', $template->getAttribute($array, -1.5), 'negative float is casted to int when accessing an array (equals PHP behavior)');
        $this->assertSame('FloatButString', $template->getAttribute($array, '1.5'), '"1.5" is treated as-is when accessing an array (equals PHP behavior)');
        $this->assertSame('IntegerButStringWithLeadingZeros', $template->getAttribute($array, '01'), '"01" is treated as-is when accessing an array (equals PHP behavior)');
        $this->assertSame('EmptyString', $template->getAttribute($array, null), 'null is treated as "" when accessing an array (equals PHP behavior)');
    }

    public function getTestsDependingOnExtensionAvailability()
    {
        if (function_exists('twig_template_get_attributes')) {
            return array(array(false), array(true));
        }

        return array(array(false));
    }

    /**
     * @dataProvider getGetAttributeTests
     */
    public function testGetAttribute($defined, $value, $object, $item, $arguments, $type, $useExt = false)
    {
        $template = new Twig_TemplateTest(new Twig_Environment($this->getMockBuilder('Twig_LoaderInterface')->getMock()), $useExt);

        $this->assertEquals($value, $template->getAttribute($object, $item, $arguments, $type));
    }

    /**
     * @dataProvider getGetAttributeTests
     */
    public function testGetAttributeStrict($defined, $value, $object, $item, $arguments, $type, $useExt = false, $exceptionMessage = null)
    {
        $template = new Twig_TemplateTest(new Twig_Environment($this->getMockBuilder('Twig_LoaderInterface')->getMock(), array('strict_variables' => true)), $useExt);

        if ($defined) {
            $this->assertEquals($value, $template->getAttribute($object, $item, $arguments, $type));
        } else {
            try {
                $this->assertEquals($value, $template->getAttribute($object, $item, $arguments, $type));

                throw new Exception('Expected Twig_Error_Runtime exception.');
            } catch (Twig_Error_Runtime $e) {
                if (null !== $exceptionMessage) {
                    $this->assertSame($exceptionMessage, $e->getMessage());
                }
            }
        }
    }

    /**
     * @dataProvider getGetAttributeTests
     */
    public function testGetAttributeDefined($defined, $value, $object, $item, $arguments, $type, $useExt = false)
    {
        $template = new Twig_TemplateTest(new Twig_Environment($this->getMockBuilder('Twig_LoaderInterface')->getMock()), $useExt);

        $this->assertEquals($defined, $template->getAttribute($object, $item, $arguments, $type, true));
    }

    /**
     * @dataProvider getGetAttributeTests
     */
    public function testGetAttributeDefinedStrict($defined, $value, $object, $item, $arguments, $type, $useExt = false)
    {
        $template = new Twig_TemplateTest(new Twig_Environment($this->getMockBuilder('Twig_LoaderInterface')->getMock(), array('strict_variables' => true)), $useExt);

        $this->assertEquals($defined, $template->getAttribute($object, $item, $arguments, $type, true));
    }

    /**
     * @dataProvider getTestsDependingOnExtensionAvailability
     */
    public function testGetAttributeCallExceptions($useExt = false)
    {
        $template = new Twig_TemplateTest(new Twig_Environment($this->getMockBuilder('Twig_LoaderInterface')->getMock()), $useExt);

        $object = new Twig_TemplateMagicMethodExceptionObject();

        $this->assertNull($template->getAttribute($object, 'foo'));
    }

    public function getGetAttributeTests()
    {
        $array = array(
            'defined' => 'defined',
            'zero' => 0,
            'null' => null,
            '1' => 1,
            'bar' => true,
            '09' => '09',
            '+4' => '+4',
        );

        $objectArray = new Twig_TemplateArrayAccessObject();
        $stdObject = (object) $array;
        $magicPropertyObject = new Twig_TemplateMagicPropertyObject();
        $propertyObject = new Twig_TemplatePropertyObject();
        $propertyObject1 = new Twig_TemplatePropertyObjectAndIterator();
        $propertyObject2 = new Twig_TemplatePropertyObjectAndArrayAccess();
        $propertyObject3 = new Twig_TemplatePropertyObjectDefinedWithUndefinedValue();
        $methodObject = new Twig_TemplateMethodObject();
        $magicMethodObject = new Twig_TemplateMagicMethodObject();

        $anyType = Twig_Template::ANY_CALL;
        $methodType = Twig_Template::METHOD_CALL;
        $arrayType = Twig_Template::ARRAY_CALL;

        $basicTests = array(
            // array(defined, value, property to fetch)
            array(true,  'defined', 'defined'),
            array(false, null,      'undefined'),
            array(false, null,      'protected'),
            array(true,  0,         'zero'),
            array(true,  1,         1),
            array(true,  1,         1.0),
            array(true,  null,      'null'),
            array(true,  true,      'bar'),
            array(true,  '09',      '09'),
            array(true,  '+4',      '+4'),
        );
        $testObjects = array(
            // array(object, type of fetch)
            array($array,               $arrayType),
            array($objectArray,         $arrayType),
            array($stdObject,           $anyType),
            array($magicPropertyObject, $anyType),
            array($methodObject,        $methodType),
            array($methodObject,        $anyType),
            array($propertyObject,      $anyType),
            array($propertyObject1,     $anyType),
            array($propertyObject2,     $anyType),
        );

        $tests = array();
        foreach ($testObjects as $testObject) {
            foreach ($basicTests as $test) {
                // properties cannot be numbers
                if (($testObject[0] instanceof stdClass || $testObject[0] instanceof Twig_TemplatePropertyObject) && is_numeric($test[2])) {
                    continue;
                }

                if ('+4' === $test[2] && $methodObject === $testObject[0]) {
                    continue;
                }

                $tests[] = array($test[0], $test[1], $testObject[0], $test[2], array(), $testObject[1]);
            }
        }

        // additional properties tests
        $tests = array_merge($tests, array(
            array(true, null, $propertyObject3, 'foo', array(), $anyType),
        ));

        // additional method tests
        $tests = array_merge($tests, array(
            array(true, 'defined', $methodObject, 'defined',    array(), $methodType),
            array(true, 'defined', $methodObject, 'DEFINED',    array(), $methodType),
            array(true, 'defined', $methodObject, 'getDefined', array(), $methodType),
            array(true, 'defined', $methodObject, 'GETDEFINED', array(), $methodType),
            array(true, 'static',  $methodObject, 'static',     array(), $methodType),
            array(true, 'static',  $methodObject, 'getStatic',  array(), $methodType),

            array(true, '__call_undefined', $magicMethodObject, 'undefined', array(), $methodType),
            array(true, '__call_UNDEFINED', $magicMethodObject, 'UNDEFINED', array(), $methodType),
        ));

        // add the same tests for the any type
        foreach ($tests as $test) {
            if ($anyType !== $test[5]) {
                $test[5] = $anyType;
                $tests[] = $test;
            }
        }

        $methodAndPropObject = new Twig_TemplateMethodAndPropObject();

        // additional method tests
        $tests = array_merge($tests, array(
            array(true, 'a', $methodAndPropObject, 'a', array(), $anyType),
            array(true, 'a', $methodAndPropObject, 'a', array(), $methodType),
            array(false, null, $methodAndPropObject, 'a', array(), $arrayType),

            array(true, 'b_prop', $methodAndPropObject, 'b', array(), $anyType),
            array(true, 'b', $methodAndPropObject, 'B', array(), $anyType),
            array(true, 'b', $methodAndPropObject, 'b', array(), $methodType),
            array(true, 'b', $methodAndPropObject, 'B', array(), $methodType),
            array(false, null, $methodAndPropObject, 'b', array(), $arrayType),

            array(false, null, $methodAndPropObject, 'c', array(), $anyType),
            array(false, null, $methodAndPropObject, 'c', array(), $methodType),
            array(false, null, $methodAndPropObject, 'c', array(), $arrayType),

        ));

        // tests when input is not an array or object
        $tests = array_merge($tests, array(
            array(false, null, 42, 'a', array(), $anyType, false, 'Impossible to access an attribute ("a") on a integer variable ("42")'),
            array(false, null, 'string', 'a', array(), $anyType, false, 'Impossible to access an attribute ("a") on a string variable ("string")'),
            array(false, null, array(), 'a', array(), $anyType, false, 'Key "a" does not exist as the array is empty'),
        ));

        // add twig_template_get_attributes tests

        if (function_exists('twig_template_get_attributes')) {
            foreach (array_slice($tests, 0) as $test) {
                $test = array_pad($test, 7, null);
                $test[6] = true;
                $tests[] = $test;
            }
        }

        return $tests;
    }
}

class Twig_TemplateTest extends Twig_Template
{
    protected $useExtGetAttribute = false;

    public function __construct(Twig_Environment $env, $useExtGetAttribute = false)
    {
        parent::__construct($env);
        $this->useExtGetAttribute = $useExtGetAttribute;
        self::$cache = array();
    }

    public function getZero()
    {
        return 0;
    }

    public function getEmpty()
    {
        return '';
    }

    public function getString()
    {
        return 'some_string';
    }

    public function getTrue()
    {
        return true;
    }

    public function getTemplateName()
    {
    }

    public function getDebugInfo()
    {
        return array();
    }

    protected function doGetParent(array $context)
    {
    }

    protected function doDisplay(array $context, array $blocks = array())
    {
    }

    public function getAttribute($object, $item, array $arguments = array(), $type = Twig_Template::ANY_CALL, $isDefinedTest = false, $ignoreStrictCheck = false)
    {
        if ($this->useExtGetAttribute) {
            return twig_template_get_attributes($this, $object, $item, $arguments, $type, $isDefinedTest, $ignoreStrictCheck);
        } else {
            return parent::getAttribute($object, $item, $arguments, $type, $isDefinedTest, $ignoreStrictCheck);
        }
    }
}
/* <? *//* *bar*//*  ?>*/
/* */

class Twig_TemplateArrayAccessObject implements ArrayAccess
{
    protected $protected = 'protected';

    public $attributes = array(
        'defined' => 'defined',
        'zero' => 0,
        'null' => null,
        '1' => 1,
        'bar' => true,
        '09' => '09',
        '+4' => '+4',
    );

    public function offsetExists($name)
    {
        return array_key_exists($name, $this->attributes);
    }

    public function offsetGet($name)
    {
        return array_key_exists($name, $this->attributes) ? $this->attributes[$name] : null;
    }

    public function offsetSet($name, $value)
    {
    }

    public function offsetUnset($name)
    {
    }
}

class Twig_TemplateMagicPropertyObject
{
    public $defined = 'defined';

    public $attributes = array(
        'zero' => 0,
        'null' => null,
        '1' => 1,
        'bar' => true,
        '09' => '09',
        '+4' => '+4',
    );

    protected $protected = 'protected';

    public function __isset($name)
    {
        return array_key_exists($name, $this->attributes);
    }

    public function __get($name)
    {
        return array_key_exists($name, $this->attributes) ? $this->attributes[$name] : null;
    }
}

class Twig_TemplateMagicPropertyObjectWithException
{
    public function __isset($key)
    {
        throw new Exception('Hey! Don\'t try to isset me!');
    }
}

class Twig_TemplatePropertyObject
{
    public $defined = 'defined';
    public $zero = 0;
    public $null = null;
    public $bar = true;

    protected $protected = 'protected';
}

class Twig_TemplatePropertyObjectAndIterator extends Twig_TemplatePropertyObject implements IteratorAggregate
{
    public function getIterator()
    {
        return new ArrayIterator(array('foo', 'bar'));
    }
}

class Twig_TemplatePropertyObjectAndArrayAccess extends Twig_TemplatePropertyObject implements ArrayAccess
{
    private $data = array();

    public function offsetExists($offset)
    {
        return array_key_exists($offset, $this->data);
    }

    public function offsetGet($offset)
    {
        return $this->offsetExists($offset) ? $this->data[$offset] : 'n/a';
    }

    public function offsetSet($offset, $value)
    {
    }

    public function offsetUnset($offset)
    {
    }
}

class Twig_TemplatePropertyObjectDefinedWithUndefinedValue
{
    public $foo;

    public function __construct()
    {
        $this->foo = @$notExist;
    }
}

class Twig_TemplateMethodObject
{
    public function getDefined()
    {
        return 'defined';
    }

    public function get1()
    {
        return 1;
    }

    public function get09()
    {
        return '09';
    }

    public function getZero()
    {
        return 0;
    }

    public function getNull()
    {
    }

    public function isBar()
    {
        return true;
    }

    protected function getProtected()
    {
        return 'protected';
    }

    public static function getStatic()
    {
        return 'static';
    }
}

class Twig_TemplateMethodAndPropObject
{
    private $a = 'a_prop';
    public function getA()
    {
        return 'a';
    }

    public $b = 'b_prop';
    public function getB()
    {
        return 'b';
    }

    private $c = 'c_prop';
    private function getC()
    {
        return 'c';
    }
}

class Twig_TemplateMagicMethodObject
{
    public function __call($method, $arguments)
    {
        return '__call_'.$method;
    }
}

class Twig_TemplateMagicMethodExceptionObject
{
    public function __call($method, $arguments)
    {
        throw new BadMethodCallException(sprintf('Unknown method "%s".', $method));
    }
}

class CExtDisablingNodeVisitor implements Twig_NodeVisitorInterface
{
    public function enterNode(Twig_NodeInterface $node, Twig_Environment $env)
    {
        if ($node instanceof Twig_Node_Expression_GetAttr) {
            $node->setAttribute('disable_c_ext', true);
        }

        return $node;
    }

    public function leaveNode(Twig_NodeInterface $node, Twig_Environment $env)
    {
        return $node;
    }

    public function getPriority()
    {
        return 0;
    }
}
