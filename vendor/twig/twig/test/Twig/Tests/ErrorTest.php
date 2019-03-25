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
use Twig\Error\Error;
use Twig\Error\RuntimeError;
use Twig\Loader\ArrayLoader;
use Twig\Loader\FilesystemLoader;
use Twig\Source;

class Twig_Tests_ErrorTest extends \PHPUnit\Framework\TestCase
{
    public function testErrorWithObjectFilename()
    {
        $error = new Error('foo');
        $error->setSourceContext(new Source('', new \SplFileInfo(__FILE__)));

        $this->assertContains('test'.DIRECTORY_SEPARATOR.'Twig'.DIRECTORY_SEPARATOR.'Tests'.DIRECTORY_SEPARATOR.'ErrorTest.php', $error->getMessage());
    }

    public function testTwigExceptionGuessWithMissingVarAndArrayLoader()
    {
        $loader = new ArrayLoader([
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
        ]);

        $twig = new Environment($loader, ['strict_variables' => true, 'debug' => true, 'cache' => false]);

        $template = $twig->load('index.html');
        try {
            $template->render([]);

            $this->fail();
        } catch (RuntimeError $e) {
            $this->assertEquals('Variable "foo" does not exist in "index.html" at line 3.', $e->getMessage());
            $this->assertEquals(3, $e->getTemplateLine());
            $this->assertEquals('index.html', $e->getSourceContext()->getName());
        }
    }

    public function testTwigExceptionGuessWithExceptionAndArrayLoader()
    {
        $loader = new ArrayLoader([
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
        ]);
        $twig = new Environment($loader, ['strict_variables' => true, 'debug' => true, 'cache' => false]);

        $template = $twig->load('index.html');
        try {
            $template->render(['foo' => new Twig_Tests_ErrorTest_Foo()]);

            $this->fail();
        } catch (RuntimeError $e) {
            $this->assertEquals('An exception has been thrown during the rendering of a template ("Runtime error...") in "index.html" at line 3.', $e->getMessage());
            $this->assertEquals(3, $e->getTemplateLine());
            $this->assertEquals('index.html', $e->getSourceContext()->getName());
        }
    }

    public function testTwigExceptionGuessWithMissingVarAndFilesystemLoader()
    {
        $loader = new FilesystemLoader(__DIR__.'/Fixtures/errors');
        $twig = new Environment($loader, ['strict_variables' => true, 'debug' => true, 'cache' => false]);

        $template = $twig->load('index.html');
        try {
            $template->render([]);

            $this->fail();
        } catch (RuntimeError $e) {
            $this->assertEquals('Variable "foo" does not exist.', $e->getMessage());
            $this->assertEquals(3, $e->getTemplateLine());
            $this->assertEquals('index.html', $e->getSourceContext()->getName());
            $this->assertEquals(3, $e->getLine());
            $this->assertEquals(strtr(__DIR__.'/Fixtures/errors/index.html', '/', DIRECTORY_SEPARATOR), $e->getFile());
        }
    }

    public function testTwigExceptionGuessWithExceptionAndFilesystemLoader()
    {
        $loader = new FilesystemLoader(__DIR__.'/Fixtures/errors');
        $twig = new Environment($loader, ['strict_variables' => true, 'debug' => true, 'cache' => false]);

        $template = $twig->load('index.html');
        try {
            $template->render(['foo' => new Twig_Tests_ErrorTest_Foo()]);

            $this->fail();
        } catch (RuntimeError $e) {
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
        $loader = new ArrayLoader($templates);
        $twig = new Environment($loader, ['strict_variables' => true, 'debug' => true, 'cache' => false]);

        $template = $twig->load('index');

        try {
            $template->render([]);

            $this->fail();
        } catch (RuntimeError $e) {
            $this->assertEquals(sprintf('Variable "foo" does not exist in "%s" at line %d.', $name, $line), $e->getMessage());
            $this->assertEquals($line, $e->getTemplateLine());
            $this->assertEquals($name, $e->getSourceContext()->getName());
        }

        try {
            $template->render(['foo' => new Twig_Tests_ErrorTest_Foo()]);

            $this->fail();
        } catch (RuntimeError $e) {
            $this->assertEquals(sprintf('An exception has been thrown during the rendering of a template ("Runtime error...") in "%s" at line %d.', $name, $line), $e->getMessage());
            $this->assertEquals($line, $e->getTemplateLine());
            $this->assertEquals($name, $e->getSourceContext()->getName());
        }
    }

    public function getErroredTemplates()
    {
        return [
            // error occurs in a template
            [
                [
                    'index' => "\n\n{{ foo.bar }}\n\n\n{{ 'foo' }}",
                ],
                'index', 3,
            ],

            // error occurs in an included template
            [
                [
                    'index' => "{% include 'partial' %}",
                    'partial' => '{{ foo.bar }}',
                ],
                'partial', 1,
            ],

            // error occurs in a parent block when called via parent()
            [
                [
                    'index' => "{% extends 'base' %}
                    {% block content %}
                        {{ parent() }}
                    {% endblock %}",
                    'base' => '{% block content %}{{ foo.bar }}{% endblock %}',
                ],
                'base', 1,
            ],

            // error occurs in a block from the child
            [
                [
                    'index' => "{% extends 'base' %}
                    {% block content %}
                        {{ foo.bar }}
                    {% endblock %}
                    {% block foo %}
                        {{ foo.bar }}
                    {% endblock %}",
                    'base' => '{% block content %}{% endblock %}',
                ],
                'index', 3,
            ],
        ];
    }
}

class Twig_Tests_ErrorTest_Foo
{
    public function bar()
    {
        throw new \Exception('Runtime error...');
    }
}
