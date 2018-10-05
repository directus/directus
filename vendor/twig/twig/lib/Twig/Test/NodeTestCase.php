<?php

/*
 * This file is part of Twig.
 *
 * (c) Fabien Potencier
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

use PHPUnit\Framework\TestCase;

abstract class Twig_Test_NodeTestCase extends TestCase
{
    abstract public function getTests();

    /**
     * @dataProvider getTests
     */
    public function testCompile($node, $source, $environment = null, $isPattern = false)
    {
        $this->assertNodeCompilation($source, $node, $environment, $isPattern);
    }

    public function assertNodeCompilation($source, Twig_Node $node, Twig_Environment $environment = null, $isPattern = false)
    {
        $compiler = $this->getCompiler($environment);
        $compiler->compile($node);

        if ($isPattern) {
            $this->assertStringMatchesFormat($source, trim($compiler->getSource()));
        } else {
            $this->assertEquals($source, trim($compiler->getSource()));
        }
    }

    protected function getCompiler(Twig_Environment $environment = null)
    {
        return new Twig_Compiler(null === $environment ? $this->getEnvironment() : $environment);
    }

    protected function getEnvironment()
    {
        return new Twig_Environment(new Twig_Loader_Array(array()));
    }

    protected function getVariableGetter($name, $line = false)
    {
        $line = $line > 0 ? "// line {$line}\n" : '';

        return sprintf('%s($context["%s"] ?? null)', $line, $name, $name);
    }

    protected function getAttributeGetter()
    {
        return 'twig_get_attribute($this->env, $this->source, ';
    }
}

class_alias('Twig_Test_NodeTestCase', 'Twig\Test\NodeTestCase', false);
class_exists('Twig_Environment');
class_exists('Twig_Node');
