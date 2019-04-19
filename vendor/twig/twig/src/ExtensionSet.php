<?php

/*
 * This file is part of Twig.
 *
 * (c) Fabien Potencier
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Twig;

use Twig\Error\RuntimeError;
use Twig\Extension\ExtensionInterface;
use Twig\Extension\GlobalsInterface;
use Twig\Extension\InitRuntimeInterface;
use Twig\Extension\StagingExtension;
use Twig\NodeVisitor\NodeVisitorInterface;
use Twig\TokenParser\TokenParserInterface;

/**
 * @author Fabien Potencier <fabien@symfony.com>
 *
 * @internal
 */
final class ExtensionSet
{
    private $extensions;
    private $initialized = false;
    private $runtimeInitialized = false;
    private $staging;
    private $parsers;
    private $visitors;
    private $filters;
    private $tests;
    private $functions;
    private $unaryOperators;
    private $binaryOperators;
    private $globals;
    private $functionCallbacks = [];
    private $filterCallbacks = [];
    private $lastModified = 0;

    public function __construct()
    {
        $this->staging = new StagingExtension();
    }

    /**
     * Initializes the runtime environment.
     *
     * @deprecated since Twig 2.7
     */
    public function initRuntime(Environment $env)
    {
        if ($this->runtimeInitialized) {
            return;
        }

        $this->runtimeInitialized = true;

        foreach ($this->extensions as $extension) {
            if ($extension instanceof InitRuntimeInterface) {
                $extension->initRuntime($env);
            }
        }
    }

    public function hasExtension(string $class): bool
    {
        $class = ltrim($class, '\\');
        if (!isset($this->extensions[$class]) && class_exists($class, false)) {
            // For BC/FC with namespaced aliases
            $class = (new \ReflectionClass($class))->name;
        }

        return isset($this->extensions[$class]);
    }

    public function getExtension(string $class): ExtensionInterface
    {
        $class = ltrim($class, '\\');
        if (!isset($this->extensions[$class]) && class_exists($class, false)) {
            // For BC/FC with namespaced aliases
            $class = (new \ReflectionClass($class))->name;
        }

        if (!isset($this->extensions[$class])) {
            throw new RuntimeError(sprintf('The "%s" extension is not enabled.', $class));
        }

        return $this->extensions[$class];
    }

    /**
     * @param ExtensionInterface[] $extensions
     */
    public function setExtensions(array $extensions)
    {
        foreach ($extensions as $extension) {
            $this->addExtension($extension);
        }
    }

    /**
     * @return ExtensionInterface[]
     */
    public function getExtensions(): array
    {
        return $this->extensions;
    }

    public function getSignature(): string
    {
        return json_encode(array_keys($this->extensions));
    }

    public function isInitialized(): bool
    {
        return $this->initialized || $this->runtimeInitialized;
    }

    public function getLastModified(): int
    {
        if (0 !== $this->lastModified) {
            return $this->lastModified;
        }

        foreach ($this->extensions as $extension) {
            $r = new \ReflectionObject($extension);
            if (file_exists($r->getFileName()) && ($extensionTime = filemtime($r->getFileName())) > $this->lastModified) {
                $this->lastModified = $extensionTime;
            }
        }

        return $this->lastModified;
    }

    public function addExtension(ExtensionInterface $extension)
    {
        $class = \get_class($extension);

        if ($this->initialized) {
            throw new \LogicException(sprintf('Unable to register extension "%s" as extensions have already been initialized.', $class));
        }

        if (isset($this->extensions[$class])) {
            throw new \LogicException(sprintf('Unable to register extension "%s" as it is already registered.', $class));
        }

        // For BC/FC with namespaced aliases
        $class = (new \ReflectionClass($class))->name;
        $this->extensions[$class] = $extension;
    }

    public function addFunction(TwigFunction $function)
    {
        if ($this->initialized) {
            throw new \LogicException(sprintf('Unable to add function "%s" as extensions have already been initialized.', $function->getName()));
        }

        $this->staging->addFunction($function);
    }

    /**
     * @return TwigFunction[]
     */
    public function getFunctions(): array
    {
        if (!$this->initialized) {
            $this->initExtensions();
        }

        return $this->functions;
    }

    /**
     * @return TwigFunction|false
     */
    public function getFunction(string $name)
    {
        if (!$this->initialized) {
            $this->initExtensions();
        }

        if (isset($this->functions[$name])) {
            return $this->functions[$name];
        }

        foreach ($this->functions as $pattern => $function) {
            $pattern = str_replace('\\*', '(.*?)', preg_quote($pattern, '#'), $count);

            if ($count && preg_match('#^'.$pattern.'$#', $name, $matches)) {
                array_shift($matches);
                $function->setArguments($matches);

                return $function;
            }
        }

        foreach ($this->functionCallbacks as $callback) {
            if (false !== $function = $callback($name)) {
                return $function;
            }
        }

        return false;
    }

    public function registerUndefinedFunctionCallback(callable $callable)
    {
        $this->functionCallbacks[] = $callable;
    }

    public function addFilter(TwigFilter $filter)
    {
        if ($this->initialized) {
            throw new \LogicException(sprintf('Unable to add filter "%s" as extensions have already been initialized.', $filter->getName()));
        }

        $this->staging->addFilter($filter);
    }

    /**
     * @return TwigFilter[]
     */
    public function getFilters(): array
    {
        if (!$this->initialized) {
            $this->initExtensions();
        }

        return $this->filters;
    }

    /**
     * @return TwigFilter|false
     */
    public function getFilter(string $name)
    {
        if (!$this->initialized) {
            $this->initExtensions();
        }

        if (isset($this->filters[$name])) {
            return $this->filters[$name];
        }

        foreach ($this->filters as $pattern => $filter) {
            $pattern = str_replace('\\*', '(.*?)', preg_quote($pattern, '#'), $count);

            if ($count && preg_match('#^'.$pattern.'$#', $name, $matches)) {
                array_shift($matches);
                $filter->setArguments($matches);

                return $filter;
            }
        }

        foreach ($this->filterCallbacks as $callback) {
            if (false !== $filter = $callback($name)) {
                return $filter;
            }
        }

        return false;
    }

    public function registerUndefinedFilterCallback(callable $callable)
    {
        $this->filterCallbacks[] = $callable;
    }

    public function addNodeVisitor(NodeVisitorInterface $visitor)
    {
        if ($this->initialized) {
            throw new \LogicException('Unable to add a node visitor as extensions have already been initialized.');
        }

        $this->staging->addNodeVisitor($visitor);
    }

    /**
     * @return NodeVisitorInterface[]
     */
    public function getNodeVisitors(): array
    {
        if (!$this->initialized) {
            $this->initExtensions();
        }

        return $this->visitors;
    }

    public function addTokenParser(TokenParserInterface $parser)
    {
        if ($this->initialized) {
            throw new \LogicException('Unable to add a token parser as extensions have already been initialized.');
        }

        $this->staging->addTokenParser($parser);
    }

    /**
     * @return TokenParserInterface[]
     */
    public function getTokenParsers(): array
    {
        if (!$this->initialized) {
            $this->initExtensions();
        }

        return $this->parsers;
    }

    public function getGlobals(): array
    {
        if (null !== $this->globals) {
            return $this->globals;
        }

        $globals = [];
        foreach ($this->extensions as $extension) {
            if (!$extension instanceof GlobalsInterface) {
                continue;
            }

            $extGlobals = $extension->getGlobals();
            if (!\is_array($extGlobals)) {
                throw new \UnexpectedValueException(sprintf('"%s::getGlobals()" must return an array of globals.', \get_class($extension)));
            }

            $globals = array_merge($globals, $extGlobals);
        }

        if ($this->initialized) {
            $this->globals = $globals;
        }

        return $globals;
    }

    public function addTest(TwigTest $test)
    {
        if ($this->initialized) {
            throw new \LogicException(sprintf('Unable to add test "%s" as extensions have already been initialized.', $test->getName()));
        }

        $this->staging->addTest($test);
    }

    /**
     * @return TwigTest[]
     */
    public function getTests(): array
    {
        if (!$this->initialized) {
            $this->initExtensions();
        }

        return $this->tests;
    }

    /**
     * @return TwigTest|false
     */
    public function getTest(string $name)
    {
        if (!$this->initialized) {
            $this->initExtensions();
        }

        if (isset($this->tests[$name])) {
            return $this->tests[$name];
        }

        foreach ($this->tests as $pattern => $test) {
            $pattern = str_replace('\\*', '(.*?)', preg_quote($pattern, '#'), $count);

            if ($count) {
                if (preg_match('#^'.$pattern.'$#', $name, $matches)) {
                    array_shift($matches);
                    $test->setArguments($matches);

                    return $test;
                }
            }
        }

        return false;
    }

    public function getUnaryOperators(): array
    {
        if (!$this->initialized) {
            $this->initExtensions();
        }

        return $this->unaryOperators;
    }

    public function getBinaryOperators(): array
    {
        if (!$this->initialized) {
            $this->initExtensions();
        }

        return $this->binaryOperators;
    }

    private function initExtensions()
    {
        $this->parsers = [];
        $this->filters = [];
        $this->functions = [];
        $this->tests = [];
        $this->visitors = [];
        $this->unaryOperators = [];
        $this->binaryOperators = [];

        foreach ($this->extensions as $extension) {
            $this->initExtension($extension);
        }
        $this->initExtension($this->staging);
        // Done at the end only, so that an exception during initialization does not mark the environment as initialized when catching the exception
        $this->initialized = true;
    }

    private function initExtension(ExtensionInterface $extension)
    {
        // filters
        foreach ($extension->getFilters() as $filter) {
            $this->filters[$filter->getName()] = $filter;
        }

        // functions
        foreach ($extension->getFunctions() as $function) {
            $this->functions[$function->getName()] = $function;
        }

        // tests
        foreach ($extension->getTests() as $test) {
            $this->tests[$test->getName()] = $test;
        }

        // token parsers
        foreach ($extension->getTokenParsers() as $parser) {
            if (!$parser instanceof TokenParserInterface) {
                throw new \LogicException('getTokenParsers() must return an array of \Twig\TokenParser\TokenParserInterface.');
            }

            $this->parsers[] = $parser;
        }

        // node visitors
        foreach ($extension->getNodeVisitors() as $visitor) {
            $this->visitors[] = $visitor;
        }

        // operators
        if ($operators = $extension->getOperators()) {
            if (!\is_array($operators)) {
                throw new \InvalidArgumentException(sprintf('"%s::getOperators()" must return an array with operators, got "%s".', \get_class($extension), \is_object($operators) ? \get_class($operators) : \gettype($operators).(\is_resource($operators) ? '' : '#'.$operators)));
            }

            if (2 !== \count($operators)) {
                throw new \InvalidArgumentException(sprintf('"%s::getOperators()" must return an array of 2 elements, got %d.', \get_class($extension), \count($operators)));
            }

            $this->unaryOperators = array_merge($this->unaryOperators, $operators[0]);
            $this->binaryOperators = array_merge($this->binaryOperators, $operators[1]);
        }
    }
}

class_alias('Twig\ExtensionSet', 'Twig_ExtensionSet');
