<?php

/*
 * This file is part of Twig.
 *
 * (c) 2009 Fabien Potencier
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * Stores the Twig configuration.
 *
 * @author Fabien Potencier <fabien@symfony.com>
 */
class Twig_Environment
{
    const VERSION = '1.27.0';

    protected $charset;
    protected $loader;
    protected $debug;
    protected $autoReload;
    protected $cache;
    protected $lexer;
    protected $parser;
    protected $compiler;
    protected $baseTemplateClass;
    protected $extensions;
    protected $parsers;
    protected $visitors;
    protected $filters;
    protected $tests;
    protected $functions;
    protected $globals;
    protected $runtimeInitialized = false;
    protected $extensionInitialized = false;
    protected $loadedTemplates;
    protected $strictVariables;
    protected $unaryOperators;
    protected $binaryOperators;
    protected $templateClassPrefix = '__TwigTemplate_';
    protected $functionCallbacks = array();
    protected $filterCallbacks = array();
    protected $staging;

    private $originalCache;
    private $bcWriteCacheFile = false;
    private $bcGetCacheFilename = false;
    private $lastModifiedExtension = 0;
    private $extensionsByClass = array();
    private $runtimeLoaders = array();
    private $runtimes = array();
    private $optionsHash;

    /**
     * Constructor.
     *
     * Available options:
     *
     *  * debug: When set to true, it automatically set "auto_reload" to true as
     *           well (default to false).
     *
     *  * charset: The charset used by the templates (default to UTF-8).
     *
     *  * base_template_class: The base template class to use for generated
     *                         templates (default to Twig_Template).
     *
     *  * cache: An absolute path where to store the compiled templates,
     *           a Twig_Cache_Interface implementation,
     *           or false to disable compilation cache (default).
     *
     *  * auto_reload: Whether to reload the template if the original source changed.
     *                 If you don't provide the auto_reload option, it will be
     *                 determined automatically based on the debug value.
     *
     *  * strict_variables: Whether to ignore invalid variables in templates
     *                      (default to false).
     *
     *  * autoescape: Whether to enable auto-escaping (default to html):
     *                  * false: disable auto-escaping
     *                  * true: equivalent to html
     *                  * html, js: set the autoescaping to one of the supported strategies
     *                  * name: set the autoescaping strategy based on the template name extension
     *                  * PHP callback: a PHP callback that returns an escaping strategy based on the template "name"
     *
     *  * optimizations: A flag that indicates which optimizations to apply
     *                   (default to -1 which means that all optimizations are enabled;
     *                   set it to 0 to disable).
     *
     * @param Twig_LoaderInterface $loader  A Twig_LoaderInterface instance
     * @param array                $options An array of options
     */
    public function __construct(Twig_LoaderInterface $loader = null, $options = array())
    {
        if (null !== $loader) {
            $this->setLoader($loader);
        } else {
            @trigger_error('Not passing a Twig_LoaderInterface as the first constructor argument of Twig_Environment is deprecated since version 1.21.', E_USER_DEPRECATED);
        }

        $options = array_merge(array(
            'debug' => false,
            'charset' => 'UTF-8',
            'base_template_class' => 'Twig_Template',
            'strict_variables' => false,
            'autoescape' => 'html',
            'cache' => false,
            'auto_reload' => null,
            'optimizations' => -1,
        ), $options);

        $this->debug = (bool) $options['debug'];
        $this->charset = strtoupper($options['charset']);
        $this->baseTemplateClass = $options['base_template_class'];
        $this->autoReload = null === $options['auto_reload'] ? $this->debug : (bool) $options['auto_reload'];
        $this->strictVariables = (bool) $options['strict_variables'];
        $this->setCache($options['cache']);

        $this->addExtension(new Twig_Extension_Core());
        $this->addExtension(new Twig_Extension_Escaper($options['autoescape']));
        $this->addExtension(new Twig_Extension_Optimizer($options['optimizations']));
        $this->staging = new Twig_Extension_Staging();

        // For BC
        if (is_string($this->originalCache)) {
            $r = new ReflectionMethod($this, 'writeCacheFile');
            if ($r->getDeclaringClass()->getName() !== __CLASS__) {
                @trigger_error('The Twig_Environment::writeCacheFile method is deprecated since version 1.22 and will be removed in Twig 2.0.', E_USER_DEPRECATED);

                $this->bcWriteCacheFile = true;
            }

            $r = new ReflectionMethod($this, 'getCacheFilename');
            if ($r->getDeclaringClass()->getName() !== __CLASS__) {
                @trigger_error('The Twig_Environment::getCacheFilename method is deprecated since version 1.22 and will be removed in Twig 2.0.', E_USER_DEPRECATED);

                $this->bcGetCacheFilename = true;
            }
        }
    }

    /**
     * Gets the base template class for compiled templates.
     *
     * @return string The base template class name
     */
    public function getBaseTemplateClass()
    {
        return $this->baseTemplateClass;
    }

    /**
     * Sets the base template class for compiled templates.
     *
     * @param string $class The base template class name
     */
    public function setBaseTemplateClass($class)
    {
        $this->baseTemplateClass = $class;
        $this->updateOptionsHash();
    }

    /**
     * Enables debugging mode.
     */
    public function enableDebug()
    {
        $this->debug = true;
        $this->updateOptionsHash();
    }

    /**
     * Disables debugging mode.
     */
    public function disableDebug()
    {
        $this->debug = false;
        $this->updateOptionsHash();
    }

    /**
     * Checks if debug mode is enabled.
     *
     * @return bool true if debug mode is enabled, false otherwise
     */
    public function isDebug()
    {
        return $this->debug;
    }

    /**
     * Enables the auto_reload option.
     */
    public function enableAutoReload()
    {
        $this->autoReload = true;
    }

    /**
     * Disables the auto_reload option.
     */
    public function disableAutoReload()
    {
        $this->autoReload = false;
    }

    /**
     * Checks if the auto_reload option is enabled.
     *
     * @return bool true if auto_reload is enabled, false otherwise
     */
    public function isAutoReload()
    {
        return $this->autoReload;
    }

    /**
     * Enables the strict_variables option.
     */
    public function enableStrictVariables()
    {
        $this->strictVariables = true;
        $this->updateOptionsHash();
    }

    /**
     * Disables the strict_variables option.
     */
    public function disableStrictVariables()
    {
        $this->strictVariables = false;
        $this->updateOptionsHash();
    }

    /**
     * Checks if the strict_variables option is enabled.
     *
     * @return bool true if strict_variables is enabled, false otherwise
     */
    public function isStrictVariables()
    {
        return $this->strictVariables;
    }

    /**
     * Gets the current cache implementation.
     *
     * @param bool $original Whether to return the original cache option or the real cache instance
     *
     * @return Twig_CacheInterface|string|false A Twig_CacheInterface implementation,
     *                                          an absolute path to the compiled templates,
     *                                          or false to disable cache
     */
    public function getCache($original = true)
    {
        return $original ? $this->originalCache : $this->cache;
    }

    /**
     * Sets the current cache implementation.
     *
     * @param Twig_CacheInterface|string|false $cache A Twig_CacheInterface implementation,
     *                                                an absolute path to the compiled templates,
     *                                                or false to disable cache
     */
    public function setCache($cache)
    {
        if (is_string($cache)) {
            $this->originalCache = $cache;
            $this->cache = new Twig_Cache_Filesystem($cache);
        } elseif (false === $cache) {
            $this->originalCache = $cache;
            $this->cache = new Twig_Cache_Null();
        } elseif (null === $cache) {
            @trigger_error('Using "null" as the cache strategy is deprecated since version 1.23 and will be removed in Twig 2.0.', E_USER_DEPRECATED);
            $this->originalCache = false;
            $this->cache = new Twig_Cache_Null();
        } elseif ($cache instanceof Twig_CacheInterface) {
            $this->originalCache = $this->cache = $cache;
        } else {
            throw new LogicException(sprintf('Cache can only be a string, false, or a Twig_CacheInterface implementation.'));
        }
    }

    /**
     * Gets the cache filename for a given template.
     *
     * @param string $name The template name
     *
     * @return string|false The cache file name or false when caching is disabled
     *
     * @deprecated since 1.22 (to be removed in 2.0)
     */
    public function getCacheFilename($name)
    {
        @trigger_error(sprintf('The %s method is deprecated since version 1.22 and will be removed in Twig 2.0.', __METHOD__), E_USER_DEPRECATED);

        $key = $this->cache->generateKey($name, $this->getTemplateClass($name));

        return !$key ? false : $key;
    }

    /**
     * Gets the template class associated with the given string.
     *
     * The generated template class is based on the following parameters:
     *
     *  * The cache key for the given template;
     *  * The currently enabled extensions;
     *  * Whether the Twig C extension is available or not;
     *  * PHP version;
     *  * Twig version;
     *  * Options with what environment was created.
     *
     * @param string   $name  The name for which to calculate the template class name
     * @param int|null $index The index if it is an embedded template
     *
     * @return string The template class name
     */
    public function getTemplateClass($name, $index = null)
    {
        $key = $this->getLoader()->getCacheKey($name).$this->optionsHash;

        return $this->templateClassPrefix.hash('sha256', $key).(null === $index ? '' : '_'.$index);
    }

    /**
     * Gets the template class prefix.
     *
     * @return string The template class prefix
     *
     * @deprecated since 1.22 (to be removed in 2.0)
     */
    public function getTemplateClassPrefix()
    {
        @trigger_error(sprintf('The %s method is deprecated since version 1.22 and will be removed in Twig 2.0.', __METHOD__), E_USER_DEPRECATED);

        return $this->templateClassPrefix;
    }

    /**
     * Renders a template.
     *
     * @param string $name    The template name
     * @param array  $context An array of parameters to pass to the template
     *
     * @return string The rendered template
     *
     * @throws Twig_Error_Loader  When the template cannot be found
     * @throws Twig_Error_Syntax  When an error occurred during compilation
     * @throws Twig_Error_Runtime When an error occurred during rendering
     */
    public function render($name, array $context = array())
    {
        return $this->loadTemplate($name)->render($context);
    }

    /**
     * Displays a template.
     *
     * @param string $name    The template name
     * @param array  $context An array of parameters to pass to the template
     *
     * @throws Twig_Error_Loader  When the template cannot be found
     * @throws Twig_Error_Syntax  When an error occurred during compilation
     * @throws Twig_Error_Runtime When an error occurred during rendering
     */
    public function display($name, array $context = array())
    {
        $this->loadTemplate($name)->display($context);
    }

    /**
     * Loads a template by name.
     *
     * @param string $name  The template name
     * @param int    $index The index if it is an embedded template
     *
     * @return Twig_TemplateInterface A template instance representing the given template name
     *
     * @throws Twig_Error_Loader When the template cannot be found
     * @throws Twig_Error_Syntax When an error occurred during compilation
     */
    public function loadTemplate($name, $index = null)
    {
        $cls = $this->getTemplateClass($name, $index);

        if (isset($this->loadedTemplates[$cls])) {
            return $this->loadedTemplates[$cls];
        }

        if (!class_exists($cls, false)) {
            if ($this->bcGetCacheFilename) {
                $key = $this->getCacheFilename($name);
            } else {
                $key = $this->cache->generateKey($name, $cls);
            }

            if (!$this->isAutoReload() || $this->isTemplateFresh($name, $this->cache->getTimestamp($key))) {
                $this->cache->load($key);
            }

            if (!class_exists($cls, false)) {
                $loader = $this->getLoader();
                if (!$loader instanceof Twig_SourceContextLoaderInterface) {
                    $source = new Twig_Source($loader->getSource($name), $name);
                } else {
                    $source = $loader->getSourceContext($name);
                }

                $content = $this->compileSource($source);

                if ($this->bcWriteCacheFile) {
                    $this->writeCacheFile($key, $content);
                } else {
                    $this->cache->write($key, $content);
                }

                eval('?>'.$content);
            }
        }

        if (!$this->runtimeInitialized) {
            $this->initRuntime();
        }

        return $this->loadedTemplates[$cls] = new $cls($this);
    }

    /**
     * Creates a template from source.
     *
     * This method should not be used as a generic way to load templates.
     *
     * @param string $template The template name
     *
     * @return Twig_Template A template instance representing the given template name
     *
     * @throws Twig_Error_Loader When the template cannot be found
     * @throws Twig_Error_Syntax When an error occurred during compilation
     */
    public function createTemplate($template)
    {
        $name = sprintf('__string_template__%s', hash('sha256', uniqid(mt_rand(), true), false));

        $loader = new Twig_Loader_Chain(array(
            new Twig_Loader_Array(array($name => $template)),
            $current = $this->getLoader(),
        ));

        $this->setLoader($loader);
        try {
            $template = $this->loadTemplate($name);
        } catch (Exception $e) {
            $this->setLoader($current);

            throw $e;
        } catch (Throwable $e) {
            $this->setLoader($current);

            throw $e;
        }
        $this->setLoader($current);

        return $template;
    }

    /**
     * Returns true if the template is still fresh.
     *
     * Besides checking the loader for freshness information,
     * this method also checks if the enabled extensions have
     * not changed.
     *
     * @param string $name The template name
     * @param int    $time The last modification time of the cached template
     *
     * @return bool true if the template is fresh, false otherwise
     */
    public function isTemplateFresh($name, $time)
    {
        if (0 === $this->lastModifiedExtension) {
            foreach ($this->extensions as $extension) {
                $r = new ReflectionObject($extension);
                if (file_exists($r->getFileName()) && ($extensionTime = filemtime($r->getFileName())) > $this->lastModifiedExtension) {
                    $this->lastModifiedExtension = $extensionTime;
                }
            }
        }

        return $this->lastModifiedExtension <= $time && $this->getLoader()->isFresh($name, $time);
    }

    /**
     * Tries to load a template consecutively from an array.
     *
     * Similar to loadTemplate() but it also accepts Twig_TemplateInterface instances and an array
     * of templates where each is tried to be loaded.
     *
     * @param string|Twig_Template|array $names A template or an array of templates to try consecutively
     *
     * @return Twig_Template
     *
     * @throws Twig_Error_Loader When none of the templates can be found
     * @throws Twig_Error_Syntax When an error occurred during compilation
     */
    public function resolveTemplate($names)
    {
        if (!is_array($names)) {
            $names = array($names);
        }

        foreach ($names as $name) {
            if ($name instanceof Twig_Template) {
                return $name;
            }

            try {
                return $this->loadTemplate($name);
            } catch (Twig_Error_Loader $e) {
            }
        }

        if (1 === count($names)) {
            throw $e;
        }

        throw new Twig_Error_Loader(sprintf('Unable to find one of the following templates: "%s".', implode('", "', $names)));
    }

    /**
     * Clears the internal template cache.
     *
     * @deprecated since 1.18.3 (to be removed in 2.0)
     */
    public function clearTemplateCache()
    {
        @trigger_error(sprintf('The %s method is deprecated since version 1.18.3 and will be removed in Twig 2.0.', __METHOD__), E_USER_DEPRECATED);

        $this->loadedTemplates = array();
    }

    /**
     * Clears the template cache files on the filesystem.
     *
     * @deprecated since 1.22 (to be removed in 2.0)
     */
    public function clearCacheFiles()
    {
        @trigger_error(sprintf('The %s method is deprecated since version 1.22 and will be removed in Twig 2.0.', __METHOD__), E_USER_DEPRECATED);

        if (is_string($this->originalCache)) {
            foreach (new RecursiveIteratorIterator(new RecursiveDirectoryIterator($this->originalCache), RecursiveIteratorIterator::LEAVES_ONLY) as $file) {
                if ($file->isFile()) {
                    @unlink($file->getPathname());
                }
            }
        }
    }

    /**
     * Gets the Lexer instance.
     *
     * @return Twig_LexerInterface A Twig_LexerInterface instance
     *
     * @deprecated since 1.25 (to be removed in 2.0)
     */
    public function getLexer()
    {
        @trigger_error(sprintf('The %s() method is deprecated since version 1.25 and will be removed in 2.0.', __FUNCTION__), E_USER_DEPRECATED);

        if (null === $this->lexer) {
            $this->lexer = new Twig_Lexer($this);
        }

        return $this->lexer;
    }

    /**
     * Sets the Lexer instance.
     *
     * @param Twig_LexerInterface $lexer A Twig_LexerInterface instance
     */
    public function setLexer(Twig_LexerInterface $lexer)
    {
        $this->lexer = $lexer;
    }

    /**
     * Tokenizes a source code.
     *
     * @param string|Twig_Source $source The template source code
     * @param string             $name   The template name (deprecated)
     *
     * @return Twig_TokenStream A Twig_TokenStream instance
     *
     * @throws Twig_Error_Syntax When the code is syntactically wrong
     */
    public function tokenize($source, $name = null)
    {
        if (!$source instanceof Twig_Source) {
            @trigger_error(sprintf('Passing a string as the $source argument of %s() is deprecated since version 1.27. Pass a Twig_Source instance instead.', __METHOD__), E_USER_DEPRECATED);
            $source = new Twig_Source($source, $name);
        }

        if (null === $this->lexer) {
            $this->lexer = new Twig_Lexer($this);
        }

        return $this->lexer->tokenize($source);
    }

    /**
     * Gets the Parser instance.
     *
     * @return Twig_ParserInterface A Twig_ParserInterface instance
     *
     * @deprecated since 1.25 (to be removed in 2.0)
     */
    public function getParser()
    {
        @trigger_error(sprintf('The %s() method is deprecated since version 1.25 and will be removed in 2.0.', __FUNCTION__), E_USER_DEPRECATED);

        if (null === $this->parser) {
            $this->parser = new Twig_Parser($this);
        }

        return $this->parser;
    }

    /**
     * Sets the Parser instance.
     *
     * @param Twig_ParserInterface $parser A Twig_ParserInterface instance
     */
    public function setParser(Twig_ParserInterface $parser)
    {
        $this->parser = $parser;
    }

    /**
     * Converts a token stream to a node tree.
     *
     * @param Twig_TokenStream $stream A token stream instance
     *
     * @return Twig_Node_Module A node tree
     *
     * @throws Twig_Error_Syntax When the token stream is syntactically or semantically wrong
     */
    public function parse(Twig_TokenStream $stream)
    {
        if (null === $this->parser) {
            $this->parser = new Twig_Parser($this);
        }

        return $this->parser->parse($stream);
    }

    /**
     * Gets the Compiler instance.
     *
     * @return Twig_CompilerInterface A Twig_CompilerInterface instance
     *
     * @deprecated since 1.25 (to be removed in 2.0)
     */
    public function getCompiler()
    {
        @trigger_error(sprintf('The %s() method is deprecated since version 1.25 and will be removed in 2.0.', __FUNCTION__), E_USER_DEPRECATED);

        if (null === $this->compiler) {
            $this->compiler = new Twig_Compiler($this);
        }

        return $this->compiler;
    }

    /**
     * Sets the Compiler instance.
     *
     * @param Twig_CompilerInterface $compiler A Twig_CompilerInterface instance
     */
    public function setCompiler(Twig_CompilerInterface $compiler)
    {
        $this->compiler = $compiler;
    }

    /**
     * Compiles a node and returns the PHP code.
     *
     * @param Twig_NodeInterface $node A Twig_NodeInterface instance
     *
     * @return string The compiled PHP source code
     */
    public function compile(Twig_NodeInterface $node)
    {
        if (null === $this->compiler) {
            $this->compiler = new Twig_Compiler($this);
        }

        return $this->compiler->compile($node)->getSource();
    }

    /**
     * Compiles a template source code.
     *
     * @param string|Twig_Source $source The template source code
     * @param string             $name   The template name (deprecated)
     *
     * @return string The compiled PHP source code
     *
     * @throws Twig_Error_Syntax When there was an error during tokenizing, parsing or compiling
     */
    public function compileSource($source, $name = null)
    {
        if (!$source instanceof Twig_Source) {
            @trigger_error(sprintf('Passing a string as the $source argument of %s() is deprecated since version 1.27. Pass a Twig_Source instance instead.', __METHOD__), E_USER_DEPRECATED);
            $source = new Twig_Source($source, $name);
        }

        try {
            return $this->compile($this->parse($this->tokenize($source)));
        } catch (Twig_Error $e) {
            $e->setTemplateName($source->getName());
            throw $e;
        } catch (Exception $e) {
            throw new Twig_Error_Syntax(sprintf('An exception has been thrown during the compilation of a template ("%s").', $e->getMessage()), -1, $source->getName(), $e);
        }
    }

    /**
     * Sets the Loader instance.
     *
     * @param Twig_LoaderInterface $loader A Twig_LoaderInterface instance
     */
    public function setLoader(Twig_LoaderInterface $loader)
    {
        if (!$loader instanceof Twig_SourceContextLoaderInterface && 0 !== strpos(get_class($loader), 'Mock_Twig_LoaderInterface')) {
            @trigger_error(sprintf('Twig loader "%s" should implement Twig_SourceContextLoaderInterface since version 1.27.', get_class($loader)), E_USER_DEPRECATED);
        }

        $this->loader = $loader;
    }

    /**
     * Gets the Loader instance.
     *
     * @return Twig_LoaderInterface A Twig_LoaderInterface instance
     */
    public function getLoader()
    {
        if (null === $this->loader) {
            throw new LogicException('You must set a loader first.');
        }

        return $this->loader;
    }

    /**
     * Sets the default template charset.
     *
     * @param string $charset The default charset
     */
    public function setCharset($charset)
    {
        $this->charset = strtoupper($charset);
    }

    /**
     * Gets the default template charset.
     *
     * @return string The default charset
     */
    public function getCharset()
    {
        return $this->charset;
    }

    /**
     * Initializes the runtime environment.
     *
     * @deprecated since 1.23 (to be removed in 2.0)
     */
    public function initRuntime()
    {
        $this->runtimeInitialized = true;

        foreach ($this->getExtensions() as $name => $extension) {
            if (!$extension instanceof Twig_Extension_InitRuntimeInterface) {
                $m = new ReflectionMethod($extension, 'initRuntime');

                if ('Twig_Extension' !== $m->getDeclaringClass()->getName()) {
                    @trigger_error(sprintf('Defining the initRuntime() method in the "%s" extension is deprecated since version 1.23. Use the `needs_environment` option to get the Twig_Environment instance in filters, functions, or tests; or explicitly implement Twig_Extension_InitRuntimeInterface if needed (not recommended).', $name), E_USER_DEPRECATED);
                }
            }

            $extension->initRuntime($this);
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
        if (isset($this->extensions[$class])) {
            if ($class !== get_class($this->extensions[$class])) {
                @trigger_error(sprintf('Referencing the "%s" extension by its name (defined by getName()) is deprecated since 1.26 and will be removed in Twig 2.0. Use the Fully Qualified Extension Class Name instead.', $class), E_USER_DEPRECATED);
            }

            return true;
        }

        return isset($this->extensionsByClass[ltrim($class, '\\')]);
    }

    /**
     * Adds a runtime loader.
     */
    public function addRuntimeLoader(Twig_RuntimeLoaderInterface $loader)
    {
        $this->runtimeLoaders[] = $loader;
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

        if (isset($this->extensions[$class])) {
            if ($class !== get_class($this->extensions[$class])) {
                @trigger_error(sprintf('Referencing the "%s" extension by its name (defined by getName()) is deprecated since 1.26 and will be removed in Twig 2.0. Use the Fully Qualified Extension Class Name instead.', $class), E_USER_DEPRECATED);
            }

            return $this->extensions[$class];
        }

        if (!isset($this->extensionsByClass[$class])) {
            throw new Twig_Error_Runtime(sprintf('The "%s" extension is not enabled.', $class));
        }

        return $this->extensionsByClass[$class];
    }

    /**
     * Returns the runtime implementation of a Twig element (filter/function/test).
     *
     * @param string $class A runtime class name
     *
     * @return object The runtime implementation
     *
     * @throws Twig_Error_Runtime When the template cannot be found
     */
    public function getRuntime($class)
    {
        if (isset($this->runtimes[$class])) {
            return $this->runtimes[$class];
        }

        foreach ($this->runtimeLoaders as $loader) {
            if (null !== $runtime = $loader->load($class)) {
                return $this->runtimes[$class] = $runtime;
            }
        }

        throw new Twig_Error_Runtime(sprintf('Unable to load the "%s" runtime.', $class));
    }

    /**
     * Registers an extension.
     *
     * @param Twig_ExtensionInterface $extension A Twig_ExtensionInterface instance
     */
    public function addExtension(Twig_ExtensionInterface $extension)
    {
        if ($this->extensionInitialized) {
            throw new LogicException(sprintf('Unable to register extension "%s" as extensions have already been initialized.', $extension->getName()));
        }

        $class = get_class($extension);
        if ($class !== $extension->getName()) {
            if (isset($this->extensions[$extension->getName()])) {
                unset($this->extensions[$extension->getName()], $this->extensionsByClass[$class]);
                @trigger_error(sprintf('The possibility to register the same extension twice ("%s") is deprecated since version 1.23 and will be removed in Twig 2.0. Use proper PHP inheritance instead.', $extension->getName()), E_USER_DEPRECATED);
            }
        }

        $this->lastModifiedExtension = 0;
        $this->extensionsByClass[$class] = $extension;
        $this->extensions[$extension->getName()] = $extension;
        $this->updateOptionsHash();
    }

    /**
     * Removes an extension by name.
     *
     * This method is deprecated and you should not use it.
     *
     * @param string $name The extension name
     *
     * @deprecated since 1.12 (to be removed in 2.0)
     */
    public function removeExtension($name)
    {
        @trigger_error(sprintf('The %s method is deprecated since version 1.12 and will be removed in Twig 2.0.', __METHOD__), E_USER_DEPRECATED);

        if ($this->extensionInitialized) {
            throw new LogicException(sprintf('Unable to remove extension "%s" as extensions have already been initialized.', $name));
        }

        $class = ltrim($name, '\\');
        if (isset($this->extensions[$class])) {
            if ($class !== get_class($this->extensions[$class])) {
                @trigger_error(sprintf('Referencing the "%s" extension by its name (defined by getName()) is deprecated since 1.26 and will be removed in Twig 2.0. Use the Fully Qualified Extension Class Name instead.', $class), E_USER_DEPRECATED);
            }

            unset($this->extensions[$class]);
        }

        unset($this->extensions[$class]);
        $this->updateOptionsHash();
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
     * @return Twig_ExtensionInterface[] An array of extensions (keys are for internal usage only and should not be relied on)
     */
    public function getExtensions()
    {
        return $this->extensions;
    }

    /**
     * Registers a Token Parser.
     *
     * @param Twig_TokenParserInterface $parser A Twig_TokenParserInterface instance
     */
    public function addTokenParser(Twig_TokenParserInterface $parser)
    {
        if ($this->extensionInitialized) {
            throw new LogicException('Unable to add a token parser as extensions have already been initialized.');
        }

        $this->staging->addTokenParser($parser);
    }

    /**
     * Gets the registered Token Parsers.
     *
     * @return Twig_TokenParserBrokerInterface A broker containing token parsers
     *
     * @internal
     */
    public function getTokenParsers()
    {
        if (!$this->extensionInitialized) {
            $this->initExtensions();
        }

        return $this->parsers;
    }

    /**
     * Gets registered tags.
     *
     * Be warned that this method cannot return tags defined by Twig_TokenParserBrokerInterface classes.
     *
     * @return Twig_TokenParserInterface[] An array of Twig_TokenParserInterface instances
     *
     * @internal
     */
    public function getTags()
    {
        $tags = array();
        foreach ($this->getTokenParsers()->getParsers() as $parser) {
            if ($parser instanceof Twig_TokenParserInterface) {
                $tags[$parser->getTag()] = $parser;
            }
        }

        return $tags;
    }

    /**
     * Registers a Node Visitor.
     *
     * @param Twig_NodeVisitorInterface $visitor A Twig_NodeVisitorInterface instance
     */
    public function addNodeVisitor(Twig_NodeVisitorInterface $visitor)
    {
        if ($this->extensionInitialized) {
            throw new LogicException('Unable to add a node visitor as extensions have already been initialized.');
        }

        $this->staging->addNodeVisitor($visitor);
    }

    /**
     * Gets the registered Node Visitors.
     *
     * @return Twig_NodeVisitorInterface[] An array of Twig_NodeVisitorInterface instances
     *
     * @internal
     */
    public function getNodeVisitors()
    {
        if (!$this->extensionInitialized) {
            $this->initExtensions();
        }

        return $this->visitors;
    }

    /**
     * Registers a Filter.
     *
     * @param string|Twig_SimpleFilter               $name   The filter name or a Twig_SimpleFilter instance
     * @param Twig_FilterInterface|Twig_SimpleFilter $filter A Twig_FilterInterface instance or a Twig_SimpleFilter instance
     */
    public function addFilter($name, $filter = null)
    {
        if (!$name instanceof Twig_SimpleFilter && !($filter instanceof Twig_SimpleFilter || $filter instanceof Twig_FilterInterface)) {
            throw new LogicException('A filter must be an instance of Twig_FilterInterface or Twig_SimpleFilter.');
        }

        if ($name instanceof Twig_SimpleFilter) {
            $filter = $name;
            $name = $filter->getName();
        } else {
            @trigger_error(sprintf('Passing a name as a first argument to the %s method is deprecated since version 1.21. Pass an instance of "Twig_SimpleFilter" instead when defining filter "%s".', __METHOD__, $name), E_USER_DEPRECATED);
        }

        if ($this->extensionInitialized) {
            throw new LogicException(sprintf('Unable to add filter "%s" as extensions have already been initialized.', $name));
        }

        $this->staging->addFilter($name, $filter);
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
     *
     * @internal
     */
    public function getFilter($name)
    {
        if (!$this->extensionInitialized) {
            $this->initExtensions();
        }

        if (isset($this->filters[$name])) {
            return $this->filters[$name];
        }

        foreach ($this->filters as $pattern => $filter) {
            $pattern = str_replace('\\*', '(.*?)', preg_quote($pattern, '#'), $count);

            if ($count) {
                if (preg_match('#^'.$pattern.'$#', $name, $matches)) {
                    array_shift($matches);
                    $filter->setArguments($matches);

                    return $filter;
                }
            }
        }

        foreach ($this->filterCallbacks as $callback) {
            if (false !== $filter = call_user_func($callback, $name)) {
                return $filter;
            }
        }

        return false;
    }

    public function registerUndefinedFilterCallback($callable)
    {
        $this->filterCallbacks[] = $callable;
    }

    /**
     * Gets the registered Filters.
     *
     * Be warned that this method cannot return filters defined with registerUndefinedFilterCallback.
     *
     * @return Twig_FilterInterface[] An array of Twig_FilterInterface instances
     *
     * @see registerUndefinedFilterCallback
     *
     * @internal
     */
    public function getFilters()
    {
        if (!$this->extensionInitialized) {
            $this->initExtensions();
        }

        return $this->filters;
    }

    /**
     * Registers a Test.
     *
     * @param string|Twig_SimpleTest             $name The test name or a Twig_SimpleTest instance
     * @param Twig_TestInterface|Twig_SimpleTest $test A Twig_TestInterface instance or a Twig_SimpleTest instance
     */
    public function addTest($name, $test = null)
    {
        if (!$name instanceof Twig_SimpleTest && !($test instanceof Twig_SimpleTest || $test instanceof Twig_TestInterface)) {
            throw new LogicException('A test must be an instance of Twig_TestInterface or Twig_SimpleTest.');
        }

        if ($name instanceof Twig_SimpleTest) {
            $test = $name;
            $name = $test->getName();
        } else {
            @trigger_error(sprintf('Passing a name as a first argument to the %s method is deprecated since version 1.21. Pass an instance of "Twig_SimpleTest" instead when defining test "%s".', __METHOD__, $name), E_USER_DEPRECATED);
        }

        if ($this->extensionInitialized) {
            throw new LogicException(sprintf('Unable to add test "%s" as extensions have already been initialized.', $name));
        }

        $this->staging->addTest($name, $test);
    }

    /**
     * Gets the registered Tests.
     *
     * @return Twig_TestInterface[] An array of Twig_TestInterface instances
     *
     * @internal
     */
    public function getTests()
    {
        if (!$this->extensionInitialized) {
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
     *
     * @internal
     */
    public function getTest($name)
    {
        if (!$this->extensionInitialized) {
            $this->initExtensions();
        }

        if (isset($this->tests[$name])) {
            return $this->tests[$name];
        }

        return false;
    }

    /**
     * Registers a Function.
     *
     * @param string|Twig_SimpleFunction                 $name     The function name or a Twig_SimpleFunction instance
     * @param Twig_FunctionInterface|Twig_SimpleFunction $function A Twig_FunctionInterface instance or a Twig_SimpleFunction instance
     */
    public function addFunction($name, $function = null)
    {
        if (!$name instanceof Twig_SimpleFunction && !($function instanceof Twig_SimpleFunction || $function instanceof Twig_FunctionInterface)) {
            throw new LogicException('A function must be an instance of Twig_FunctionInterface or Twig_SimpleFunction.');
        }

        if ($name instanceof Twig_SimpleFunction) {
            $function = $name;
            $name = $function->getName();
        } else {
            @trigger_error(sprintf('Passing a name as a first argument to the %s method is deprecated since version 1.21. Pass an instance of "Twig_SimpleFunction" instead when defining function "%s".', __METHOD__, $name), E_USER_DEPRECATED);
        }

        if ($this->extensionInitialized) {
            throw new LogicException(sprintf('Unable to add function "%s" as extensions have already been initialized.', $name));
        }

        $this->staging->addFunction($name, $function);
    }

    /**
     * Get a function by name.
     *
     * Subclasses may override this method and load functions differently;
     * so no list of functions is available.
     *
     * @param string $name function name
     *
     * @return Twig_Function|false A Twig_Function instance or false if the function does not exist
     *
     * @internal
     */
    public function getFunction($name)
    {
        if (!$this->extensionInitialized) {
            $this->initExtensions();
        }

        if (isset($this->functions[$name])) {
            return $this->functions[$name];
        }

        foreach ($this->functions as $pattern => $function) {
            $pattern = str_replace('\\*', '(.*?)', preg_quote($pattern, '#'), $count);

            if ($count) {
                if (preg_match('#^'.$pattern.'$#', $name, $matches)) {
                    array_shift($matches);
                    $function->setArguments($matches);

                    return $function;
                }
            }
        }

        foreach ($this->functionCallbacks as $callback) {
            if (false !== $function = call_user_func($callback, $name)) {
                return $function;
            }
        }

        return false;
    }

    public function registerUndefinedFunctionCallback($callable)
    {
        $this->functionCallbacks[] = $callable;
    }

    /**
     * Gets registered functions.
     *
     * Be warned that this method cannot return functions defined with registerUndefinedFunctionCallback.
     *
     * @return Twig_FunctionInterface[] An array of Twig_FunctionInterface instances
     *
     * @see registerUndefinedFunctionCallback
     *
     * @internal
     */
    public function getFunctions()
    {
        if (!$this->extensionInitialized) {
            $this->initExtensions();
        }

        return $this->functions;
    }

    /**
     * Registers a Global.
     *
     * New globals can be added before compiling or rendering a template;
     * but after, you can only update existing globals.
     *
     * @param string $name  The global name
     * @param mixed  $value The global value
     */
    public function addGlobal($name, $value)
    {
        if ($this->extensionInitialized || $this->runtimeInitialized) {
            if (null === $this->globals) {
                $this->globals = $this->initGlobals();
            }

            if (!array_key_exists($name, $this->globals)) {
                // The deprecation notice must be turned into the following exception in Twig 2.0
                @trigger_error(sprintf('Registering global variable "%s" at runtime or when the extensions have already been initialized is deprecated since version 1.21.', $name), E_USER_DEPRECATED);
                //throw new LogicException(sprintf('Unable to add global "%s" as the runtime or the extensions have already been initialized.', $name));
            }
        }

        if ($this->extensionInitialized || $this->runtimeInitialized) {
            // update the value
            $this->globals[$name] = $value;
        } else {
            $this->staging->addGlobal($name, $value);
        }
    }

    /**
     * Gets the registered Globals.
     *
     * @return array An array of globals
     *
     * @internal
     */
    public function getGlobals()
    {
        if (!$this->runtimeInitialized && !$this->extensionInitialized) {
            return $this->initGlobals();
        }

        if (null === $this->globals) {
            $this->globals = $this->initGlobals();
        }

        return $this->globals;
    }

    /**
     * Merges a context with the defined globals.
     *
     * @param array $context An array representing the context
     *
     * @return array The context merged with the globals
     */
    public function mergeGlobals(array $context)
    {
        // we don't use array_merge as the context being generally
        // bigger than globals, this code is faster.
        foreach ($this->getGlobals() as $key => $value) {
            if (!array_key_exists($key, $context)) {
                $context[$key] = $value;
            }
        }

        return $context;
    }

    /**
     * Gets the registered unary Operators.
     *
     * @return array An array of unary operators
     *
     * @internal
     */
    public function getUnaryOperators()
    {
        if (!$this->extensionInitialized) {
            $this->initExtensions();
        }

        return $this->unaryOperators;
    }

    /**
     * Gets the registered binary Operators.
     *
     * @return array An array of binary operators
     *
     * @internal
     */
    public function getBinaryOperators()
    {
        if (!$this->extensionInitialized) {
            $this->initExtensions();
        }

        return $this->binaryOperators;
    }

    /**
     * @deprecated since 1.23 (to be removed in 2.0)
     */
    public function computeAlternatives($name, $items)
    {
        @trigger_error(sprintf('The %s method is deprecated since version 1.23 and will be removed in Twig 2.0.', __METHOD__), E_USER_DEPRECATED);

        return Twig_Error_Syntax::computeAlternatives($name, $items);
    }

    /**
     * @internal
     */
    protected function initGlobals()
    {
        $globals = array();
        foreach ($this->extensions as $name => $extension) {
            if (!$extension instanceof Twig_Extension_GlobalsInterface) {
                $m = new ReflectionMethod($extension, 'getGlobals');

                if ('Twig_Extension' !== $m->getDeclaringClass()->getName()) {
                    @trigger_error(sprintf('Defining the getGlobals() method in the "%s" extension without explicitly implementing Twig_Extension_GlobalsInterface is deprecated since version 1.23.', $name), E_USER_DEPRECATED);
                }
            }

            $extGlob = $extension->getGlobals();
            if (!is_array($extGlob)) {
                throw new UnexpectedValueException(sprintf('"%s::getGlobals()" must return an array of globals.', get_class($extension)));
            }

            $globals[] = $extGlob;
        }

        $globals[] = $this->staging->getGlobals();

        return call_user_func_array('array_merge', $globals);
    }

    /**
     * @internal
     */
    protected function initExtensions()
    {
        if ($this->extensionInitialized) {
            return;
        }

        $this->extensionInitialized = true;
        $this->parsers = new Twig_TokenParserBroker(array(), array(), false);
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
    }

    /**
     * @internal
     */
    protected function initExtension(Twig_ExtensionInterface $extension)
    {
        // filters
        foreach ($extension->getFilters() as $name => $filter) {
            if ($filter instanceof Twig_SimpleFilter) {
                $name = $filter->getName();
            } else {
                @trigger_error(sprintf('Using an instance of "%s" for filter "%s" is deprecated since version 1.21. Use Twig_SimpleFilter instead.', get_class($filter), $name), E_USER_DEPRECATED);
            }

            $this->filters[$name] = $filter;
        }

        // functions
        foreach ($extension->getFunctions() as $name => $function) {
            if ($function instanceof Twig_SimpleFunction) {
                $name = $function->getName();
            } else {
                @trigger_error(sprintf('Using an instance of "%s" for function "%s" is deprecated since version 1.21. Use Twig_SimpleFunction instead.', get_class($function), $name), E_USER_DEPRECATED);
            }

            $this->functions[$name] = $function;
        }

        // tests
        foreach ($extension->getTests() as $name => $test) {
            if ($test instanceof Twig_SimpleTest) {
                $name = $test->getName();
            } else {
                @trigger_error(sprintf('Using an instance of "%s" for test "%s" is deprecated since version 1.21. Use Twig_SimpleTest instead.', get_class($test), $name), E_USER_DEPRECATED);
            }

            $this->tests[$name] = $test;
        }

        // token parsers
        foreach ($extension->getTokenParsers() as $parser) {
            if ($parser instanceof Twig_TokenParserInterface) {
                $this->parsers->addTokenParser($parser);
            } elseif ($parser instanceof Twig_TokenParserBrokerInterface) {
                @trigger_error('Registering a Twig_TokenParserBrokerInterface instance is deprecated since version 1.21.', E_USER_DEPRECATED);

                $this->parsers->addTokenParserBroker($parser);
            } else {
                throw new LogicException('getTokenParsers() must return an array of Twig_TokenParserInterface or Twig_TokenParserBrokerInterface instances.');
            }
        }

        // node visitors
        foreach ($extension->getNodeVisitors() as $visitor) {
            $this->visitors[] = $visitor;
        }

        // operators
        if ($operators = $extension->getOperators()) {
            if (2 !== count($operators)) {
                throw new InvalidArgumentException(sprintf('"%s::getOperators()" does not return a valid operators array.', get_class($extension)));
            }

            $this->unaryOperators = array_merge($this->unaryOperators, $operators[0]);
            $this->binaryOperators = array_merge($this->binaryOperators, $operators[1]);
        }
    }

    /**
     * @deprecated since 1.22 (to be removed in 2.0)
     */
    protected function writeCacheFile($file, $content)
    {
        $this->cache->write($file, $content);
    }

    private function updateOptionsHash()
    {
        $hashParts = array_merge(
            array_keys($this->extensions),
            array(
                (int) function_exists('twig_template_get_attributes'),
                PHP_MAJOR_VERSION,
                PHP_MINOR_VERSION,
                self::VERSION,
                (int) $this->debug,
                $this->baseTemplateClass,
                (int) $this->strictVariables,
            )
        );
        $this->optionsHash = implode(':', $hashParts);
    }
}
