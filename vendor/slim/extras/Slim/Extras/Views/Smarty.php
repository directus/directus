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
 * SmartyView
 *
 * The SmartyView is a custom View class that renders templates using the Smarty
 * template language (http://www.smarty.net).
 *
 * Two fields that you, the developer, will need to change are:
 * - smartyDirectory
 * - smartyTemplatesDirectory
 * - smartyCompileDirectory
 * - smartyCacheDirectory
 *
 * @package Slim
 * @author  Jose da Silva <http://josedasilva.net>
 */
class Smarty extends \Slim\View
{
    /**
     * @var string The path to the Smarty code directory WITHOUT the trailing slash
     */
    public static $smartyDirectory = null;

    /**
     * @var string The path to the Smarty compiled templates folder WITHOUT the trailing slash
     */
    public static $smartyCompileDirectory = null;

    /**
     * @var string The path to the Smarty cache folder WITHOUT the trailing slash
     */
    public static $smartyCacheDirectory = null;

    /**
     * @var string The path to the templates folder WITHOUT the trailing slash
     */
    public static $smartyTemplatesDirectory = 'templates';

    /**
     * @var SmartyExtensions The Smarty extensions directory you want to load plugins from
     */
    public static $smartyExtensions = array();

    /**
     * @var persistent instance of the Smarty object
     */
    private static $smartyInstance = null;

    /**
    * Render Smarty Template
    *
    * This method will output the rendered template content
    *
    * @param    string $template The path to the Smarty template, relative to the  templates directory.
    * @return   void
    */

    public function render($template)
    {
        $instance = self::getInstance();
        $instance->assign($this->data);

        return $instance->fetch($template);
    }

    /**
     * Creates new Smarty object instance if it doesn't already exist, and returns it.
     *
     * @throws RuntimeException If Smarty lib directory does not exist
     * @return Smarty Instance
     */
    public static function getInstance()
    {
        if (!(self::$smartyInstance instanceof \Smarty)) {
            if (!is_dir(self::$smartyDirectory)) {
                throw new \RuntimeException('Cannot set the Smarty lib directory : ' . self::$smartyDirectory . '. Directory does not exist.');
            }
            require_once self::$smartyDirectory . '/Smarty.class.php';
            self::$smartyInstance = new \Smarty();
            self::$smartyInstance->template_dir = is_null(self::$smartyTemplatesDirectory) ? $this->getTemplatesDirectory() : self::$smartyTemplatesDirectory;
            if (self::$smartyExtensions) {
                self::$smartyInstance->addPluginsDir(self::$smartyExtensions);
            }
            if (self::$smartyCompileDirectory) {
                self::$smartyInstance->compile_dir  = self::$smartyCompileDirectory;
            }
            if (self::$smartyCacheDirectory) {
                self::$smartyInstance->cache_dir  = self::$smartyCacheDirectory;
            }
        }

        return self::$smartyInstance;
    }
}
