<?php

/*
 * This file is part of Twig.
 *
 * (c) Fabien Potencier
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

require_once dirname(__FILE__).'/FilesystemHelper.php';

class Twig_Tests_EnvironmentTest extends \PHPUnit\Framework\TestCase
{
    private $deprecations = array();

    /**
     * @group legacy
     */
    public function testLegacyTokenizeSignature()
    {
        $env = new Twig_Environment();
        $stream = $env->tokenize('{{ foo }}', 'foo');
        $this->assertEquals('{{ foo }}', $stream->getSource());
        $this->assertEquals('foo', $stream->getFilename());
    }

    /**
     * @group legacy
     */
    public function testLegacyCompileSourceSignature()
    {
        $loader = new Twig_Loader_Array(array('foo' => '{{ foo }}'));
        $env = new Twig_Environment($loader);
        $this->assertContains('getTemplateName', $env->compileSource('{{ foo }}', 'foo'));
    }

    /**
     * @expectedException        LogicException
     * @expectedExceptionMessage You must set a loader first.
     * @group legacy
     */
    public function testRenderNoLoader()
    {
        $env = new Twig_Environment();
        $env->render('test');
    }

    public function testAutoescapeOption()
    {
        $loader = new Twig_Loader_Array(array(
            'html' => '{{ foo }} {{ foo }}',
            'js' => '{{ bar }} {{ bar }}',
        ));

        $twig = new Twig_Environment($loader, array(
            'debug' => true,
            'cache' => false,
            'autoescape' => array($this, 'escapingStrategyCallback'),
        ));

        $this->assertEquals('foo&lt;br/ &gt; foo&lt;br/ &gt;', $twig->render('html', array('foo' => 'foo<br/ >')));
        $this->assertEquals('foo\x3Cbr\x2F\x20\x3E foo\x3Cbr\x2F\x20\x3E', $twig->render('js', array('bar' => 'foo<br/ >')));
    }

    public function escapingStrategyCallback($name)
    {
        return $name;
    }

    public function testGlobals()
    {
        // to be removed in 2.0
        $loader = $this->getMockBuilder('Twig_EnvironmentTestLoaderInterface')->getMock();
        //$loader = $this->getMockBuilder(array('Twig_LoaderInterface', 'Twig_SourceContextLoaderInterface'))->getMock();
        $loader->expects($this->any())->method('getSourceContext')->will($this->returnValue(new Twig_Source('', '')));

        // globals can be added after calling getGlobals

        $twig = new Twig_Environment($loader);
        $twig->addGlobal('foo', 'foo');
        $twig->getGlobals();
        $twig->addGlobal('foo', 'bar');
        $globals = $twig->getGlobals();
        $this->assertEquals('bar', $globals['foo']);

        // globals can be modified after a template has been loaded
        $twig = new Twig_Environment($loader);
        $twig->addGlobal('foo', 'foo');
        $twig->getGlobals();
        $twig->loadTemplate('index');
        $twig->addGlobal('foo', 'bar');
        $globals = $twig->getGlobals();
        $this->assertEquals('bar', $globals['foo']);

        // globals can be modified after extensions init
        $twig = new Twig_Environment($loader);
        $twig->addGlobal('foo', 'foo');
        $twig->getGlobals();
        $twig->getFunctions();
        $twig->addGlobal('foo', 'bar');
        $globals = $twig->getGlobals();
        $this->assertEquals('bar', $globals['foo']);

        // globals can be modified after extensions and a template has been loaded
        $arrayLoader = new Twig_Loader_Array(array('index' => '{{foo}}'));
        $twig = new Twig_Environment($arrayLoader);
        $twig->addGlobal('foo', 'foo');
        $twig->getGlobals();
        $twig->getFunctions();
        $twig->loadTemplate('index');
        $twig->addGlobal('foo', 'bar');
        $globals = $twig->getGlobals();
        $this->assertEquals('bar', $globals['foo']);

        $twig = new Twig_Environment($arrayLoader);
        $twig->getGlobals();
        $twig->addGlobal('foo', 'bar');
        $template = $twig->loadTemplate('index');
        $this->assertEquals('bar', $template->render(array()));

        /* to be uncomment in Twig 2.0
        // globals cannot be added after a template has been loaded
        $twig = new Twig_Environment($loader);
        $twig->addGlobal('foo', 'foo');
        $twig->getGlobals();
        $twig->loadTemplate('index');
        try {
            $twig->addGlobal('bar', 'bar');
            $this->fail();
        } catch (LogicException $e) {
            $this->assertFalse(array_key_exists('bar', $twig->getGlobals()));
        }

        // globals cannot be added after extensions init
        $twig = new Twig_Environment($loader);
        $twig->addGlobal('foo', 'foo');
        $twig->getGlobals();
        $twig->getFunctions();
        try {
            $twig->addGlobal('bar', 'bar');
            $this->fail();
        } catch (LogicException $e) {
            $this->assertFalse(array_key_exists('bar', $twig->getGlobals()));
        }

        // globals cannot be added after extensions and a template has been loaded
        $twig = new Twig_Environment($loader);
        $twig->addGlobal('foo', 'foo');
        $twig->getGlobals();
        $twig->getFunctions();
        $twig->loadTemplate('index');
        try {
            $twig->addGlobal('bar', 'bar');
            $this->fail();
        } catch (LogicException $e) {
            $this->assertFalse(array_key_exists('bar', $twig->getGlobals()));
        }

        // test adding globals after a template has been loaded without call to getGlobals
        $twig = new Twig_Environment($loader);
        $twig->loadTemplate('index');
        try {
            $twig->addGlobal('bar', 'bar');
            $this->fail();
        } catch (LogicException $e) {
            $this->assertFalse(array_key_exists('bar', $twig->getGlobals()));
        }
        */
    }

    public function testExtensionsAreNotInitializedWhenRenderingACompiledTemplate()
    {
        $cache = new Twig_Cache_Filesystem($dir = sys_get_temp_dir().'/twig');
        $options = array('cache' => $cache, 'auto_reload' => false, 'debug' => false);

        // force compilation
        $twig = new Twig_Environment($loader = new Twig_Loader_Array(array('index' => '{{ foo }}')), $options);

        $key = $cache->generateKey('index', $twig->getTemplateClass('index'));
        $cache->write($key, $twig->compileSource(new Twig_Source('{{ foo }}', 'index')));

        // check that extensions won't be initialized when rendering a template that is already in the cache
        $twig = $this
            ->getMockBuilder('Twig_Environment')
            ->setConstructorArgs(array($loader, $options))
            ->setMethods(array('initExtensions'))
            ->getMock()
        ;

        $twig->expects($this->never())->method('initExtensions');

        // render template
        $output = $twig->render('index', array('foo' => 'bar'));
        $this->assertEquals('bar', $output);

        Twig_Tests_FilesystemHelper::removeDir($dir);
    }

    public function testAutoReloadCacheMiss()
    {
        $templateName = __FUNCTION__;
        $templateContent = __FUNCTION__;

        $cache = $this->getMockBuilder('Twig_CacheInterface')->getMock();
        $loader = $this->getMockLoader($templateName, $templateContent);
        $twig = new Twig_Environment($loader, array('cache' => $cache, 'auto_reload' => true, 'debug' => false));

        // Cache miss: getTimestamp returns 0 and as a result the load() is
        // skipped.
        $cache->expects($this->once())
            ->method('generateKey')
            ->will($this->returnValue('key'));
        $cache->expects($this->once())
            ->method('getTimestamp')
            ->will($this->returnValue(0));
        $loader->expects($this->never())
            ->method('isFresh');
        $cache->expects($this->once())
            ->method('write');
        $cache->expects($this->once())
            ->method('load');

        $twig->loadTemplate($templateName);
    }

    public function testAutoReloadCacheHit()
    {
        $templateName = __FUNCTION__;
        $templateContent = __FUNCTION__;

        $cache = $this->getMockBuilder('Twig_CacheInterface')->getMock();
        $loader = $this->getMockLoader($templateName, $templateContent);
        $twig = new Twig_Environment($loader, array('cache' => $cache, 'auto_reload' => true, 'debug' => false));

        $now = time();

        // Cache hit: getTimestamp returns something > extension timestamps and
        // the loader returns true for isFresh().
        $cache->expects($this->once())
            ->method('generateKey')
            ->will($this->returnValue('key'));
        $cache->expects($this->once())
            ->method('getTimestamp')
            ->will($this->returnValue($now));
        $loader->expects($this->once())
            ->method('isFresh')
            ->will($this->returnValue(true));
        $cache->expects($this->atLeastOnce())
            ->method('load');

        $twig->loadTemplate($templateName);
    }

    public function testAutoReloadOutdatedCacheHit()
    {
        $templateName = __FUNCTION__;
        $templateContent = __FUNCTION__;

        $cache = $this->getMockBuilder('Twig_CacheInterface')->getMock();
        $loader = $this->getMockLoader($templateName, $templateContent);
        $twig = new Twig_Environment($loader, array('cache' => $cache, 'auto_reload' => true, 'debug' => false));

        $now = time();

        $cache->expects($this->once())
            ->method('generateKey')
            ->will($this->returnValue('key'));
        $cache->expects($this->once())
            ->method('getTimestamp')
            ->will($this->returnValue($now));
        $loader->expects($this->once())
            ->method('isFresh')
            ->will($this->returnValue(false));
        $cache->expects($this->once())
            ->method('write');
        $cache->expects($this->once())
            ->method('load');

        $twig->loadTemplate($templateName);
    }

    /**
     * @group legacy
     */
    public function testHasGetExtensionWithDynamicName()
    {
        $twig = new Twig_Environment($this->getMockBuilder('Twig_LoaderInterface')->getMock());

        $ext1 = new Twig_Tests_EnvironmentTest_Extension_DynamicWithDeprecatedName('ext1');
        $ext2 = new Twig_Tests_EnvironmentTest_Extension_DynamicWithDeprecatedName('ext2');
        $twig->addExtension($ext1);
        $twig->addExtension($ext2);

        $this->assertTrue($twig->hasExtension('ext1'));
        $this->assertTrue($twig->hasExtension('ext2'));

        $this->assertTrue($twig->hasExtension('Twig_Tests_EnvironmentTest_Extension_DynamicWithDeprecatedName'));

        $this->assertSame($ext1, $twig->getExtension('ext1'));
        $this->assertSame($ext2, $twig->getExtension('ext2'));
    }

    public function testHasGetExtensionByClassName()
    {
        $twig = new Twig_Environment($this->getMockBuilder('Twig_LoaderInterface')->getMock());
        $twig->addExtension($ext = new Twig_Tests_EnvironmentTest_Extension());
        $this->assertTrue($twig->hasExtension('Twig_Tests_EnvironmentTest_Extension'));
        $this->assertTrue($twig->hasExtension('\Twig_Tests_EnvironmentTest_Extension'));

        $this->assertSame($ext, $twig->getExtension('Twig_Tests_EnvironmentTest_Extension'));
        $this->assertSame($ext, $twig->getExtension('\Twig_Tests_EnvironmentTest_Extension'));

        $this->assertTrue($twig->hasExtension('Twig\Tests\EnvironmentTest\Extension'));
        $this->assertSame($ext, $twig->getExtension('Twig\Tests\EnvironmentTest\Extension'));
    }

    public function testAddExtension()
    {
        $twig = new Twig_Environment($this->getMockBuilder('Twig_LoaderInterface')->getMock());
        $twig->addExtension(new Twig_Tests_EnvironmentTest_Extension());

        $this->assertArrayHasKey('test', $twig->getTags());
        $this->assertArrayHasKey('foo_filter', $twig->getFilters());
        $this->assertArrayHasKey('foo_function', $twig->getFunctions());
        $this->assertArrayHasKey('foo_test', $twig->getTests());
        $this->assertArrayHasKey('foo_unary', $twig->getUnaryOperators());
        $this->assertArrayHasKey('foo_binary', $twig->getBinaryOperators());
        $this->assertArrayHasKey('foo_global', $twig->getGlobals());
        $visitors = $twig->getNodeVisitors();
        $found = false;
        foreach ($visitors as $visitor) {
            if ($visitor instanceof Twig_Tests_EnvironmentTest_NodeVisitor) {
                $found = true;
            }
        }
        $this->assertTrue($found);
    }

    /**
     * @requires PHP 5.3
     */
    public function testAddExtensionWithDeprecatedGetGlobals()
    {
        $twig = new Twig_Environment($this->getMockBuilder('Twig_LoaderInterface')->getMock());
        $twig->addExtension(new Twig_Tests_EnvironmentTest_Extension_WithGlobals());

        $this->deprecations = array();
        set_error_handler(array($this, 'handleError'));

        $this->assertArrayHasKey('foo_global', $twig->getGlobals());

        $this->assertCount(1, $this->deprecations);
        $this->assertContains('Defining the getGlobals() method in the "Twig_Tests_EnvironmentTest_Extension_WithGlobals" extension ', $this->deprecations[0]);

        restore_error_handler();
    }

    /**
     * @group legacy
     */
    public function testRemoveExtension()
    {
        $twig = new Twig_Environment($this->getMockBuilder('Twig_LoaderInterface')->getMock());
        $twig->addExtension(new Twig_Tests_EnvironmentTest_Extension_WithDeprecatedName());
        $twig->removeExtension('environment_test');

        $this->assertArrayNotHasKey('test', $twig->getTags());
        $this->assertArrayNotHasKey('foo_filter', $twig->getFilters());
        $this->assertArrayNotHasKey('foo_function', $twig->getFunctions());
        $this->assertArrayNotHasKey('foo_test', $twig->getTests());
        $this->assertArrayNotHasKey('foo_unary', $twig->getUnaryOperators());
        $this->assertArrayNotHasKey('foo_binary', $twig->getBinaryOperators());
        $this->assertArrayNotHasKey('foo_global', $twig->getGlobals());
        $this->assertCount(2, $twig->getNodeVisitors());
    }

    public function testAddMockExtension()
    {
        // should be replaced by the following in 2.0 (this current code is just to avoid a dep notice)
        // $extension = $this->getMockBuilder('Twig_Extension')->getMock();
        $extension = eval(<<<EOF
class Twig_Tests_EnvironmentTest_ExtensionInEval extends Twig_Extension
{
}
EOF
        );
        $extension = new Twig_Tests_EnvironmentTest_ExtensionInEval();

        $loader = new Twig_Loader_Array(array('page' => 'hey'));

        $twig = new Twig_Environment($loader);
        $twig->addExtension($extension);

        $this->assertInstanceOf('Twig_ExtensionInterface', $twig->getExtension(get_class($extension)));
        $this->assertTrue($twig->isTemplateFresh('page', time()));
    }

    public function testInitRuntimeWithAnExtensionUsingInitRuntimeNoDeprecation()
    {
        $twig = new Twig_Environment($this->getMockBuilder('Twig_LoaderInterface')->getMock());
        $twig->addExtension(new Twig_Tests_EnvironmentTest_ExtensionWithoutDeprecationInitRuntime());
        $twig->initRuntime();

        // add a dummy assertion here to satisfy PHPUnit, the only thing we want to test is that the code above
        // can be executed without throwing any deprecations
        $this->addToAssertionCount(1);
    }

    /**
     * @requires PHP 5.3
     */
    public function testInitRuntimeWithAnExtensionUsingInitRuntimeDeprecation()
    {
        $twig = new Twig_Environment($this->getMockBuilder('Twig_LoaderInterface')->getMock());
        $twig->addExtension(new Twig_Tests_EnvironmentTest_ExtensionWithDeprecationInitRuntime());

        $this->deprecations = array();
        set_error_handler(array($this, 'handleError'));

        $twig->initRuntime();

        $this->assertCount(1, $this->deprecations);
        $this->assertContains('Defining the initRuntime() method in the "Twig_Tests_EnvironmentTest_ExtensionWithDeprecationInitRuntime" extension is deprecated since version 1.23.', $this->deprecations[0]);

        restore_error_handler();
    }

    public function handleError($type, $msg)
    {
        if (E_USER_DEPRECATED === $type) {
            $this->deprecations[] = $msg;
        }
    }

    /**
     * @requires PHP 5.3
     */
    public function testOverrideExtension()
    {
        $twig = new Twig_Environment($this->getMockBuilder('Twig_LoaderInterface')->getMock());
        $twig->addExtension(new Twig_Tests_EnvironmentTest_ExtensionWithDeprecationInitRuntime());

        $this->deprecations = array();
        set_error_handler(array($this, 'handleError'));

        $twig->addExtension(new Twig_Tests_EnvironmentTest_Extension_WithDeprecatedName());
        $twig->addExtension(new Twig_Tests_EnvironmentTest_Extension_WithDeprecatedName());

        $this->assertCount(1, $this->deprecations);
        $this->assertContains('The possibility to register the same extension twice', $this->deprecations[0]);

        restore_error_handler();
    }

    public function testAddRuntimeLoader()
    {
        $runtimeLoader = $this->getMockBuilder('Twig_RuntimeLoaderInterface')->getMock();
        $runtimeLoader->expects($this->any())->method('load')->will($this->returnValue(new Twig_Tests_EnvironmentTest_Runtime()));

        $loader = new Twig_Loader_Array(array(
            'func_array' => '{{ from_runtime_array("foo") }}',
            'func_array_default' => '{{ from_runtime_array() }}',
            'func_array_named_args' => '{{ from_runtime_array(name="foo") }}',
            'func_string' => '{{ from_runtime_string("foo") }}',
            'func_string_default' => '{{ from_runtime_string() }}',
            'func_string_named_args' => '{{ from_runtime_string(name="foo") }}',
        ));

        $twig = new Twig_Environment($loader);
        $twig->addExtension(new Twig_Tests_EnvironmentTest_ExtensionWithoutRuntime());
        $twig->addRuntimeLoader($runtimeLoader);

        $this->assertEquals('foo', $twig->render('func_array'));
        $this->assertEquals('bar', $twig->render('func_array_default'));
        $this->assertEquals('foo', $twig->render('func_array_named_args'));
        $this->assertEquals('foo', $twig->render('func_string'));
        $this->assertEquals('bar', $twig->render('func_string_default'));
        $this->assertEquals('foo', $twig->render('func_string_named_args'));
    }

    /**
     * @expectedException Twig_Error_Runtime
     * @expectedExceptionMessage Circular reference detected for Twig template "base.html.twig", path: base.html.twig -> base.html.twig in "base.html.twig" at line 1
     */
    public function testFailLoadTemplateOnCircularReference()
    {
        $twig = new Twig_Environment(new Twig_Loader_Array(array(
            'base.html.twig' => '{% extends "base.html.twig" %}',
        )));

        $twig->loadTemplate('base.html.twig');
    }

    /**
     * @expectedException Twig_Error_Runtime
     * @expectedExceptionMessage Circular reference detected for Twig template "base1.html.twig", path: base1.html.twig -> base2.html.twig -> base1.html.twig in "base1.html.twig" at line 1
     */
    public function testFailLoadTemplateOnComplexCircularReference()
    {
        $twig = new Twig_Environment(new Twig_Loader_Array(array(
            'base1.html.twig' => '{% extends "base2.html.twig" %}',
            'base2.html.twig' => '{% extends "base1.html.twig" %}',
        )));

        $twig->loadTemplate('base1.html.twig');
    }

    protected function getMockLoader($templateName, $templateContent)
    {
        // to be removed in 2.0
        $loader = $this->getMockBuilder('Twig_EnvironmentTestLoaderInterface')->getMock();
        //$loader = $this->getMockBuilder(array('Twig_LoaderInterface', 'Twig_SourceContextLoaderInterface'))->getMock();
        $loader->expects($this->any())
          ->method('getSourceContext')
          ->with($templateName)
          ->will($this->returnValue(new Twig_Source($templateContent, $templateName)));
        $loader->expects($this->any())
          ->method('getCacheKey')
          ->with($templateName)
          ->will($this->returnValue($templateName));

        return $loader;
    }
}

class Twig_Tests_EnvironmentTest_Extension_WithGlobals extends Twig_Extension
{
    public function getGlobals()
    {
        return array(
            'foo_global' => 'foo_global',
        );
    }
}

class Twig_Tests_EnvironmentTest_Extension extends Twig_Extension implements Twig_Extension_GlobalsInterface
{
    public function getTokenParsers()
    {
        return array(
            new Twig_Tests_EnvironmentTest_TokenParser(),
        );
    }

    public function getNodeVisitors()
    {
        return array(
            new Twig_Tests_EnvironmentTest_NodeVisitor(),
        );
    }

    public function getFilters()
    {
        return array(
            new Twig_SimpleFilter('foo_filter', 'foo_filter'),
        );
    }

    public function getTests()
    {
        return array(
            new Twig_SimpleTest('foo_test', 'foo_test'),
        );
    }

    public function getFunctions()
    {
        return array(
            new Twig_SimpleFunction('foo_function', 'foo_function'),
        );
    }

    public function getOperators()
    {
        return array(
            array('foo_unary' => array()),
            array('foo_binary' => array()),
        );
    }

    public function getGlobals()
    {
        return array(
            'foo_global' => 'foo_global',
        );
    }
}
class_alias('Twig_Tests_EnvironmentTest_Extension', 'Twig\Tests\EnvironmentTest\Extension', false);

class Twig_Tests_EnvironmentTest_Extension_WithDeprecatedName extends Twig_Extension
{
    public function getName()
    {
        return 'environment_test';
    }
}

class Twig_Tests_EnvironmentTest_Extension_DynamicWithDeprecatedName extends Twig_Extension
{
    private $name;

    public function __construct($name)
    {
        $this->name = $name;
    }

    public function getName()
    {
        return $this->name;
    }
}

class Twig_Tests_EnvironmentTest_TokenParser extends Twig_TokenParser
{
    public function parse(Twig_Token $token)
    {
    }

    public function getTag()
    {
        return 'test';
    }
}

class Twig_Tests_EnvironmentTest_NodeVisitor implements Twig_NodeVisitorInterface
{
    public function enterNode(Twig_NodeInterface $node, Twig_Environment $env)
    {
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

class Twig_Tests_EnvironmentTest_ExtensionWithDeprecationInitRuntime extends Twig_Extension
{
    public function initRuntime(Twig_Environment $env)
    {
    }
}

class Twig_Tests_EnvironmentTest_ExtensionWithoutDeprecationInitRuntime extends Twig_Extension implements Twig_Extension_InitRuntimeInterface
{
    public function initRuntime(Twig_Environment $env)
    {
    }
}

class Twig_Tests_EnvironmentTest_ExtensionWithoutRuntime extends Twig_Extension
{
    public function getFunctions()
    {
        return array(
            new Twig_SimpleFunction('from_runtime_array', array('Twig_Tests_EnvironmentTest_Runtime', 'fromRuntime')),
            new Twig_SimpleFunction('from_runtime_string', 'Twig_Tests_EnvironmentTest_Runtime::fromRuntime'),
        );
    }

    public function getName()
    {
        return 'from_runtime';
    }
}

class Twig_Tests_EnvironmentTest_Runtime
{
    public function fromRuntime($name = 'bar')
    {
        return $name;
    }
}

// to be removed in 2.0
interface Twig_EnvironmentTestLoaderInterface extends Twig_LoaderInterface, Twig_SourceContextLoaderInterface
{
}
