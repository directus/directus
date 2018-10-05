<?php
/**
 * Slim Framework (http://slimframework.com)
 *
 * @link      https://github.com/slimphp/Twig-View
 * @copyright Copyright (c) 2011-2015 Josh Lockhart
 * @license   https://github.com/slimphp/Twig-View/blob/master/LICENSE.md (MIT License)
 */
namespace Slim\Views;

use Psr\Http\Message\ResponseInterface;

/**
 * Twig View
 *
 * This class is a Slim Framework view helper built
 * on top of the Twig templating component. Twig is
 * a PHP component created by Fabien Potencier.
 *
 * @link http://twig.sensiolabs.org/
 */
class Twig implements \ArrayAccess
{
    /**
     * Twig loader
     *
     * @var \Twig_LoaderInterface
     */
    protected $loader;

    /**
     * Twig environment
     *
     * @var \Twig_Environment
     */
    protected $environment;

    /**
     * Default view variables
     *
     * @var array
     */
    protected $defaultVariables = [];

    /********************************************************************************
     * Constructors and service provider registration
     *******************************************************************************/

    /**
     * Create new Twig view
     *
     * @param string|array $path     Path(s) to templates directory
     * @param array        $settings Twig environment settings
     */
    public function __construct($path, $settings = [])
    {
        $this->loader = $this->createLoader(is_string($path) ? [$path] : $path);
        $this->environment = new \Twig_Environment($this->loader, $settings);
    }

    /********************************************************************************
     * Methods
     *******************************************************************************/

    /**
     * Proxy method to add an extension to the Twig environment
     *
     * @param \Twig_ExtensionInterface $extension A single extension instance or an array of instances
     */
    public function addExtension(\Twig_ExtensionInterface $extension)
    {
        $this->environment->addExtension($extension);
    }


    /**
     * Fetch rendered template
     *
     * @param  string $template Template pathname relative to templates directory
     * @param  array  $data     Associative array of template variables
     *
     * @return string
     */
    public function fetch($template, $data = [])
    {
        $data = array_merge($this->defaultVariables, $data);

        return $this->environment->render($template, $data);
    }

    /**
     * Fetch rendered block
     *
     * @param  string $template Template pathname relative to templates directory
     * @param  string $block    Name of the block within the template
     * @param  array  $data     Associative array of template variables
     *
     * @return string
     */
    public function fetchBlock($template, $block, $data = [])
    {
        $data = array_merge($this->defaultVariables, $data);

        return $this->environment->loadTemplate($template)->renderBlock($block, $data);
    }

    /**
     * Fetch rendered string
     *
     * @param  string $string String
     * @param  array  $data   Associative array of template variables
     *
     * @return string
     */
    public function fetchFromString($string ="", $data = [])
    {
        $data = array_merge($this->defaultVariables, $data);

        return $this->environment->createTemplate($string)->render($data);
    }

    /**
     * Output rendered template
     *
     * @param ResponseInterface $response
     * @param  string $template Template pathname relative to templates directory
     * @param  array $data Associative array of template variables
     * @return ResponseInterface
     */
    public function render(ResponseInterface $response, $template, $data = [])
    {
         $response->getBody()->write($this->fetch($template, $data));

         return $response;
    }

    /**
     * Create a loader with the given path
     *
     * @param array $paths
     * @return \Twig_Loader_Filesystem
     */
    private function createLoader(array $paths)
    {
        $loader = new \Twig_Loader_Filesystem();

        foreach ($paths as $namespace => $path) {
            if (is_string($namespace)) {
                $loader->setPaths($path, $namespace);
            } else {
                $loader->addPath($path);
            }
        }

        return $loader;
    }

    /********************************************************************************
     * Accessors
     *******************************************************************************/

    /**
     * Return Twig loader
     *
     * @return \Twig_LoaderInterface
     */
    public function getLoader()
    {
        return $this->loader;
    }

    /**
     * Return Twig environment
     *
     * @return \Twig_Environment
     */
    public function getEnvironment()
    {
        return $this->environment;
    }

    /********************************************************************************
     * ArrayAccess interface
     *******************************************************************************/

    /**
     * Does this collection have a given key?
     *
     * @param  string $key The data key
     *
     * @return bool
     */
    public function offsetExists($key)
    {
        return array_key_exists($key, $this->defaultVariables);
    }

    /**
     * Get collection item for key
     *
     * @param string $key The data key
     *
     * @return mixed The key's value, or the default value
     */
    public function offsetGet($key)
    {
        return $this->defaultVariables[$key];
    }

    /**
     * Set collection item
     *
     * @param string $key   The data key
     * @param mixed  $value The data value
     */
    public function offsetSet($key, $value)
    {
        $this->defaultVariables[$key] = $value;
    }

    /**
     * Remove item from collection
     *
     * @param string $key The data key
     */
    public function offsetUnset($key)
    {
        unset($this->defaultVariables[$key]);
    }

    /********************************************************************************
     * Countable interface
     *******************************************************************************/

    /**
     * Get number of items in collection
     *
     * @return int
     */
    public function count()
    {
        return count($this->defaultVariables);
    }

    /********************************************************************************
     * IteratorAggregate interface
     *******************************************************************************/

    /**
     * Get collection iterator
     *
     * @return \ArrayIterator
     */
    public function getIterator()
    {
        return new \ArrayIterator($this->defaultVariables);
    }
}
