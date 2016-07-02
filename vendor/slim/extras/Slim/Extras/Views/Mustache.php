<?php
/**
 * Slim - a micro PHP 5 framework
 *
 * @author      Josh Lockhart
 * @link        http://www.slimframework.com
 * @copyright   2011 Josh Lockhart
 *
 * MIT LICENSE
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
namespace Slim\Extras\Views;

/**
 * MustacheView
 *
 * The MustacheView is a Custom View class that renders templates using the
 * Mustache template language (http://mustache.github.com/) and the
 * [Mustache.php library](github.com/bobthecow/mustache.php).
 *
 * There is one field that you, the developer, will need to change:
 * - mustacheDirectory
 *
 * @package Slim
 * @author  Johnson Page <http://johnsonpage.org>
 */
class Mustache extends \Slim\View
{
    /**
     * @var string The path to the directory containing Mustache.php
     */
    public static $mustacheDirectory = null;

    /**
     * @var array An array of \Mustache_Engine options
     */
    public static $mustacheOptions = array();

    /**
     * @var \Mustache_Engine A Mustache engine instance for this view
     */
    private $engine = null;

    /**
     * @param array $options \Mustache_Engine configuration options
     */
    public function __construct(array $options = null)
    {
        if ($options !== null) {
            self::$mustacheOptions = $options;
        }
    }

    /**
     * Renders a template using Mustache.php.
     *
     * @see View::render()
     * @param string $template The template name specified in Slim::render()
     * @return string
     */
    public function render($template)
    {
        return $this->getEngine()->render($template, $this->data);
    }

    /**
     * Get a \Mustache_Engine instance.
     *
     * @return \Mustache_Engine
     */
    private function getEngine()
    {
        if (!isset($this->engine)) {
            // Check for Composer autoloading
            if (!class_exists('\Mustache_Engine')) {
                require_once self::$mustacheDirectory . '/Autoloader.php';
                \Mustache_Autoloader::register(dirname(self::$mustacheDirectory));
            }

            $options = self::$mustacheOptions;

            // Autoload templates from the templates directory.
            if (!isset($options['loader'])) {
                $options['loader'] = new \Mustache_Loader_FilesystemLoader($this->getTemplatesDirectory());
            }

            // If a partials loader is not specified, fall back to the default template loader.
            if (!isset($options['partials_loader']) && !isset($options['partials'])) {
                $options['partials_loader'] = $options['loader'];
            }

            $this->engine = new \Mustache_Engine($options);
        }

        return $this->engine;
    }
}
