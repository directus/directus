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

    public function addFunction(TwigFunction $function): void
    {
        if (isset($this->functions[$function->getName()])) {
            throw new \LogicException(sprintf('Function "%s" is already registered.', $function->getName()));
        }

        $this->functions[$function->getName()] = $function;
    }

    public function getFunctions(): array
    {
        return $this->functions;
    }

    public function addFilter(TwigFilter $filter): void
    {
        if (isset($this->filters[$filter->getName()])) {
            throw new \LogicException(sprintf('Filter "%s" is already registered.', $filter->getName()));
        }

        $this->filters[$filter->getName()] = $filter;
    }

    public function getFilters(): array
    {
        return $this->filters;
    }

    public function addNodeVisitor(NodeVisitorInterface $visitor): void
    {
        $this->visitors[] = $visitor;
    }

    public function getNodeVisitors(): array
    {
        return $this->visitors;
    }

    public function addTokenParser(TokenParserInterface $parser): void
    {
        if (isset($this->tokenParsers[$parser->getTag()])) {
            throw new \LogicException(sprintf('Tag "%s" is already registered.', $parser->getTag()));
        }

        $this->tokenParsers[$parser->getTag()] = $parser;
    }

    public function getTokenParsers(): array
    {
        return $this->tokenParsers;
    }

    public function addTest(TwigTest $test): void
    {
        if (isset($this->tests[$test->getName()])) {
            throw new \LogicException(sprintf('Test "%s" is already registered.', $test->getName()));
        }

        $this->tests[$test->getName()] = $test;
    }

    public function getTests(): array
    {
        return $this->tests;
    }
}
