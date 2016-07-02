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
 * H2oView
 *
 * The H2oView is a custom View class which provides support for the H2o templating system (http://www.h2o-template.org).
 *
 * @package Slim
 * @author  Cenan Ozen <http://cenanozen.com/>
 */
class H2o extends \Slim\View
{
	/**
	 * @var string The path to the h2o.php WITH a trailing slash
	 */
	public static $h2o_directory = '';

	/**
	 * @var array H2o options, see H2o documentation for reference
	 */
	public static $h2o_options = array();

	/**
	 * Renders a template using h2o
	 *
	 * @param string $template template file name
	 * @return string
	 */
	public function render($template)
	{
		if (!array_key_exists('searchpath', self::$h2o_options)) {
			self::$h2o_options['searchpath'] = $this->getTemplatesDirectory() . '/';
		}
		$this->_load_h2o();
		$h2o = new \H2o($template, self::$h2o_options);

		return $h2o->render($this->data);
	}

	/**
	 * Loads H2o library if it is not already loaded
	 *
	 * @access private
	 * @throws RuntimeException if h2o directory doesn't exist
	 * @return void
	 */
	private function _load_h2o()
	{
		if (class_exists('\H2o')) {
			return;
		}
		if (!is_dir(self::$h2o_directory)) {
			throw new \RuntimeException('h2o directory is invalid');
		}
		require_once self::$h2o_directory . 'h2o.php';
	}
}
