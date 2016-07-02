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
 * SavantView
 *
 * The SavantView is a Custom View class that renders templates using the
 * Savant3 template language (http://phpsavant.com/).
 *
 * There are two fields that you, the developer, will need to change:
 * - savantDirectory
 * - savantOptions
 *
 * @package Slim
 * @author  Matthew Callis <http://superfamicom.org/>
 */
class Savant extends \Slim\View
{
	/**
	 * @var string The path to the directory containing Savant3.php and the Savant3 folder without trailing slash.
	 */
	public static $savantDirectory = null;

	/**
	 * @var array The options for the Savant3 environment, see http://phpsavant.com/api/Savant3/
	 */
	public static $savantOptions = array('template_path' => 'templates');

	/**
	 * @var persistent instance of the Savant object
	 */
	private static $savantInstance = null;

	/**
	 * Renders a template using Savant3.php.
	 *
	 * @see View::render()
	 * @param string $template The template name specified in Slim::render()
	 * @return string
	 */
	public function render($template)
	{
		$savant = $this->getInstance();
		$savant->assign($this->data);

		return $savant->fetch($template);
	}

	/**
	 * Creates new Savant instance if it doesn't already exist, and returns it.
	 *
     * @throws RuntimeException If Savant3 lib directory does not exist.
	 * @return SavantInstance
	 */
	private function getInstance()
	{
		if (!self::$savantInstance) {
            if (!is_dir(self::$savantDirectory)) {
                throw new \RuntimeException('Cannot set the Savant lib directory : ' . self::$savantDirectory . '. Directory does not exist.');
            }
			require_once self::$savantDirectory . '/Savant3.php';
			self::$savantInstance = new \Savant3(self::$savantOptions);
		}

		return self::$savantInstance;
	}
}
