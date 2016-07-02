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
 * SugarView
 *
 * The SugarView is a Custom View class that renders templates using the
 * Sugar template language (http://php-sugar.net/).
 *
 * There are three fields that you, the developer, will need to change:
 * - sugarDirectory
 * - sugarTemplatesDirectory
 * - sugarCacheDirectory
 *
 * @package Slim
 * @author  Matthew Callis <http://superfamicom.org/>
 */
class Sugar extends \Slim\View
{
	/**
	 * @var string The path to the directory containing the Sugar folder without trailing slash.
	 */
	public static $sugarDirectory = null;

	/**
	 * @var persistent instance of the Smarty object
	 */
	private static $sugarInstance = null;

	/**
	 * @var string The path to the templates folder WITH the trailing slash
	 */
	public static $sugarTemplatesDirectory = 'templates/';

	/**
	 * @var string The path to the cache folder WITH the trailing slash
	 */
	public static $sugarCacheDirectory = null;

	/**
	 * Renders a template using Sugar.php.
	 *
	 * @see View::render()
	 * @param string $template The template name specified in Slim::render()
	 * @return string
	 */
	public function render($template)
	{
		$sugar = $this->getInstance();
		$template = $sugar->getTemplate($template);
		foreach ($this->data as $key => $value) {
			$template->set($key, $value);
		}

		return $template->fetch();
	}

	/**
	 * Creates new Sugar instance if it doesn't already exist, and returns it.
	 *
     * @throws RuntimeException If Sugar lib directory does not exist.
	 * @return SugarInstance
	 */
	private function getInstance()
	{
		if (!self::$sugarInstance) {
            if (!is_dir(self::$sugarDirectory)) {
                throw new \RuntimeException('Cannot set the Sugar lib directory : ' . self::$sugarDirectory . '. Directory does not exist.');
            }
			require_once self::$sugarDirectory . '/Sugar.php';
			self::$sugarInstance = new \Sugar();
			self::$sugarInstance->templateDir = self::$sugarTemplatesDirectory;
			self::$sugarInstance->cacheDir = self::$sugarCacheDirectory;
		}

		return self::$sugarInstance;
	}
}
