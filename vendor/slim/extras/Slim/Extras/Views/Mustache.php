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
     * Renders a template using Mustache.php.
     *
     * @see View::render()
     * @param string $template The template name specified in Slim::render()
     * @return string
     */
    public function render($template)
    {
        require_once self::$mustacheDirectory . '/Autoloader.php';
        \Mustache_Autoloader::register(dirname(self::$mustacheDirectory));
        $m = new \Mustache_Engine();
        $contents = file_get_contents($this->getTemplatesDirectory() . '/' . ltrim($template, '/'));
        return $m->render($contents, $this->data);
    }
}
