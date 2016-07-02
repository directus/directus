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
 * RainView
 *
 * The RainView is a Custom View class that renders templates using the
 * Rain template language (http://www.raintpl.com/).
 *
 * There are three fields that you, the developer, will need to change:
 * - rainDirectory
 * - rainTemplatesDirectory
 * - rainCacheDirectory
 *
 * @package Slim
 * @author  Matthew Callis <http://superfamicom.org/>
 */
class Rain extends \Slim\View
{
	/**
	 * @var string The path to the directory containing "rain.tpl.class.php" without trailing slash.
	 */
	public static $rainDirectory = null;

	/**
	 * @var persistent instance of the Smarty object
	 */
	private static $rainInstance = null;

	/**
	 * @var string The path to the templates folder WITH the trailing slash
	 */
	public static $rainTemplatesDirectory = 'templates/';

	/**
	 * @var string The path to the cache folder WITH the trailing slash
	 */
	public static $rainCacheDirectory = null;

	/**
	 * Renders a template using Rain.php.
	 *
	 * @see View::render()
	 * @param string $template The template name specified in Slim::render()
	 * @return string
	 */
	public function render($template)
	{
		$rain = $this->getInstance();
		$rain->assign($this->data);

		return $rain->draw($template, $return_string = true);
	}

	/**
	 * Creates new Rain instance if it doesn't already exist, and returns it.
	 *
     * @throws RuntimeException If Rain lib directory does not exist.
	 * @return RainInstance
	 */
	private function getInstance()
	{
		if (!self::$rainInstance) {
            if (!is_dir(self::$rainDirectory)) {
                throw new \RuntimeException('Cannot set the Rain lib directory : ' . self::$rainDirectory . '. Directory does not exist.');
            }
			require_once self::$rainDirectory . '/rain.tpl.class.php';
			\raintpl::$tpl_dir = self::$rainTemplatesDirectory;
			\raintpl::$cache_dir = self::$rainCacheDirectory;
			self::$rainInstance = new \raintpl();
		}

		return self::$rainInstance;
	}
}
