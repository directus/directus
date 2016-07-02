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
 * TwigView
 *
 * The TwigView is a custom View class that renders templates using the Twig
 * template language (http://www.twig-project.org/).
 *
 * Two fields that you, the developer, will need to change are:
 * - twigDirectory
 * - twigOptions
 */
class Twig extends \Slim\View
{
    /**
     * @var string The path to the Twig code directory WITHOUT the trailing slash
     */
    public static $twigDirectory = null;

    /**
     * @var array Paths to directories to attempt to load Twig template from
     */
    public static $twigTemplateDirs = array();

    /**
     * @var array The options for the Twig environment, see
     * http://www.twig-project.org/book/03-Twig-for-Developers
     */
    public static $twigOptions = array();

    /**
     * @var TwigExtension The Twig extensions you want to load
     */
    public static $twigExtensions = array();

    /**
     * @var TwigEnvironment The Twig environment for rendering templates.
     */
    private $twigEnvironment = null;

    /**
     * Get a list of template directories
     *
     * Returns an array of templates defined by self::$twigTemplateDirs, falls
     * back to Slim\View's built-in getTemplatesDirectory method.
     *
     * @return array
     **/
    private function getTemplateDirs()
    {
        if (empty(self::$twigTemplateDirs)) {
            return array($this->getTemplatesDirectory());
        }
        return self::$twigTemplateDirs;
    }

    /**
     * Render Twig Template
     *
     * This method will output the rendered template content
     *
     * @param   string $template The path to the Twig template, relative to the Twig templates directory.
     * @return  void
     */
    public function render($template)
    {
        $env = $this->getEnvironment();
        $template = $env->loadTemplate($template);

        return $template->render($this->data);
    }

    /**
     * Creates new TwigEnvironment if it doesn't already exist, and returns it.
     *
     * @return Twig_Environment
     */
    public function getEnvironment()
    {
        if (!$this->twigEnvironment) {
            // Check for Composer Package Autoloader class loading
            if (!class_exists('\Twig_Autoloader')) {
                require_once self::$twigDirectory . '/Autoloader.php';
            }

            \Twig_Autoloader::register();
            $loader = new \Twig_Loader_Filesystem($this->getTemplateDirs());
            $this->twigEnvironment = new \Twig_Environment(
                $loader,
                self::$twigOptions
            );

            // Check for Composer Package Autoloader class loading
            if (!class_exists('\Twig_Extensions_Autoloader')) {
                $extension_autoloader = dirname(__FILE__) . '/Extension/TwigAutoloader.php';
                if (file_exists($extension_autoloader)) require_once $extension_autoloader;
            }

            if (class_exists('\Twig_Extensions_Autoloader')) {
                \Twig_Extensions_Autoloader::register();

                foreach (self::$twigExtensions as $ext) {
                    $extension = is_object($ext) ? $ext : new $ext;
                    $this->twigEnvironment->addExtension($extension);
                }
            }
        }

        return $this->twigEnvironment;
    }
}
