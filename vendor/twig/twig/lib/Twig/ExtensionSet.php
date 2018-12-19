<?php

/*
 * This file is part of Twig.
 *
 * (c) Fabien Potencier
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * @author Fabien Potencier <fabien@symfony.com>
 *
 * @internal
 */
final class Twig_ExtensionSet
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
    private $functionCallbacks = array();
    private $filterCallbacks = array();
    private $lastModified = 0;

    public function __construct()
    {
        $this->staging = new Twig_Extension_Staging();
    }

    /**
     * Initializes the runtime environment.
     */
    public function initRuntime(Twig_Environment $env)
    {
        if ($this->runtimeInitialized) {
            return;
        }

        $this->runtimeInitialized = true;

        foreach ($this->extensions as $extension) {
            if ($extension instanceof Twig_Extension_InitRuntimeInterface) {
                $extension->initRuntime($env);
            }
        }
    }

    /**
     * Returns true if the given extension is registered.
     *
     * @param string $class The extension class name
     *
     * @return bool Whether the extension is registered or not
     */
    public function hasExtension($class)
    {
        $class = ltrim($class, '\\');
        if (!isset($this->extensions[$class]) && class_exists($class, false)) {
            // For BC/FC with namespaced aliases
            $class = (new ReflectionClass($class))->name;
        }

        return isset($this->extensions[$class]);
    }

    /**
     * Gets an extension by class name.
     *
     * @param string $class The extension class name
     *
     * @return Twig_ExtensionInterface A Twig_ExtensionInterface instance
     */
    public function getExtension($class)
    {
        $class = ltrim($class, '\\');
        if (!isset($this->extensions[$class]) && class_exists($class, false)) {
            // For BC/FC with namespaced aliases
            $class = (new ReflectionClass($class))->name;
        }

        if (!isset($this->extensions[$class])) {
            throw new Twig_Error_Runtime(sprintf('The "%s" extension is not enabled.', $class));
        }

        return $this->extensions[$class];
    }

    /**
     * Registers an array of extensions.
     *
     * @param array $extensions An array of extensions
     */
    public function setExtensions(array $extensions)
    {
        foreach ($extensions as $extension) {
            $this->addExtension($extension);
        }
    }

    /**
     * Returns all registered extensions.
     *
     * @return array An array of extensions
     */
    public function getExtensions()
    {
        return $this->extensions;
    }

    public function getSignature()
    {
        return json_encode(array_keys($this->extensions));
    }

    public function isInitialized()
    {
        return $this->initialized || $this->runtimeInitialized;
    }

    public function getLastModified()
    {
        if (0 !== $this->lastModified) {
            return $this->lastModified;
        }

        foreach ($this->extensions as $extension) {
            $r = new ReflectionObject($extension);
            if (file_exists($r->getFileName()) && ($extensionTime = filemtime($r->getFileName())) > $this->lastModified) {
                $this->lastModified = $extensionTime;
            }
        }

        return $this->lastModified;
    }

    /**
     * Registers an extension.
     *
     * @param Twig_ExtensionInterface $extension A Twig_ExtensionInterface instance
     */
    public function addExtension(Twig_ExtensionInterface $extension)
    {
        $class = get_class($extension);

        if ($this->initialized) {
            throw new LogicException(sprintf('Unable to register extension "%s" as extensions have already been initialized.', $class));
        }

        if (isset($this->extensions[$class])) {
            throw new LogicException(sprintf('Unable to register extension "%s" as it is already registered.', $class));
        }

        // For BC/FC with namespaced aliases
        $class = (new ReflectionClass($class))->name;
        $this->extensions[$class] = $extension;
    }

    public function addFunction(Twig_Function $function)
    {
        if ($this->initialized) {
            throw new LogicException(sprintf('Unable to add function "%s" as extensions have already been initialized.', $function->getName()));
        }

        $this->staging->addFunction($function);
    }

    public function getFunctions()
    {
        if (!$this->initialized) {
            $this->initExtensions();
        }

        return $this->functions;
    }

    /**
     * Get a function by name.
     *
     * @param string $name function name
     *
     * @return Twig_Function|false A Twig_Function instance or false if the function does not exist
     */
    public function getFunction($name)
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

    public function addFilter(Twig_Filter $filter)
    {
        if ($this->initialized) {
            throw new LogicException(sprintf('Unable to add filter "%s" as extensions have already been initialized.', $filter->getName()));
        }

        $this->staging->addFilter($filter);
    }

    public function getFilters()
    {
        if (!$this->initialized) {
            $this->initExtensions();
        }

        return $this->filters;
    }

    /**
     * Get a filter by name.
     *
     * Subclasses may override this method and load filters differently;
     * so no list of filters is available.
     *
     * @param string $name The filter name
     *
     * @return Twig_Filter|false A Twig_Filter instance or false if the filter does not exist
     */
    public function getFilter($name)
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

    public function addNodeVisitor(Twig_NodeVisitorInterface $visitor)
    {
        if ($this->initialized) {
            throw new LogicException('Unable to add a node visitor as extensions have already been initialized.');
        }

        $this->staging->addNodeVisitor($visitor);
    }

    public function getNodeVisitors()
    {
        if (!$this->initialized) {
            $this->initExtensions();
        }

        return $this->visitors;
    }

    public function addTokenParser(Twig_TokenParserInterface $parser)
    {
        if ($this->initialized) {
            throw new LogicException('Unable to add a token parser as extensions have already been initialized.');
        }

        $this->staging->addTokenParser($parser);
    }

    public function getTokenParsers()
    {
        if (!$this->initialized) {
            $this->initExtensions();
        }

        return $this->parsers;
    }

    public function getGlobals()
    {
        if (null !== $this->globals) {
            return $this->globals;
        }

        $globals = array();
        foreach ($this->extensions as $extension) {
            if (!$extension instanceof Twig_Extension_GlobalsInterface) {
                continue;
            }

            $extGlobals = $extension->getGlobals();
            if (!is_array($extGlobals)) {
                throw new UnexpectedValueException(sprintf('"%s::getGlobals()" must return an array of globals.', get_class($extension)));
            }

            $globals = array_merge($globals, $extGlobals);
        }

        if ($this->initialized) {
            $this->globals = $globals;
        }

        return $globals;
    }

    public function addTest(Twig_Test $test)
    {
        if ($this->initialized) {
            throw new LogicException(sprintf('Unable to add test "%s" as extensions have already been initialized.', $test->getName()));
        }

        $this->staging->addTest($test);
    }

    public function getTests()
    {
        if (!$this->initialized) {
            $this->initExtensions();
        }

        return $this->tests;
    }

    /**
     * Gets a test by name.
     *
     * @param string $name The test name
     *
     * @return Twig_Test|false A Twig_Test instance or false if the test does not exist
     */
    public function getTest($name)
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

    /**
     * Gets the registered unary Operators.
     *
     * @return array An array of unary operators
     */
    public function getUnaryOperators()
    {
        if (!$this->initialized) {
            $this->initExtensions();
        }

        return $this->unaryOperators;
    }

    /**
     * Gets the registered binary Operators.
     *
     * @return array An array of binary operators
     */
    public function getBinaryOperators()
    {
        if (!$this->initialized) {
            $this->initExtensions();
        }

        return $this->binaryOperators;
    }

    private function initExtensions()
    {
        $this->parsers = array();
        $this->filters = array();
        $this->functions = array();
        $this->tests = array();
        $this->visitors = array();
        $this->unaryOperators = array();
        $this->binaryOperators = array();

        foreach ($this->extensions as $extension) {
            $this->initExtension($extension);
        }
        $this->initExtension($this->staging);
        // Done at the end only, so that an exception during initialization does not mark the environment as initialized when catching the exception
        $this->initialized = true;
    }

    private function initExtension(Twig_ExtensionInterface $extension)
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
            if (!$parser instanceof Twig_TokenParserInterface) {
                throw new LogicException('getTokenParsers() must return an array of Twig_TokenParserInterface.');
            }

            $this->parsers[] = $parser;
        }

        // node visitors
        foreach ($extension->getNodeVisitors() as $visitor) {
            $this->visitors[] = $visitor;
        }

        // operators
        if ($operators = $extension->getOperators()) {
            if (!is_array($operators)) {
                throw new InvalidArgumentException(sprintf('"%s::getOperators()" must return an array with operators, got "%s".', get_class($extension), is_object($operators) ? get_class($operators) : gettype($operators).(is_resource($operators) ? '' : '#'.$operators)));
            }

            if (2 !== count($operators)) {
                throw new InvalidArgumentException(sprintf('"%s::getOperators()" must return an array of 2 elements, got %d.', get_class($extension), count($operators)));
            }

            $this->unaryOperators = array_merge($this->unaryOperators, $operators[0]);
            $this->binaryOperators = array_merge($this->binaryOperators, $operators[1]);
        }
    }
}

class_alias('Twig_ExtensionSet', 'Twig\ExtensionSet', false);
