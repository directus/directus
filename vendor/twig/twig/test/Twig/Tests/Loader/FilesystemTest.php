<?php

/*
 * This file is part of Twig.
 *
 * (c) Fabien Potencier
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

class Twig_Tests_Loader_FilesystemTest extends PHPUnit_Framework_TestCase
{
    /**
     * @dataProvider getSecurityTests
     */
    public function testSecurity($template)
    {
        $loader = new Twig_Loader_Filesystem(array(dirname(__FILE__).'/../Fixtures'));

        try {
            $loader->getCacheKey($template);
            $this->fail();
        } catch (Twig_Error_Loader $e) {
            $this->assertNotContains('Unable to find template', $e->getMessage());
        }
    }

    public function getSecurityTests()
    {
        return array(
            array("AutoloaderTest\0.php"),
            array('..\\AutoloaderTest.php'),
            array('..\\\\\\AutoloaderTest.php'),
            array('../AutoloaderTest.php'),
            array('..////AutoloaderTest.php'),
            array('./../AutoloaderTest.php'),
            array('.\\..\\AutoloaderTest.php'),
            array('././././././../AutoloaderTest.php'),
            array('.\\./.\\./.\\./../AutoloaderTest.php'),
            array('foo/../../AutoloaderTest.php'),
            array('foo\\..\\..\\AutoloaderTest.php'),
            array('foo/../bar/../../AutoloaderTest.php'),
            array('foo/bar/../../../AutoloaderTest.php'),
            array('filters/../../AutoloaderTest.php'),
            array('filters//..//..//AutoloaderTest.php'),
            array('filters\\..\\..\\AutoloaderTest.php'),
            array('filters\\\\..\\\\..\\\\AutoloaderTest.php'),
            array('filters\\//../\\/\\..\\AutoloaderTest.php'),
            array('/../AutoloaderTest.php'),
        );
    }

    public function testPaths()
    {
        $basePath = dirname(__FILE__).'/Fixtures';

        $loader = new Twig_Loader_Filesystem(array($basePath.'/normal', $basePath.'/normal_bis'));
        $loader->setPaths(array($basePath.'/named', $basePath.'/named_bis'), 'named');
        $loader->addPath($basePath.'/named_ter', 'named');
        $loader->addPath($basePath.'/normal_ter');
        $loader->prependPath($basePath.'/normal_final');
        $loader->prependPath($basePath.'/named/../named_quater', 'named');
        $loader->prependPath($basePath.'/named_final', 'named');

        $this->assertEquals(array(
            $basePath.'/normal_final',
            $basePath.'/normal',
            $basePath.'/normal_bis',
            $basePath.'/normal_ter',
        ), $loader->getPaths());
        $this->assertEquals(array(
            $basePath.'/named_final',
            $basePath.'/named/../named_quater',
            $basePath.'/named',
            $basePath.'/named_bis',
            $basePath.'/named_ter',
        ), $loader->getPaths('named'));

        $this->assertEquals(
            realpath($basePath.'/named_quater/named_absolute.html'),
            realpath($loader->getCacheKey('@named/named_absolute.html'))
        );
        $this->assertEquals("path (final)\n", $loader->getSource('index.html'));
        $this->assertEquals("path (final)\n", $loader->getSource('@__main__/index.html'));
        $this->assertEquals("named path (final)\n", $loader->getSource('@named/index.html'));
    }

    public function testEmptyConstructor()
    {
        $loader = new Twig_Loader_Filesystem();
        $this->assertEquals(array(), $loader->getPaths());
    }

    public function testGetNamespaces()
    {
        $loader = new Twig_Loader_Filesystem(sys_get_temp_dir());
        $this->assertEquals(array(Twig_Loader_Filesystem::MAIN_NAMESPACE), $loader->getNamespaces());

        $loader->addPath(sys_get_temp_dir(), 'named');
        $this->assertEquals(array(Twig_Loader_Filesystem::MAIN_NAMESPACE, 'named'), $loader->getNamespaces());
    }

    public function testFindTemplateExceptionNamespace()
    {
        $basePath = dirname(__FILE__).'/Fixtures';

        $loader = new Twig_Loader_Filesystem(array($basePath.'/normal'));
        $loader->addPath($basePath.'/named', 'named');

        try {
            $loader->getSource('@named/nowhere.html');
        } catch (Exception $e) {
            $this->assertInstanceof('Twig_Error_Loader', $e);
            $this->assertContains('Unable to find template "@named/nowhere.html"', $e->getMessage());
        }
    }

    public function testFindTemplateWithCache()
    {
        $basePath = dirname(__FILE__).'/Fixtures';

        $loader = new Twig_Loader_Filesystem(array($basePath.'/normal'));
        $loader->addPath($basePath.'/named', 'named');

        // prime the cache for index.html in the named namespace
        $namedSource = $loader->getSource('@named/index.html');
        $this->assertEquals("named path\n", $namedSource);

        // get index.html from the main namespace
        $this->assertEquals("path\n", $loader->getSource('index.html'));
    }

    public function testLoadTemplateAndRenderBlockWithCache()
    {
        $loader = new Twig_Loader_Filesystem(array());
        $loader->addPath(dirname(__FILE__).'/Fixtures/themes/theme2');
        $loader->addPath(dirname(__FILE__).'/Fixtures/themes/theme1');
        $loader->addPath(dirname(__FILE__).'/Fixtures/themes/theme1', 'default_theme');

        $twig = new Twig_Environment($loader);

        $template = $twig->loadTemplate('blocks.html.twig');
        $this->assertSame('block from theme 1', $template->renderBlock('b1', array()));

        $template = $twig->loadTemplate('blocks.html.twig');
        $this->assertSame('block from theme 2', $template->renderBlock('b2', array()));
    }

    public function getArrayInheritanceTests()
    {
        return array(
            'valid array inheritance' => array('array_inheritance_valid_parent.html.twig'),
            'array inheritance with null first template' => array('array_inheritance_null_parent.html.twig'),
            'array inheritance with empty first template' => array('array_inheritance_empty_parent.html.twig'),
            'array inheritance with non-existent first template' => array('array_inheritance_nonexistent_parent.html.twig'),
        );
    }

    /**
     * @dataProvider getArrayInheritanceTests
     *
     * @param $templateName string Template name with array inheritance
     */
    public function testArrayInheritance($templateName)
    {
        $loader = new Twig_Loader_Filesystem(array());
        $loader->addPath(dirname(__FILE__).'/Fixtures/inheritance');

        $twig = new Twig_Environment($loader);

        $template = $twig->loadTemplate($templateName);
        $this->assertSame('VALID Child', $template->renderBlock('body', array()));
    }
}
