<?php

/*
 * This file is part of Twig.
 *
 * (c) Fabien Potencier
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

class Twig_Tests_ErrorTest extends \PHPUnit\Framework\TestCase
{
    public function testErrorWithObjectFilename()
    {
        $error = new Twig_Error('foo');
        $error->setSourceContext(new Twig_Source('', new SplFileInfo(__FILE__)));

        $this->assertContains('test'.DIRECTORY_SEPARATOR.'Twig'.DIRECTORY_SEPARATOR.'Tests'.DIRECTORY_SEPARATOR.'ErrorTest.php', $error->getMessage());
    }

    public function testErrorWithArrayFilename()
    {
        $error = new Twig_Error('foo');
        $error->setSourceContext(new Twig_Source('', array('foo' => 'bar')));

        $this->assertEquals('foo in {"foo":"bar"}', $error->getMessage());
    }

    public function testTwigExceptionGuessWithMissingVarAndArrayLoader()
    {
        $loader = new Twig_Loader_Array(array(
            'base.html' => '{% block content %}{% endblock %}',
            'index.html' => <<<EOHTML
{% extends 'base.html' %}
{% block content %}
    {{ foo.bar }}
{% endblock %}
{% block foo %}
    {{ foo.bar }}
{% endblock %}
EOHTML
        ));

        $twig = new Twig_Environment($loader, array('strict_variables' => true, 'debug' => true, 'cache' => false));

        $template = $twig->loadTemplate('index.html');
        try {
            $template->render(array());

            $this->fail();
        } catch (Twig_Error_Runtime $e) {
            $this->assertEquals('Variable "foo" does not exist in "index.html" at line 3.', $e->getMessage());
            $this->assertEquals(3, $e->getTemplateLine());
            $this->assertEquals('index.html', $e->getSourceContext()->getName());
        }
    }

    public function testTwigExceptionGuessWithExceptionAndArrayLoader()
    {
        $loader = new Twig_Loader_Array(array(
            'base.html' => '{% block content %}{% endblock %}',
            'index.html' => <<<EOHTML
{% extends 'base.html' %}
{% block content %}
    {{ foo.bar }}
{% endblock %}
{% block foo %}
    {{ foo.bar }}
{% endblock %}
EOHTML
        ));
        $twig = new Twig_Environment($loader, array('strict_variables' => true, 'debug' => true, 'cache' => false));

        $template = $twig->loadTemplate('index.html');
        try {
            $template->render(array('foo' => new Twig_Tests_ErrorTest_Foo()));

            $this->fail();
        } catch (Twig_Error_Runtime $e) {
            $this->assertEquals('An exception has been thrown during the rendering of a template ("Runtime error...") in "index.html" at line 3.', $e->getMessage());
            $this->assertEquals(3, $e->getTemplateLine());
            $this->assertEquals('index.html', $e->getSourceContext()->getName());
        }
    }

    public function testTwigExceptionGuessWithMissingVarAndFilesystemLoader()
    {
        $loader = new Twig_Loader_Filesystem(__DIR__.'/Fixtures/errors');
        $twig = new Twig_Environment($loader, array('strict_variables' => true, 'debug' => true, 'cache' => false));

        $template = $twig->loadTemplate('index.html');
        try {
            $template->render(array());

            $this->fail();
        } catch (Twig_Error_Runtime $e) {
            $this->assertEquals('Variable "foo" does not exist.', $e->getMessage());
            $this->assertEquals(3, $e->getTemplateLine());
            $this->assertEquals('index.html', $e->getSourceContext()->getName());
            $this->assertEquals(3, $e->getLine());
            $this->assertEquals(strtr(__DIR__.'/Fixtures/errors/index.html', '/', DIRECTORY_SEPARATOR), $e->getFile());
        }
    }

    public function testTwigExceptionGuessWithExceptionAndFilesystemLoader()
    {
        $loader = new Twig_Loader_Filesystem(__DIR__.'/Fixtures/errors');
        $twig = new Twig_Environment($loader, array('strict_variables' => true, 'debug' => true, 'cache' => false));

        $template = $twig->loadTemplate('index.html');
        try {
            $template->render(array('foo' => new Twig_Tests_ErrorTest_Foo()));

            $this->fail();
        } catch (Twig_Error_Runtime $e) {
            $this->assertEquals('An exception has been thrown during the rendering of a template ("Runtime error...").', $e->getMessage());
            $this->assertEquals(3, $e->getTemplateLine());
            $this->assertEquals('index.html', $e->getSourceContext()->getName());
            $this->assertEquals(3, $e->getLine());
            $this->assertEquals(strtr(__DIR__.'/Fixtures/errors/index.html', '/', DIRECTORY_SEPARATOR), $e->getFile());
        }
    }

    /**
     * @dataProvider getErroredTemplates
     */
    public function testTwigExceptionAddsFileAndLine($templates, $name, $line)
    {
        $loader = new Twig_Loader_Array($templates);
        $twig = new Twig_Environment($loader, array('strict_variables' => true, 'debug' => true, 'cache' => false));

        $template = $twig->loadTemplate('index');

        try {
            $template->render(array());

            $this->fail();
        } catch (Twig_Error_Runtime $e) {
            $this->assertEquals(sprintf('Variable "foo" does not exist in "%s" at line %d.', $name, $line), $e->getMessage());
            $this->assertEquals($line, $e->getTemplateLine());
            $this->assertEquals($name, $e->getSourceContext()->getName());
        }

        try {
            $template->render(array('foo' => new Twig_Tests_ErrorTest_Foo()));

            $this->fail();
        } catch (Twig_Error_Runtime $e) {
            $this->assertEquals(sprintf('An exception has been thrown during the rendering of a template ("Runtime error...") in "%s" at line %d.', $name, $line), $e->getMessage());
            $this->assertEquals($line, $e->getTemplateLine());
            $this->assertEquals($name, $e->getSourceContext()->getName());
        }
    }

    public function getErroredTemplates()
    {
        return array(
            // error occurs in a template
            array(
                array(
                    'index' => "\n\n{{ foo.bar }}\n\n\n{{ 'foo' }}",
                ),
                'index', 3,
            ),

            // error occurs in an included template
            array(
                array(
                    'index' => "{% include 'partial' %}",
                    'partial' => '{{ foo.bar }}',
                ),
                'partial', 1,
            ),

            // error occurs in a parent block when called via parent()
            array(
                array(
                    'index' => "{% extends 'base' %}
                    {% block content %}
                        {{ parent() }}
                    {% endblock %}",
                    'base' => '{% block content %}{{ foo.bar }}{% endblock %}',
                ),
                'base', 1,
            ),

            // error occurs in a block from the child
            array(
                array(
                    'index' => "{% extends 'base' %}
                    {% block content %}
                        {{ foo.bar }}
                    {% endblock %}
                    {% block foo %}
                        {{ foo.bar }}
                    {% endblock %}",
                    'base' => '{% block content %}{% endblock %}',
                ),
                'index', 3,
            ),
        );
    }
}

class Twig_Tests_ErrorTest_Foo
{
    public function bar()
    {
        throw new Exception('Runtime error...');
    }
}
