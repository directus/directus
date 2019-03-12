<?php

/*
 * This file is part of Twig.
 *
 * (c) Fabien Potencier
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Twig\Extension;

use Twig\NodeVisitor\NodeVisitorInterface;
use Twig\TokenParser\TokenParserInterface;
use Twig\TwigFilter;
use Twig\TwigFunction;
use Twig\TwigTest;

/**
 * Used by \Twig\Environment as a staging area.
 *
 * @author Fabien Potencier <fabien@symfony.com>
 *
 * @internal
 */
final class StagingExtension extends AbstractExtension
{
    private $functions = [];
    private $filters = [];
    private $visitors = [];
    private $tokenParsers = [];
    private $tests = [];

    public function addFunction(TwigFunction $function)
    {
        if (isset($this->functions[$function->getName()])) {
            throw new \LogicException(sprintf('Function "%s" is already registered.', $function->getName()));
        }

        $this->functions[$function->getName()] = $function;
    }

    public function getFunctions()
    {
        return $this->functions;
    }

    public function addFilter(TwigFilter $filter)
    {
        if (isset($this->filters[$filter->getName()])) {
            throw new \LogicException(sprintf('Filter "%s" is already registered.', $filter->getName()));
        }

        $this->filters[$filter->getName()] = $filter;
    }

    public function getFilters()
    {
        return $this->filters;
    }

    public function addNodeVisitor(NodeVisitorInterface $visitor)
    {
        $this->visitors[] = $visitor;
    }

    public function getNodeVisitors()
    {
        return $this->visitors;
    }

    public function addTokenParser(TokenParserInterface $parser)
    {
        if (isset($this->tokenParsers[$parser->getTag()])) {
            throw new \LogicException(sprintf('Tag "%s" is already registered.', $parser->getTag()));
        }

        $this->tokenParsers[$parser->getTag()] = $parser;
    }

    public function getTokenParsers()
    {
        return $this->tokenParsers;
    }

    public function addTest(TwigTest $test)
    {
        if (isset($this->tests[$test->getName()])) {
            throw new \LogicException(sprintf('Test "%s" is already registered.', $test->getTag()));
        }

        $this->tests[$test->getName()] = $test;
    }

    public function getTests()
    {
        return $this->tests;
    }
}

class_alias('Twig\Extension\StagingExtension', 'Twig_Extension_Staging');
